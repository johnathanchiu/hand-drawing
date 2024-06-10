import { useEffect, useState, useRef } from "react";

import { useAnimationFrame } from "../lib/hooks/animation";
import { setupWebcam, teardownWebcam } from "../lib/video";

import FloatingMenu from "./menu";
import { drawLine } from "../lib/hooks/simulation";
import { createKeyMap } from "../lib/pose";
import { drawHands, drawPath } from "../lib/draw";
import { euclideanDistance } from "../lib/utils";

export async function setupCanvas(video, canvasID) {
  const canvas = document.getElementById(canvasID);
  const ctx = canvas.getContext("2d");

  canvas.width = video.width;
  canvas.height = video.height;

  return [canvas, ctx];
}

export default function CanvasComponent(
  { detector, isModelLoaded },
  development = false
) {
  const videoRef = useRef(null);
  const [drawingCanvasCtx, setDrawingCanvasCtx] = useState(null);
  const [floatingCanvasCtx, setFloatingCanvasCtx] = useState(null);
  const [indicatorCanvasCtx, setIndicatorCanvasCtx] = useState(null);

  const drawingPointsRef = useRef([]);
  const [brushSize, setBrushSize] = useState(2);
  const [isStreaming, setStreaming] = useState(false);
  const [isDrawing, setDrawing] = useState(false);

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
            ]) < 10.0
          ) {
            return;
          }
        }

        drawingPointsRef.current = [
          ...drawingPointsRef.current,
          { x: indexKeypoint.x, y: indexKeypoint.y },
        ];
        setDrawing(true);

        indicatorCanvasCtx.beginPath();
        indicatorCanvasCtx.arc(
          indexKeypoint.x,
          indexKeypoint.y,
          brushSize,
          0,
          2 * Math.PI
        );
        indicatorCanvasCtx.fill();
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

      drawPath(drawingPointsRef.current, drawingCanvasCtx);
      drawingPointsRef.current = [];
    }
  }, [isDrawing]);

  useAnimationFrame(async (delta) => {
    let hands;
    if (!development) {
      hands = await detector.estimateHands(videoRef.current, {
        flipHorizontal: false,
      });
      hands = createKeyMap(hands);
    } else {
      let simHands = drawLine();
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
    <div className="flex h-screen">
      <FloatingMenu
        drawingCanvasCtx={drawingCanvasCtx}
        isStreaming={isStreaming}
        setStreaming={setStreaming}
        videoRef={videoRef}
        isModelLoaded={isModelLoaded}
      />
      <canvas
        style={{
          position: "absolute",
          display: isStreaming ? "block" : "none",
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
          display: isStreaming ? "block" : "none",
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
          backgroundColor: "white",
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
      <video
        style={{
          display: isStreaming ? "block" : "none",
          transform: "scaleX(-1)",
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        }}
        id="video"
        playsInline
      />
    </div>
  );
}
