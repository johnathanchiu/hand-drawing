import { useEffect, useState, useRef } from "react";

import { useAnimationFrame } from "../lib/hooks/animation";
import { setupWebcam, teardownWebcam } from "../lib/video";

import FloatingMenu, { ObjectShape } from "./menu";
import { drawDiagonal, drawLine } from "../lib/hooks/simulation";
import { createKeyMap } from "../lib/pose";
import { euclideanDistance } from "../lib/utils";
import {
  drawHands,
  drawPath,
  drawRectangle,
  drawCircle,
  getPagePointFromCanvasPoint,
  getClientPointFromCanvasPoint,
} from "../lib/draw";

export async function setupCanvas(video, canvasID) {
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
  const [drawingCanvasCtx, setDrawingCanvasCtx] = useState(null);
  const [floatingCanvasCtx, setFloatingCanvasCtx] = useState(null);
  const [indicatorCanvasCtx, setIndicatorCanvasCtx] = useState(null);

  const [isStreaming, setStreaming] = useState(false);
  const [isDrawing, setDrawing] = useState(false);

  const drawingPointsRef = useRef([]);
  const objectModeRef = useRef(ObjectShape.LINE);
  const [brushSize, setBrushSize] = useState(2);

  const simulationHandsIdxRef = useRef(0);

  const drawIndicators = (hands) => {
    if (hands.length < 1) {
      setDrawing(false);
      return;
    }

    for (let i = 0; i < hands.length; i++) {
      const hand = hands[i];
      let indexKeypoint = hand.keypoints.index_finger_tip;
      let thumbKeypoint = hand.keypoints.thumb_tip;
      // console.log(indexKeypoint, thumbKeypoint);
      if (
        euclideanDistance([
          [indexKeypoint.x, thumbKeypoint.x],
          [indexKeypoint.y, thumbKeypoint.y],
        ]) < 25.0
      ) {
        if (drawingPointsRef.current.length > 0) {
          let previousPoint =
            drawingPointsRef.current[drawingPointsRef.current.length - 1];
          if (
            euclideanDistance([
              [indexKeypoint.x, previousPoint.x],
              [indexKeypoint.y, previousPoint.y],
            ]) < 0.1
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

        let drawingPointsLength = drawingPointsRef.current.length;
        if (drawingPointsLength > 2) {
          indicatorCanvasCtx.clearRect(
            0,
            0,
            videoRef.current.width,
            videoRef.current.height
          );
        }

        // console.log("drawing indic", objectModeRef.current);

        switch (objectModeRef.current) {
          case ObjectShape.CIRCLE:
            drawCircle(drawingPointsRef.current, indicatorCanvasCtx);
            break;
          case ObjectShape.RECTANGLE:
            drawRectangle(drawingPointsRef.current, indicatorCanvasCtx);
            break;
          case ObjectShape.LINE:
            // TODO: See if drawIndicatorPath is better
            drawPath(drawingPointsRef.current, indicatorCanvasCtx);
            break;
          default:
            drawPath(drawingPointsRef.current, indicatorCanvasCtx);
        }
      } else {
        setDrawing(false);
      }
    }
  };

  useEffect(() => {
    async function initialize() {
      if (!videoRef.current) {
        videoRef.current = await setupWebcam();
      }
      console.log("webcam setup!");
      if (!drawingCanvasCtx) {
        const [, ctx] = await setupCanvas(videoRef.current, "draw-canvas");
        setDrawingCanvasCtx(ctx);
      }
      if (!floatingCanvasCtx) {
        const [, ctx] = await setupCanvas(videoRef.current, "float-canvas");
        setFloatingCanvasCtx(ctx);
      }
      if (!indicatorCanvasCtx) {
        const [, ctx] = await setupCanvas(videoRef.current, "indicator-canvas");
        setIndicatorCanvasCtx(ctx);
      }
      console.log("canvas setup!");
    }

    async function destroy() {
      if (videoRef.current) {
        await teardownWebcam(videoRef.current);
        videoRef.current = null;
        console.log("webcam teardown!");
      }
      if (drawingCanvasCtx) {
        setDrawingCanvasCtx(null);
      }
      if (floatingCanvasCtx) {
        setFloatingCanvasCtx(null);
      }
      if (indicatorCanvasCtx) {
        setIndicatorCanvasCtx(null);
      }
      console.log("canvas teardown!");
    }

    if (isStreaming) {
      initialize();
    } else {
      destroy();
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isDrawing && indicatorCanvasCtx) {
      indicatorCanvasCtx.clearRect(
        0,
        0,
        videoRef.current.width,
        videoRef.current.height
      );

      // console.log("drawing full", objectModeRef.current);

      switch (objectModeRef.current) {
        case ObjectShape.CIRCLE:
          drawCircle(drawingPointsRef.current, drawingCanvasCtx);
          break;
        case ObjectShape.RECTANGLE:
          drawRectangle(drawingPointsRef.current, drawingCanvasCtx);
          break;
        case ObjectShape.LINE:
          // drawPath(drawingPointsRef.current, drawingCanvasCtx);
          const lastPoint =
            drawingPointsRef.current[drawingPointsRef.current.length - 1];
          if (!lastPoint) break;
          const point = getClientPointFromCanvasPoint({
            point:
              drawingPointsRef.current[drawingPointsRef.current.length - 1],
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
          break;
        default:
          drawPath(drawingPointsRef.current, drawingCanvasCtx);
      }

      drawingPointsRef.current = [];
    }
  }, [isDrawing]);

  useAnimationFrame(async (delta) => {
    let hands;
    if (!detector) return;
    if (!development) {
      hands = await detector.estimateHands(videoRef.current, {
        flipHorizontal: false,
      });
      hands = createKeyMap(hands);
    } else {
      let simHands = drawDiagonal();
      if (simulationHandsIdxRef.current < simHands.length) {
        hands = [simHands[simulationHandsIdxRef.current]];
      } else {
        hands = [];
      }
      simulationHandsIdxRef.current = Math.min(
        simulationHandsIdxRef.current + 1,
        simHands.length
      );
    }

    floatingCanvasCtx.clearRect(
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    drawHands(hands, floatingCanvasCtx);
    drawIndicators(hands);
  }, isStreaming && isModelLoaded && !!videoRef.current);

  return (
    <div
      className="flex h-screen"
      style={{
        zIndex: 1000,
        pointerEvents: "none",
      }}>
      <FloatingMenu
        drawingCanvasCtx={drawingCanvasCtx}
        isStreaming={isStreaming}
        setStreaming={setStreaming}
        videoRef={videoRef}
        isModelLoaded={isModelLoaded}
        objectModeRef={objectModeRef}
      />
      <canvas
        style={{
          position: "absolute",
          // display: isStreaming ? "block" : "none",
          display: "none",
          backgroundColor: "transparent",
          transform: "scaleX(-1)",
          zIndex: 2,
          borderRadius: "1rem",
          boxShadow: "0 3px 10px rgb(0 0 0 / 0.2)",
          width: "100%",
          height: "100%",
        }}
        id="draw-canvas"
      />
      <canvas
        style={{
          position: "absolute",
          backgroundColor: "transparent",
          // display: isStreaming ? "block" : "none",
          display: "none",
          transform: "scaleX(-1)",
          zIndex: 1,
          borderRadius: "1rem",
          boxShadow: "0 3px 10px rgb(0 0 0 / 0.2)",
          width: "100%",
          height: "100%",
        }}
        id="indicator-canvas"
      />
      <canvas
        style={{
          position: "absolute",
          backgroundColor: "transparent",
          display: isStreaming ? "block" : "none",
          transform: "scaleX(-1)",
          zIndex: 0,
          borderRadius: "1rem",
          boxShadow: "0 3px 10px rgb(0 0 0 / 0.2)",
          width: "100%",
          height: "100%",
        }}
        id="float-canvas"
      />
    </div>
  );
}
