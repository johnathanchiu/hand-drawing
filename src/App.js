import "./App.css";

import "@tensorflow/tfjs-backend-webgl";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import React, { useState, useRef, useEffect } from "react";
import CanvasComponent from "./components/canvas";

let detector;

function App() {
  // const [fingerTracker, setFingerTracker] = useState(null);
  const videoRef = useRef(null);
  const [isModelLoaded, setModelLoaded] = useState(false);
  const [isStreaming, setStreaming] = useState(false);

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
      <CanvasComponent
        detector={detector}
        videoRef={videoRef}
        isStreaming={isStreaming}
        isModelLoaded={isModelLoaded}
      />
    </div>
  );
}

export default App;
