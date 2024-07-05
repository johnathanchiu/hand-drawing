import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@tensorflow/tfjs-backend-webgl";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import React, { useState, useRef, useEffect } from "react";
import CanvasComponent from "./components/canvas";
import { Analytics } from "@vercel/analytics/react";

let detector;

const DEV_MODE = false;

function App() {
  // const [fingerTracker, setFingerTracker] = useState(null);
  const [isModelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    async function setupModel() {
      console.log("model loading...");
      if (!DEV_MODE) {
        detector = await handPoseDetection.createDetector(
          handPoseDetection.SupportedModels.MediaPipeHands,
          {
            // runtime: "tfjs",
            modelType: "full",
            runtime: "mediapipe",
            solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands`,
          }
        );
      }
      console.log("model loaded!");
      setModelLoaded(true);
    }

    setupModel();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Analytics />
      {/* Top Header Bar */}
      {/* <div className="bg-gray-800 text-white p-4 flex items-center">
        <div className="flex-1 text-left">
          <p className="text-lg font-bold">Whiteboarding</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-lg">👌 Pinch to draw</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-lg">by Johnathan Chiu</p>
        </div>
      </div> */}
      {/* Canvas & Menu */}
      <CanvasComponent
        detector={detector}
        isModelLoaded={isModelLoaded}
        development={DEV_MODE}
      />
    </div>
  );
}

export default App;
