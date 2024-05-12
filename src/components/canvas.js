import { useEffect, useState } from "react";
import { setupWebcam, teardownWebcam } from "../lib/video";
import { useAnimationFrame } from "../lib/hooks/animation";
import { createKeyMap, drawHands, draw } from "../lib/utils";

export async function setupCanvas(video, canvasID) {
  const canvas = document.getElementById(canvasID);
  const ctx = canvas.getContext("2d");

  canvas.width = video.width;
  canvas.height = video.height;

  return ctx;
}

export default function CanvasComponent({
  videoRef,
  detector,
  isStreaming,
  isModelLoaded,
}) {
  const [drawCtx, setDrawCtx] = useState(null);
  const [floatCtx, setFloatCtx] = useState(null);

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
    const hands = await detector.estimateHands(videoRef.current, {
      flipHorizontal: false,
    });

    floatCtx.clearRect(
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    // ctx.drawImage(
    //   videoRef.current,
    //   0,
    //   0,
    //   videoRef.current.videoWidth,
    //   videoRef.current.videoHeight
    // );
    drawHands(hands, floatCtx);
    draw(hands, drawCtx);
  }, !!(isStreaming && isModelLoaded && videoRef.current && floatCtx && drawCtx));

  return (
    <div>
      {isStreaming && (
        <button
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
      <canvas
        style={{
          // visibility: "hidden",
          position: "absolute",
          display: isStreaming ? "block" : "none", // Hide canvas by default
          transform: "scaleX(-1)",
          zIndex: 1,
          borderRadius: "1rem",
          boxShadow: "0 3px 10px rgb(0 0 0)",
          maxWidth: "85vw",
        }}
        id="draw-canvas"
      />
      <canvas
        style={{
          // visibility: "hidden",
          position: "absolute",
          backgroundColor: "transparent",
          display: isStreaming ? "block" : "none", // Hide canvas by default
          transform: "scaleX(-1)",
          zIndex: 0,
          borderRadius: "1rem",
          boxShadow: "0 3px 10px rgb(0 0 0)",
          maxWidth: "85vw",
        }}
        id="float-canvas"
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
