import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@tensorflow/tfjs-backend-webgl";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import React, { useState, useRef, useEffect } from "react";
import CanvasComponent from "./components/canvas";
import { Analytics } from "@vercel/analytics/react";

let detector;

const DEV_MODE = false;
const MODEL_PATH = "../models/gesture_recognizer.task";

function App() {
  // const [fingerTracker, setFingerTracker] = useState(null);
  const [isModelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    async function setupModel() {
      console.log("model loading...");
      if (!DEV_MODE) {
        // detector = await handPoseDetection.createDetector(
        //   handPoseDetection.SupportedModels.MediaPipeHands,
        //   {
        //     // runtime: "tfjs",
        //     modelType: "full",
        //     runtime: "mediapipe",
        //     solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands`,
        //   }
        // );
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        detector = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task?generation=1677051718270846",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }
      console.log("model loaded!");
      setModelLoaded(true);
    }

    setupModel();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Analytics />
      <CanvasComponent
        detector={detector}
        isModelLoaded={isModelLoaded}
        development={DEV_MODE}
      />
    </div>
  );
}

export default App;
