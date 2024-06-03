export function chaikinSmoothing(path, iterations = 1) {
  function chaikin(points) {
    let newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      let p0 = points[i];
      let p1 = points[i + 1];
      let Q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
      let R = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
      newPoints.push(Q, R);
    }
    return newPoints;
  }

  let smoothedPath = path;
  for (let i = 0; i < iterations; i++) {
    smoothedPath = chaikin(smoothedPath);
  }
  return smoothedPath;
}
