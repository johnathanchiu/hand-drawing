import { euclideanDistance } from "./utils";

const FINGER_LOOKUP_INDICES = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

const FIST_PALM_CENTROIDS = [
  [
    29.32492239539394, 23.845205768121215, 20.593983924303032,
    18.657128788848485, 18.35031249363636,
  ],
  [
    31.964079364565215, 46.65739722507246, 49.34809334449275,
    46.588967348405795, 39.55344674731884,
  ],
];

export function createKeyMap(handPoseEstimations) {
  const handPoseKeyMap = [];
  for (let i = 0; i < handPoseEstimations.length; i++) {
    let currHandPose = handPoseEstimations[i];
    let keypoints = currHandPose.keypoints.reduce((acc, obj) => {
      acc[obj.name] = obj;
      return acc;
    }, {});
    let keypoints3D = currHandPose.keypoints3D.reduce((acc, obj) => {
      acc[obj.name] = obj;
      return acc;
    }, {});

    handPoseKeyMap.push({
      handedness: currHandPose.handedness === "Left" ? "Right" : "Left",
      keypoints: keypoints,
      keypoints3D: keypoints3D,
    });
  }
  return handPoseKeyMap;
}

export const kMeansCentroidsSearch = (fingerWristDistances) => {
  let nearestCentroidIndex = 0;
  let minDistance = Infinity;

  FIST_PALM_CENTROIDS.forEach((centroid, index) => {
    let distance = 0;
    for (let i = 0; i < centroid.length; i++) {
      distance += Math.pow(centroid[i] - fingerWristDistances[i], 2);
    }
    distance = Math.sqrt(distance);

    if (distance < minDistance) {
      minDistance = distance;
      nearestCentroidIndex = index;
    }
  });

  return nearestCentroidIndex;
};

export const calculateFingerToWristDistances = (data) => {
  const wristThumbDistance = euclideanDistance([
    [data.wrist.x, data.thumb_tip.x],
    [data.wrist.y, data.thumb_tip.y],
  ]);
  const wristIndexDistance = euclideanDistance([
    [data.wrist.x, data.index_finger_tip.x],
    [data.wrist.y, data.index_finger_tip.y],
  ]);
  const wristMiddleDistance = euclideanDistance([
    [data.wrist.x, data.middle_finger_tip.x],
    [data.wrist.y, data.middle_finger_tip.y],
  ]);
  const wristRingDistance = euclideanDistance([
    [data.wrist.x, data.ring_finger_tip.x],
    [data.wrist.y, data.ring_finger_tip.y],
  ]);
  const wristPinkyDistance = euclideanDistance([
    [data.wrist.x, data.pinky_finger_tip.x],
    [data.wrist.y, data.pinky_finger_tip.y],
  ]);

  return [
    wristThumbDistance,
    wristIndexDistance,
    wristMiddleDistance,
    wristRingDistance,
    wristPinkyDistance,
  ];
};

export const drawHands = (hands, ctx) => {
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
};

const drawPath = (points, ctx, closePath = false) => {
  const region = new Path2D();
  region.moveTo(points[0]?.x, points[0]?.y);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point?.x, point?.y);
  }

  if (closePath) {
    region.closePath();
  }

  ctx.stroke(region);
};
