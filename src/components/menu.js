// src/FloatingMenu.js
import React, { useState, useRef, useEffect } from "react";

const FloatingMenu = ({
  drawingCanvasCtx,
  isStreaming,
  setStreaming,
  videoRef,
  isModelLoaded,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);
  const rel = useRef(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const onMouseDown = (e) => {
    setDragging(true);
    // Calculate the relative position of the mouse click inside the element
    rel.current = {
      x: e.pageX - positionRef.current.x,
      y: e.pageY - positionRef.current.y,
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    e.stopPropagation();
    e.preventDefault();
  };

  const onMouseUp = (e) => {
    setDragging(false);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    e.stopPropagation();
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!dragging) return;

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      setPosition({
        x: e.pageX - rel.current.x,
        y: e.pageY - rel.current.y,
      });
    });

    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      className="rounded"
      style={{
        position: "absolute",
        top: `${position.y}px`,
        left: `${position.x}px`,
        padding: "10px",
        backgroundColor: "rgba(211, 211, 211, 0.8)",
        cursor: "move",
        zIndex: 3,
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
      <div className="text-center font-bold">Menu</div>
      {isModelLoaded && videoRef && (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          onClick={() => {
            setStreaming((prevState) => !prevState);
          }}
        >
          {isStreaming ? "Stop Drawing" : "Start Drawing"}
        </button>
      )}
      {isStreaming && (
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
          onClick={() => {
            drawingCanvasCtx.clearRect(
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
    </div>
  );
};

export default FloatingMenu;
