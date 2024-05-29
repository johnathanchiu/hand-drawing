import { useEffect, useState } from "react";
import { setupWebcam, teardownWebcam } from "../lib/video";
import { useAnimationFrame } from "../lib/hooks/animation";
import { createKeyMap, drawHands } from "../lib/pose";
import { euclideanDistance } from "../lib/utils";

export async function setupCanvas(video, canvasID) {
  const canvas = document.getElementById(canvasID);
  const ctx = canvas.getContext("2d");

  canvas.width = video.width;
  canvas.height = video.height;

  return ctx;
}

export default function CanvasComponent({ videoRef, detector, isModelLoaded }) {
  const [indicatorCtx, setIndicatorCtx] = useState(null);
  const [drawCtx, setDrawCtx] = useState(null);
  const [floatCtx, setFloatCtx] = useState(null);
  const [isStreaming, setStreaming] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [isDrawing, setDrawing] = useState(false);
  const [doDrawCurve, setDrawCurve] = useState(false);

  const drawIndicators = (hands) => {
    // TODO: Figure out what the issue is here, it's reversed?
    const canvas = doDrawCurve ? indicatorCtx : drawCtx;

    for (let i = 0; i < hands.length; i++) {
      const hand = hands[i];
      let indexKeypoint = hand.keypoints.index_finger_tip;
      let thumbKeypoint = hand.keypoints.thumb_tip;
      if (
        euclideanDistance([
          [indexKeypoint.x, thumbKeypoint.x],
          [indexKeypoint.y, thumbKeypoint.y],
        ]) < 20.0
      ) {
        setDrawingPoints((previousState) => [
          ...previousState,
          { x: indexKeypoint.x, y: indexKeypoint.y },
        ]);
        setDrawing(true);

        canvas.beginPath();
        canvas.arc(indexKeypoint.x, indexKeypoint.y, brushSize, 0, 2 * Math.PI);
        canvas.fill();
      } else {
        setDrawing(false);
      }
    }
  };

  const draw = (points) => {
    if (points.length === 2) {
      // For two points, just draw a straight line
      drawCtx.lineTo(points[1].x, points[1].y);
      return;
    }

    drawCtx.beginPath();
    drawCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 2; i += 2) {
      if (i + 2 < points.length) {
        drawCtx.bezierCurveTo(
          points[i].x,
          points[i].y,
          points[i + 1].x,
          points[i + 1].y,
          points[i + 2].x,
          points[i + 2].y
        );
      }
    }

    // If there are an odd number of points, handle the last segment
    if (points.length % 2 === 0) {
      let lastPoint = points[points.length - 1];
      drawCtx.lineTo(lastPoint.x, lastPoint.y);
    } else {
      let cp = points[points.length - 2];
      let endPoint = points[points.length - 1];
      drawCtx.quadraticCurveTo(cp.x, cp.y, endPoint.x, endPoint.y);
    }

    drawCtx.stroke();
  };

  useEffect(() => {
    async function initialize() {
      if (!videoRef.current) {
        videoRef.current = await setupWebcam();
        console.log("webcam setup!");
      }
      if (!drawCtx || !floatCtx || !indicatorCtx) {
        const drawingCanvas = await setupCanvas(
          videoRef.current,
          "draw-canvas"
        );
        const floatingCanvas = await setupCanvas(
          videoRef.current,
          "float-canvas"
        );
        const indicatorCanvas = await setupCanvas(
          videoRef.current,
          "indicator-canvas"
        );
        setDrawCtx(drawingCanvas);
        setFloatCtx(floatingCanvas);
        setIndicatorCtx(indicatorCanvas);
        console.log("canvas setup!");
      }
    }

    async function destroy() {
      if (videoRef.current) {
        await teardownWebcam(videoRef.current);
        videoRef.current = null;
        console.log("webcam teardown!");
      }
      if (drawCtx || floatCtx || indicatorCtx) {
        setDrawCtx(null);
        setFloatCtx(null);
        setIndicatorCtx(null);
        console.log("canvas teardown!");
      }
    }

    if (isStreaming) {
      initialize();
    } else {
      destroy();
    }
  }, [isStreaming]);

  useAnimationFrame(async (delta) => {
    let hands = await detector.estimateHands(videoRef.current, {
      flipHorizontal: false,
    });
    hands = createKeyMap(hands);

    floatCtx.clearRect(
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    drawHands(hands, floatCtx);
    drawIndicators(hands);
  }, !!(isStreaming && isModelLoaded && videoRef.current));

  useEffect(() => {
    if (!isDrawing) {
      if (doDrawCurve) {
        if (drawingPoints.length >= 2) {
          indicatorCtx.clearRect(
            0,
            0,
            videoRef.current.width,
            videoRef.current.height
          );
          draw(drawingPoints);
        }
      }
      setDrawingPoints([]);
    }
  }, [isDrawing]);

  return (
    <div className="flex h-screen">
      {/* Left Menu Bar */}
      <div className="bg-gray-200 w-1/12 p-4">
        {isModelLoaded && videoRef && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 w-full"
            onClick={() => {
              setStreaming((prevState) => !prevState);
            }}
          >
            {isStreaming ? "Stop Drawing" : "Start Drawing"}
          </button>
        )}
        {isStreaming && (
          <div>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 w-full"
              onClick={() => {
                drawCtx.clearRect(
                  0,
                  0,
                  videoRef.current.width,
                  videoRef.current.height
                );
                indicatorCtx.clearRect(
                  0,
                  0,
                  videoRef.current.width,
                  videoRef.current.height
                );
              }}
            >
              Clear Canvas!
            </button>
            <button
              className={`text-white font-bold py-2 px-4 rounded mt-4 w-full ${
                doDrawCurve
                  ? "bg-green-500 hover:bg-green-700"
                  : "bg-gray-500 hover:bg-gray-700"
              }`}
              onClick={() => setDrawCurve((prevState) => !prevState)}
            >
              {doDrawCurve ? "Dashed" : "Solid"}
            </button>
          </div>
        )}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex justify-center items-center p-4 relative">
        <canvas
          style={{
            position: "absolute",
            backgroundColor: "transparent",
            display: isStreaming ? "block" : "none",
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
    </div>
  );
}
