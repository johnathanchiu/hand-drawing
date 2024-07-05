import React, { useState, useRef, useEffect } from "react";

const FloatingMenu = ({
  isStreaming,
  setStreaming,
  videoRef,
  isModelLoaded,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);
  const relativePosition = useRef(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const onMouseDown = (e) => {
    setDragging(true);
    // Calculate the relative position of the mouse click inside the element
    relativePosition.current = {
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
        x: e.pageX - relativePosition.current.x,
        y: e.pageY - relativePosition.current.y,
      });
    });

    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      className="rounded-lg absolute bg-gray-200 bg-opacity-80 p-2 cursor-move flex flex-col"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 100000000000,
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
      <div className="text-center">Settings</div>
      {isModelLoaded && videoRef && (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded mt-2"
          onClick={() => {
            setStreaming((prevState) => !prevState);
          }}
        >
          {isStreaming ? "Close Webcam" : "Toggle Webcam"}
        </button>
      )}
      <div className="text-right text-xs pt-2">by johnathan chiu</div>
    </div>
  );
};

export default FloatingMenu;
