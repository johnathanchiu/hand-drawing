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
  const [drawCtx, setDrawCtx] = useState(null);
  const [floatCtx, setFloatCtx] = useState(null);
  const [isStreaming, setStreaming] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const [drawingPoints, setDrawingPoints] = useState([]);

  const draw = (hands) => {
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
        // setDrawingPoints((previousState) => [
        //   ...previousState,
        //   { x: indexKeypoint.x, y: indexKeypoint.y },
        // ]);

        drawCtx.beginPath();
        drawCtx.arc(
          indexKeypoint.x,
          indexKeypoint.y,
          brushSize,
          0,
          2 * Math.PI
        );
        drawCtx.fill();
      }
      // else {
      //   setDrawingPoints([]);
      // }
    }
  };

  // useEffect(() => {
  //   if (drawingPoints.length > 1) {
  //     drawCtx.beginPath();
  //     drawCtx.moveTo(
  //       drawingPoints[drawingPoints.length - 2].x,
  //       drawingPoints[drawingPoints.length - 2].y
  //     );
  //     drawCtx.lineTo(
  //       drawingPoints[drawingPoints.length - 1].x,
  //       drawingPoints[drawingPoints.length - 1].y
  //     );
  //     drawCtx.stroke();
  //   }
  // }, [drawingPoints]);

  useEffect(() => {
    async function initialize() {
      if (!videoRef.current) {
        videoRef.current = await setupWebcam();
        console.log("webcam setup!");
      }
      if (!drawCtx || !floatCtx) {
        const drawingCanvas = await setupCanvas(
          videoRef.current,
          "draw-canvas"
        );
        const floatingCanvas = await setupCanvas(
          videoRef.current,
          "float-canvas"
        );
        setDrawCtx(drawingCanvas);
        setFloatCtx(floatingCanvas);
        console.log("canvas setup!");
      }
    }

    async function destroy() {
      if (videoRef.current) {
        await teardownWebcam(videoRef.current);
        videoRef.current = null;
        console.log("webcam teardown!");
      }
      if (drawCtx || floatCtx) {
        setDrawCtx(null);
        setFloatCtx(null);
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
    draw(hands);
  }, !!(isStreaming && isModelLoaded && videoRef.current && floatCtx && drawCtx));

  return (
    <div className="flex h-screen">
      {/* Left Menu Bar */}
      <div className="bg-gray-200 w-1/12 p-4">
        {isModelLoaded && videoRef && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={() => {
              setStreaming((prevState) => !prevState);
            }}
          >
            {isStreaming ? "Stop Drawing" : "Start Drawing"}
          </button>
        )}
        {isStreaming && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={() => {
              drawCtx.clearRect(
                0,
                0,
                videoRef.current.width,
                videoRef.current.height
              );
            }}
          >
            Clear Canvas!
          </button>
        )}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex justify-center items-center p-4 relative">
        <canvas
          style={{
            position: "absolute",
            display: isStreaming ? "block" : "none",
            backgroundColor: "transparent",
            transform: "scaleX(-1)",
            zIndex: 1,
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
