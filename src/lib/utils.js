export const calculateDistance = (x1, x2, y1, y2) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// This function's objective is to find which centroid is closer to the provided point.
export const findNearestCentroid = (distances, centroids) => {
  let nearestCentroidIndex = 0;
  let minDistance = Infinity;

  centroids.forEach((centroid, index) => {
    let distance = 0;
    for (let i = 0; i < centroid.length; i++) {
      distance += Math.pow(centroid[i] - distances[i], 2);
    }
    distance = Math.sqrt(distance);

    if (distance < minDistance) {
      minDistance = distance;
      nearestCentroidIndex = index;
    }
  });

  return nearestCentroidIndex;
};

export const KMeansCentroidsSearch = (distances) => {
  const centroids = [
    [
      29.32492239539394, 23.845205768121215, 20.593983924303032,
      18.657128788848485, 18.35031249363636,
    ],
    [
      31.964079364565215, 46.65739722507246, 49.34809334449275,
      46.588967348405795, 39.55344674731884,
    ],
  ];

  return findNearestCentroid(distances, centroids);
};

export const createKeyMap = (handPoseEstimations) =>
  handPoseEstimations.reduce((acc, item) => {
    acc[item.name] = item;
    return acc;
  }, {});

export const getHandPoseEstimationsDistances2 = (data) => {
  const wristThumbDistance = calculateDistance(
    data.wrist.x,
    data.thumb_tip.x,
    data.wrist.y,
    data.thumb_tip.y
  );
  const wristIndexDistance = calculateDistance(
    data.wrist.x,
    data.index_finger_tip.x,
    data.wrist.y,
    data.index_finger_tip.y
  );
  const wristMiddleDistance = calculateDistance(
    data.wrist.x,
    data.middle_finger_tip.x,
    data.wrist.y,
    data.middle_finger_tip.y
  );
  const wristRingDistance = calculateDistance(
    data.wrist.x,
    data.ring_finger_tip.x,
    data.wrist.y,
    data.ring_finger_tip.y
  );
  const wristPinkyDistance = calculateDistance(
    data.wrist.x,
    data.pinky_finger_tip.x,
    data.wrist.y,
    data.pinky_finger_tip.y
  );

  return [
    wristThumbDistance,
    wristIndexDistance,
    wristMiddleDistance,
    wristRingDistance,
    wristPinkyDistance,
  ];
};

export const getHandPoseEstimationsDistances = (data) => {
  const wristThumbDistance = calculateDistance(
    data.wrist.x,
    data.thumb_tip.x,
    data.wrist.y,
    data.thumb_tip.y
  );
  const wristIndexDistance = calculateDistance(
    data.wrist.x,
    data.index_finger_tip.x,
    data.wrist.y,
    data.index_finger_tip.y
  );
  const wristMiddleDistance = calculateDistance(
    data.wrist.x,
    data.middle_finger_tip.x,
    data.wrist.y,
    data.middle_finger_tip.y
  );
  const wristRingDistance = calculateDistance(
    data.wrist.x,
    data.ring_finger_tip.x,
    data.wrist.y,
    data.ring_finger_tip.y
  );
  const wristPinkyDistance = calculateDistance(
    data.wrist.x,
    data.pinky_finger_tip.x,
    data.wrist.y,
    data.pinky_finger_tip.y
  );

  return [
    wristThumbDistance,
    wristIndexDistance,
    wristMiddleDistance,
    wristRingDistance,
    wristPinkyDistance,
  ];
};

// Points for fingers
const fingerJoints = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

// Infinity Gauntlet Style
const style = {
  0: { color: "yellow", size: 15 },
  1: { color: "gold", size: 6 },
  2: { color: "green", size: 10 },
  3: { color: "gold", size: 6 },
  4: { color: "gold", size: 6 },
  5: { color: "purple", size: 10 },
  6: { color: "gold", size: 6 },
  7: { color: "gold", size: 6 },
  8: { color: "gold", size: 6 },
  9: { color: "blue", size: 10 },
  10: { color: "gold", size: 6 },
  11: { color: "gold", size: 6 },
  12: { color: "gold", size: 6 },
  13: { color: "red", size: 10 },
  14: { color: "gold", size: 6 },
  15: { color: "gold", size: 6 },
  16: { color: "gold", size: 6 },
  17: { color: "orange", size: 10 },
  18: { color: "gold", size: 6 },
  19: { color: "gold", size: 6 },
  20: { color: "gold", size: 6 },
};

const FINGER_LOOKUP_INDICES = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

export const drawHands = (hands, ctx) => {
  // console.log(hands);
  if (hands.length <= 0) {
    return;
  }

  hands.sort((hand1, hand2) => {
    if (hand1.handedness < hand2.handedness) return 1;
    if (hand1.handedness > hand2.handedness) return -1;
    return 0;
  });

  // while (hands.length < 2) { hands.push(); }

  for (let i = 0; i < hands.length; i++) {
    ctx.fillStyle = hands[i].handedness === "Left" ? "black" : "Blue";
    ctx.strokeStyle = "White";
    ctx.lineWidth = 2;

    for (let y = 0; y < hands[i].keypoints.length; y++) {
      const keypoint = hands[i].keypoints[y];
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

export const draw = (hands, ctx) => {
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    const indexKeypoint = hand.keypoints[4];
    const thumbKeypoint = hand.keypoints[8];
    // console.log(indexKeypoint);
    // console.log(
    //   calculateDistance(
    //     indexKeypoint.x,
    //     thumbKeypoint.x,
    //     indexKeypoint.y,
    //     thumbKeypoint.y
    //   )
    // );
    if (
      calculateDistance(
        indexKeypoint.x,
        thumbKeypoint.x,
        indexKeypoint.y,
        thumbKeypoint.y
      ) < 25.0
    ) {
      ctx.beginPath();
      ctx.arc(indexKeypoint.x, indexKeypoint.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
};

const drawInvertedText = (keypoint, ctx) => {
  ctx.save();
  ctx.translate(keypoint.x - 10, keypoint.y);
  ctx.rotate(-Math.PI / 1);
  ctx.scale(1, -1);
  ctx.fillText(keypoint.name, 0, 0);
  ctx.restore();
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
