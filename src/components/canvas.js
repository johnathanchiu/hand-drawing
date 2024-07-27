import { useEffect, useState, useRef } from "react";
import { DefaultSizeStyle, Tldraw, getSvgPathFromPoints } from "tldraw";

import FloatingMenu from "./menu";

import { createKeyMap, getUserHandGesture } from "../lib/pose";
import { useAnimationFrame } from "../lib/hooks/animation";
import { setupWebcam, teardownWebcam } from "../lib/video";
import { euclideanDistance } from "../lib/utils";
import {
  drawHands,
  drawPath,
  getClientPointFromCanvasPoint,
} from "../lib/draw";

function LaserScribble({ scribble, zoom, color, opacity, className }) {
  if (!scribble.points.length) return null;

  return (
    <svg className={"tl-overlays__item"}>
      <path
        className="tl-scribble"
        d={getSvgPathFromPoints(scribble.points, false)}
        stroke="rgba(255, 0, 0, 0.5)"
        fill="none"
        strokeWidth={8 / zoom}
        opacity={opacity ?? scribble.opacity}
      />
    </svg>
  );
}

async function setupCanvas(video, canvasID) {
  const canvas = document.getElementById(canvasID);
  const ctx = canvas.getContext("2d");

  canvas.width = video.width;
  canvas.height = video.height;

  return [canvas, ctx];
}

export default function CanvasComponent({ detector, isModelLoaded }) {
  const editor = window.editor;
  const videoRef = useRef(null);
  const [floatingCanvasCtx, setFloatingCanvasCtx] = useState(null);

  const [isStreaming, setStreaming] = useState(false);
  const [isDrawing, setDrawing] = useState(false);

  const drawingPointsRef = useRef([]);
  const lastVideoTimeRef = useRef(-1);

  const changeCanvasTool = (gesture) => {
    switch (gesture) {
      case "middle_pinch":
        editor.setCurrentTool("eraser");
        return;
      case "ring_pinch":
        editor.setCurrentTool("select");
        return;
      case "pinky_pinch":
        editor.setCurrentTool("draw");
        return;
      default:
        return;
    }
  };

  const nextDrawingPointIsFarEnough = (trackingPoint, previousPoint) => {
    // Determines if the current point is far enough from the previous point
    return (
      euclideanDistance([
        [trackingPoint.x, previousPoint.x],
        [trackingPoint.y, previousPoint.y],
      ]) >= 0.005
    );
  };

  const draw = (hands) => {
    if (hands.length < 1) {
      setDrawing(false);
      return;
    }

    for (let i = 0; i < hands.length; i++) {
      const [gesture, trackingPoint] = getUserHandGesture(hands[i]);
      changeCanvasTool(gesture);

      // TODO: Make such that if it is in the midst of drawing increase the threshold
      // (due to quick rapid movements that result in the distance being a bit larger and misread)
      // const pinchThreshold = 0.06;

      if (gesture === "index_pinch" && trackingPoint) {
        if (drawingPointsRef.current.length > 0) {
          let previousPoint =
            drawingPointsRef.current[drawingPointsRef.current.length - 1];
          if (!nextDrawingPointIsFarEnough(trackingPoint, previousPoint)) {
            return;
          }
        }

        drawingPointsRef.current = [
          ...drawingPointsRef.current,
          { x: trackingPoint.x, y: trackingPoint.y },
        ];
        setDrawing(true);

        if (!editor.inputs.buttons.has(0)) {
          const point = getClientPointFromCanvasPoint({
            point: trackingPoint,
            editor,
          });

          editor.dispatch({
            type: "pointer",
            target: "canvas",
            name: "pointer_down",
            point,
            pointerId: 0,
            ctrlKey: editor.inputs.ctrlKey,
            altKey: editor.inputs.altKey,
            shiftKey: editor.inputs.shiftKey,
            button: 0,
            isPen: false,
          });
        }

        drawPath(drawingPointsRef.current);
      } else {
        setDrawing(false);
      }
    }
  };

  useEffect(() => {
    async function initialize() {
      if (!videoRef.current) {
        videoRef.current = await setupWebcam();
        console.log("webcam setup!");
      }
      if (!floatingCanvasCtx) {
        const [, ctx] = await setupCanvas(videoRef.current, "float-canvas");
        setFloatingCanvasCtx(ctx);
        console.log("canvas setup!");
      }
    }

    async function destroy() {
      if (videoRef.current) {
        await teardownWebcam(videoRef.current);
        videoRef.current = null;
        console.log("webcam teardown!");
      }
      if (floatingCanvasCtx) {
        setFloatingCanvasCtx(null);
        console.log("canvas teardown!");
      }
    }

    if (isStreaming) {
      initialize();
    } else {
      destroy();
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isDrawing) {
      const lastPoint =
        drawingPointsRef.current[drawingPointsRef.current.length - 1];
      if (lastPoint) {
        const point = getClientPointFromCanvasPoint({
          point: drawingPointsRef.current[drawingPointsRef.current.length - 1],
          editor,
        });
        editor.dispatch({
          type: "pointer",
          target: "canvas",
          name: "pointer_up",
          point,
          pointerId: 0,
          ctrlKey: editor.inputs.ctrlKey,
          altKey: editor.inputs.altKey,
          shiftKey: editor.inputs.shiftKey,
          button: 0,
          isPen: false,
        });
      }
      drawingPointsRef.current = [];
    }
  }, [isDrawing]);

  useAnimationFrame(async (delta) => {
    let hands;
    if (!detector) return;

    let nowInMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;

      hands = await detector.recognizeForVideo(videoRef.current, nowInMs);
      hands = createKeyMap(hands);

      floatingCanvasCtx.clearRect(
        0,
        0,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
      draw(hands);
      drawHands(
        hands,
        videoRef.current.width,
        videoRef.current.height,
        floatingCanvasCtx
      );
    }
  }, isStreaming && isModelLoaded && !!videoRef.current);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <FloatingMenu
        isStreaming={isStreaming}
        setStreaming={setStreaming}
        videoRef={videoRef}
        isModelLoaded={isModelLoaded}
      />
      <canvas
        style={{
          position: "fixed",
          backgroundColor: "transparent",
          display: isStreaming ? "block" : "none",
          transform: "scaleX(-1)",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 100000,
        }}
        id="float-canvas"
      />
      <video
        style={{
          display: isStreaming ? "block" : "none",
          transform: "scaleX(-1)",
          position: "fixed",
          pointerEvents: "none",
          objectFit: "cover",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.3,
          zIndex: 10,
        }}
        id="video"
        playsInline
      />
      <Tldraw
        components={{
          Scribble: LaserScribble,
        }}
        onMount={(editor) => {
          // hide the debug panel (for cleaner gifs)
          editor.updateInstanceState({
            isDebugMode: false,
          });
          window["editor"] = editor;
          editor.setCurrentTool("draw");
          editor.setStyleForNextShapes(DefaultSizeStyle, "xl");
        }}
      />
    </div>
  );
}
