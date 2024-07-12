import { inverseNormalize } from "./utils";

export function drawHands(hands, videoWidth, videoHeight, ctx) {
  if (hands.length <= 0) {
    return;
  }

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    ctx.fillStyle = hand.handedness === "Left" ? "black" : "blue";
    ctx.strokeStyle = "White";
    ctx.lineWidth = 2;

    for (let key in hand.keypoints) {
      const keypoint = inverseNormalize(
        hand.keypoints[key],
        videoWidth,
        videoHeight
      );
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export function drawPath(points) {
  const lastPoint = points[points.length - 1];
  const point = getClientPointFromCanvasPoint({ point: lastPoint });

  const editor = window["editor"];
  editor.dispatch({
    type: "pointer",
    target: "canvas",
    name: "pointer_move",
    // weird but true: we need to put the screen point back into client space
    point,
    pointerId: 0,
    ctrlKey: editor.inputs.ctrlKey,
    altKey: editor.inputs.altKey,
    shiftKey: editor.inputs.shiftKey,
    button: 0,
    isPen: false,
  });
}

export function getClientPointFromCanvasPoint({ point }) {
  return {
    x: -point.x * window.innerWidth + window.innerWidth,
    y: point.y * window.innerHeight,
  };
}
