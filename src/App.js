import "@tensorflow/tfjs-backend-webgl";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

import { useAnimationFrame } from "./lib/hooks/animation";
import WebcamComponent, {
  setupWebcam,
  setupCanvas,
  teardownWebcam,
} from "./detector/video";
import { createKeyMap, drawHands } from "./lib/utils";

let detector;

function App() {
  // const [fingerTracker, setFingerTracker] = useState(null);

  const [isModelLoaded, setModelLoaded] = useState(false);
  const [isStreaming, setStreaming] = useState(false);

  const videoRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    async function initialize() {
      if (!videoRef.current) {
        videoRef.current = await setupWebcam();
        console.log("webcam setup!");
      }
      if (!ctx) {
        const canvas = await setupCanvas(videoRef.current);
        setCtx(canvas);
        console.log("canvas setup!");
      }
    }

    async function destroy() {
      if (videoRef.current) {
        await teardownWebcam(videoRef.current);
        videoRef.current = null;
        console.log("webcam teardown!");
      }
      if (ctx) {
        setCtx(null);
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
    async function setupModel() {
      console.log("model loading...");
      detector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        {
          // runtime: "tfjs",
          modelType: "full",
          runtime: "mediapipe",
          solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands`,
        }
      );
      console.log("model loaded!");
      setModelLoaded(true);
    }

    setupModel();
  }, []);

  useAnimationFrame(async (delta) => {
    const hands = await detector.estimateHands(videoRef.current, {
      flipHorizontal: false,
    });

    ctx.clearRect(
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    ctx.drawImage(
      videoRef.current,
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    drawHands(hands, ctx);
  }, !!(isStreaming && isModelLoaded && videoRef.current && ctx));

  return (
    <div>
      {isModelLoaded && videoRef && (
        <button
          onClick={() => {
            setStreaming((prevState) => !prevState);
          }}
        >
          {isStreaming ? "Stop tracking" : "Start tracking"}
        </button>
      )}
      <canvas
        style={{
          // visibility: "hidden",
          display: isStreaming ? "block" : "none", // Hide canvas by default
          transform: "scaleX(-1)",
          zIndex: 1,
          borderRadius: "1rem",
          boxShadow: "0 3px 10px rgb(0 0 0)",
          maxWidth: "85vw",
        }}
        id="canvas"
      />
      <video
        style={{
          // visibility: "hidden",
          display: isStreaming ? "block" : "none", // Hide canvas by default
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

export default App;
