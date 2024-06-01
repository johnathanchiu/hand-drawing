function simplifyPath(points, epsilon) {
  // Find the point with the maximum distance
  let dmax = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (dmax > epsilon) {
    const firstSegment = points.slice(0, index + 1);
    const secondSegment = points.slice(index);
    const simplifiedFirst = simplifyPath(firstSegment, epsilon);
    const simplifiedSecond = simplifyPath(secondSegment, epsilon);
    // Concatenate the simplified segments
    return simplifiedFirst
      .slice(0, simplifiedFirst.length - 1)
      .concat(simplifiedSecond);
  } else {
    // Max distance is within tolerance, return the endpoints
    return [points[0], points[end]];
  }
}

// Calculate perpendicular distance of a point from a line segment
function perpendicularDistance(point, lineStart, lineEnd) {
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;
  const { x: x, y: y } = point;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mag = dx * dx + dy * dy;
  const dot = ((x - x1) * dx + (y - y1) * dy) / mag;
  const closestX = x1 + dx * dot;
  const closestY = y1 + dy * dot;
  return Math.sqrt(
    (x - closestX) * (x - closestX) + (y - closestY) * (y - closestY)
  );
}
