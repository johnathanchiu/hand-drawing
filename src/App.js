import "./App.css";

import "@tensorflow/tfjs-backend-webgl";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import React, { useState, useRef, useEffect } from "react";
import CanvasComponent from "./components/canvas";
import { Analytics } from "@vercel/analytics/react";

let detector;

function App() {
  // const [fingerTracker, setFingerTracker] = useState(null);
  const [isModelLoaded, setModelLoaded] = useState(false);

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
      <Analytics />
      {/* Top Header Bar */}
      <div className="bg-gray-800 text-white p-4 flex items-center">
        {/* App name on the left */}
        <div className="flex-1 text-left">
          <p className="text-lg font-bold">Whiteboarding</p>
        </div>
        {/* Spacer div to center the text */}
        <div className="flex-1 text-center">
          <p className="text-lg">👌 Pinch to draw</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-lg">by Johnathan Chiu</p>
        </div>
      </div>
      {/* Canvas & Menu */}
      <CanvasComponent detector={detector} isModelLoaded={isModelLoaded} />
    </div>
  );
}

export default App;
