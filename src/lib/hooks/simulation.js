export function drawLine() {
  const handedness = "Right";

  const poses = [];
  for (let i = 0; i < 15; i++) {
    poses.push({
      handedness: handedness,
      keypoints: {
        index_finger_tip: { x: 450 - i * 10, y: 80 },
        thumb_tip: { x: 450 - i * 10, y: 85 },
      },
    });
  }

  return poses;
}

export function drawDiagonal() {
  const handedness = "Right";

  const poses = [];
  for (let i = 0; i < 15; i++) {
    poses.push({
      handedness: handedness,
      keypoints: {
        index_finger_tip: { x: 450 - i * 10, y: 80 + i * 10 },
        thumb_tip: { x: 450 - i * 10, y: 85 + i * 10 },
      },
    });
  }

  return poses;
}
