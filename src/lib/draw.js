import { chaikinSmoothing } from "./path";
import { euclideanDistance } from "./utils";
import { Vec } from "tldraw";

export function drawHands(hands, ctx) {
  if (hands.length <= 0) {
    return;
  }

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    ctx.fillStyle = hand.handedness === "Left" ? "black" : "blue";
    ctx.strokeStyle = "White";
    ctx.lineWidth = 2;

    for (let key in hand.keypoints) {
      const keypoint = hand.keypoints[key];
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // const fingers = Object.keys(FINGER_LOOKUP_INDICES);
    // for (let z = 0; z < fingers.length; z++) {
    //   const finger = fingers[z];
    //   const points = FINGER_LOOKUP_INDICES[finger].map(
    //     (idx) => hands[i].keypoints[idx]
    //   );
    //   drawPath(points, ctx);
    // }
  }
}

export function drawCircle(points, ctx) {
  let length = points.length;
  let radius = euclideanDistance([
    [points[length - 1].x, points[0].x],
    [points[length - 1].y, points[0].y],
  ]);
  ctx.beginPath();
  ctx.arc(points[0].x, points[0].y, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

export function drawRectangle(points, ctx) {
  let length = points.length;
  let rectWidth = points[length - 1].x - points[0].x;
  let rectHeight = points[length - 1].y - points[0].y;

  ctx.beginPath();
  ctx.rect(points[0].x, points[0].y, rectWidth, rectHeight);
  ctx.stroke();
}

export function drawIndicationPath(points, ctx, brushSize) {
  let length = points.length;

  ctx.arc(
    points[length - 1].x,
    points[length - 1].y,
    brushSize,
    0,
    2 * Math.PI
  );
  ctx.fill();
}

export function drawPath(points, ctx, doSmooth = true, closePath = false) {
  const editor = window["editor"];

  const lastPoint = points[points.length - 1];

  // console.log(editor.inputs.currentScreenPoint, lastPoint);

  const point = getClientPointFromCanvasPoint({ point: lastPoint, editor });

  // console.log(points);

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

  // if (doSmooth) {
  //   points = chaikinSmoothing(points, 3);
  // }

  // ctx.beginPath();
  // ctx.moveTo(points[0]?.x, points[0]?.y);

  // for (let i = 1; i < points.length; i++) {
  //   const point = points[i];
  //   ctx.lineTo(point?.x, point?.y);
  //   // console.log("Drawing");
  // }

  // if (closePath) {
  //   ctx.closePath();
  // }

  // ctx.stroke();
}

export function getClientPointFromCanvasPoint({ point, editor }) {
  // const pagePoint = Vec.AddXY(
  //   editor.inputs.currentScreenPoint,
  //   point.x,
  //   point.y
  // );

  const clientPoint = {
    x: -point.x * devicePixelRatio * 0.9 + window.innerWidth,
    y: point.y * devicePixelRatio * 0.9,
  };

  return clientPoint;
}
