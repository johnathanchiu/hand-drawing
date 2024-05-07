import { useRef, useEffect } from "react";

export async function setupWebcam() {
  const video = document.getElementById("video");
  const stream = await window.navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve();
    };
  });
  video.play();

  video.width = video.videoWidth;
  video.height = video.videoHeight;

  return video;
}

export async function teardownWebcam(video) {
  const tracks = video.srcObject.getTracks();
  tracks.forEach((track) => {
    track.stop();
  });
  video.srcObject = null;
}

export async function setupCanvas(video) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.width;
  canvas.height = video.height;

  return ctx;
}

const WebCamComponent = ({
  isStreaming,
  videoRef,
  canvasRef,
  fingerTrackingPosition,
}) => {
  useEffect(() => {
    const videoConfig = {
      audio: false,
      video: {
        facingMode: "user",
        width: 640,
        height: 480,
        frameRate: {
          ideal: 60,
        },
      },
    };

    async function enableWebcam() {
      const video = document.getElementById("video");
      video.srcObject = await navigator.mediaDevices.getUserMedia(videoConfig);
      videoRef.current = video;

      return [video.width, video.height];
    }

    async function disableWebcam() {
      const video = document.getElementById("video");
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
      video.srcObject = null;
    }

    async function enableCanvas(videoWidth, videoHeight) {
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      canvasRef.current = ctx;
    }

    async function disableCanvas() {
      const canvas = document.getElementById("canvas");
      canvas.style.display = "none";
    }

    async function initialize() {
      if (isStreaming) {
        console.log("enabling");
        const [width, height] = await enableWebcam();
        enableCanvas(width, height);
      } else {
        console.log("disabling");
        disableWebcam();
        disableCanvas();
      }
    }

    initialize();
  }, [isStreaming]);

  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   const context = canvas.getContext("2d");

  //   console.log("finger positions", fingerTrackingPosition);

  //   const draw = () => {
  //     const drawDot = (context, x, y) => {
  //       context.beginPath();
  //       context.arc(x, y, 5, 0, 2 * Math.PI);
  //       context.fillStyle = "red";
  //       context.fill();
  //     };

  //     context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  //     drawDot(context, fingerTrackingPosition.x, fingerTrackingPosition.y);
  //     requestAnimationFrame(draw);
  //   };

  //   if (isStreaming && fingerTrackingPosition) {
  //     draw();
  //   }
  // }, [isStreaming, videoRef, fingerTrackingPosition]);

  return (
    <div>
      <canvas
        style={{
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
          visibility: "hidden",
          transform: "scaleX(-1)",
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        }}
        id="video"
      />
    </div>
  );
};

export default WebCamComponent;
