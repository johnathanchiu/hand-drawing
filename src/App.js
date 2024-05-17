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
    <div className="flex flex-col h-screen">
      {/* Top Header Bar */}
      <div className="bg-gray-800 text-white p-4">
        <p class="text-center">👌 Pinch to draw</p>
        <p class="text-center">✊ Make a fist to close the canvas</p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Menu Bar */}
        <div className="bg-gray-200 w-1/8 p-4">
          {isModelLoaded && videoRef && (
            <button
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={() => {
                setStreaming((prevState) => !prevState);
              }}
            >
              {isStreaming ? "Stop Drawing" : "Start Drawing"}
            </button>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-4">
          <CanvasComponent
            detector={detector}
            videoRef={videoRef}
            isStreaming={isStreaming}
            isModelLoaded={isModelLoaded}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
