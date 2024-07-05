import { useEffect, useState, useRef } from "react";
import { DefaultSizeStyle, Tldraw, getSvgPathFromPoints } from "tldraw";

import FloatingMenu from "./menu";

import { createKeyMap } from "../lib/pose";
import { drawDiagonal, drawLine } from "../lib/hooks/simulation";
import { useAnimationFrame } from "../lib/hooks/animation";
import { setupWebcam, teardownWebcam } from "../lib/video";
import { euclideanDistance, normalize } from "../lib/utils";
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

export default function CanvasComponent({
  detector,
  isModelLoaded,
  development,
}) {
  const editor = window.editor;
  const videoRef = useRef(null);
  const [floatingCanvasCtx, setFloatingCanvasCtx] = useState(null);

  const [isStreaming, setStreaming] = useState(false);
  const [isDrawing, setDrawing] = useState(false);

  const drawingPointsRef = useRef([]);

  const simulationHandsIdxRef = useRef(0);

  const draw = (hands) => {
    if (hands.length < 1) {
      setDrawing(false);
      return;
    }

    for (let i = 0; i < hands.length; i++) {
      const hand = hands[i];
      let indexKeypoint = hand.keypoints.index_finger_tip;
      let thumbKeypoint = hand.keypoints.thumb_tip;
      indexKeypoint = normalize(
        indexKeypoint,
        videoRef.current.width,
        videoRef.current.height
      );
      thumbKeypoint = normalize(
        thumbKeypoint,
        videoRef.current.width,
        videoRef.current.height
      );
      if (
        euclideanDistance([
          [indexKeypoint.x, thumbKeypoint.x],
          [indexKeypoint.y, thumbKeypoint.y],
        ]) < 0.06
      ) {
        if (drawingPointsRef.current.length > 0) {
          let previousPoint =
            drawingPointsRef.current[drawingPointsRef.current.length - 1];
          if (
            euclideanDistance([
              [indexKeypoint.x, previousPoint.x],
              [indexKeypoint.y, previousPoint.y],
            ]) < 0.005
          ) {
            return;
          }
        }

        drawingPointsRef.current = [
          ...drawingPointsRef.current,
          { x: indexKeypoint.x, y: indexKeypoint.y },
        ];
        setDrawing(true);

        if (!editor.inputs.buttons.has(0)) {
          const point = getClientPointFromCanvasPoint({
            point: indexKeypoint,
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
    // if (!development) {
    // hands = await detector.estimateHands(videoRef.current, {
    //   flipHorizontal: false,
    // });
    // hands = createKeyMap(hands);
    // } else {
    //   let simHands = drawDiagonal();
    //   if (simulationHandsIdxRef.current < simHands.length) {
    //     hands = [simHands[simulationHandsIdxRef.current]];
    //   } else {
    //     hands = [];
    //   }
    //   simulationHandsIdxRef.current = Math.min(
    //     simulationHandsIdxRef.current + 1,
    //     simHands.length
    //   );
    // }

    hands = await detector.estimateHands(videoRef.current, {
      flipHorizontal: false,
    });
    hands = createKeyMap(hands);

    floatingCanvasCtx.clearRect(
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    drawHands(hands, floatingCanvasCtx);
    draw(hands);
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
          objectFit: "fill",
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
