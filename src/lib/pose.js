import { euclideanDistance } from "./utils";

// const FINGER_LOOKUP_INDICES = {
//   thumb: [0, 1, 2, 3, 4],
//   indexFinger: [0, 5, 6, 7, 8],
//   middleFinger: [0, 9, 10, 11, 12],
//   ringFinger: [0, 13, 14, 15, 16],
//   pinky: [0, 17, 18, 19, 20],
// };

const FINGER_LOOKUP_INDICES = [
  "WRIST",
  "THUMB_CMC",
  "THUMB_MCP",
  "THUMB_IP",
  "THUMB_TIP",
  "INDEX_FINGER_MCP",
  "INDEX_FINGER_PIP",
  "INDEX_FINGER_DIP",
  "INDEX_FINGER_TIP",
  "MIDDLE_FINGER_MCP",
  "MIDDLE_FINGER_PIP",
  "MIDDLE_FINGER_DIP",
  "MIDDLE_FINGER_TIP",
  "RING_FINGER_MCP",
  "RING_FINGER_PIP",
  "RING_FINGER_DIP",
  "RING_FINGER_TIP",
  "PINKY_MCP",
  "PINKY_PIP",
  "PINKY_DIP",
  "PINKY_TIP",
];

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

export function getUserHandGesture(handPoseEstimations) {
  let fingerWristDistances =
    calculateFingerToWristDistances(handPoseEstimations);
  const category = kMeansCentroidsSearch(fingerWristDistances);
  if (category === 0) {
    // Hand gesture is a fist
    return "Fist";
  } else {
  }
  return "None";
}

export function createKeyMap(handPoseEstimations) {
  const handPoseKeyMap = [];
  for (let i = 0; i < handPoseEstimations.landmarks.length; i++) {
    let keypoints = handPoseEstimations.landmarks[i].reduce((acc, obj, idx) => {
      acc[FINGER_LOOKUP_INDICES[idx]] = obj;
      return acc;
    }, {});
    let keypoints3D = handPoseEstimations.worldLandmarks[i].reduce(
      (acc, obj, idx) => {
        acc[FINGER_LOOKUP_INDICES[idx]] = obj;
        return acc;
      },
      {}
    );

    handPoseKeyMap.push({
      handedness:
        handPoseEstimations.handedness[i].categoryName === "Left"
          ? "Right"
          : "Left",
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

export const calculateFingerToWristDistances = (handPoseEstimations) => {
  const wristThumbDistance = euclideanDistance([
    [handPoseEstimations.wrist.x, handPoseEstimations.thumb_tip.x],
    [handPoseEstimations.wrist.y, handPoseEstimations.thumb_tip.y],
  ]);
  const wristIndexDistance = euclideanDistance([
    [handPoseEstimations.wrist.x, handPoseEstimations.index_finger_tip.x],
    [handPoseEstimations.wrist.y, handPoseEstimations.index_finger_tip.y],
  ]);
  const wristMiddleDistance = euclideanDistance([
    [handPoseEstimations.wrist.x, handPoseEstimations.middle_finger_tip.x],
    [handPoseEstimations.wrist.y, handPoseEstimations.middle_finger_tip.y],
  ]);
  const wristRingDistance = euclideanDistance([
    [handPoseEstimations.wrist.x, handPoseEstimations.ring_finger_tip.x],
    [handPoseEstimations.wrist.y, handPoseEstimations.ring_finger_tip.y],
  ]);
  const wristPinkyDistance = euclideanDistance([
    [handPoseEstimations.wrist.x, handPoseEstimations.pinky_finger_tip.x],
    [handPoseEstimations.wrist.y, handPoseEstimations.pinky_finger_tip.y],
  ]);

  return [
    wristThumbDistance,
    wristIndexDistance,
    wristMiddleDistance,
    wristRingDistance,
    wristPinkyDistance,
  ];
};
