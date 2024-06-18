import React, { useState, useRef, useEffect } from "react";

export const ObjectShape = Object.freeze({
  LINE: "line",
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
});

const FloatingMenu = ({
  drawingCanvasCtx,
  isStreaming,
  setStreaming,
  videoRef,
  isModelLoaded,
  objectModeRef,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(position);
  const rel = useRef(null);

  const [drawingObjectMode, setDrawingObjectMode] = useState(
    objectModeRef.current
  );

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const startTimeoutRef = useRef(null);
  useEffect(() => {
    if (isStreaming) {
      return;
    }
    if (startTimeoutRef.current) {
      return;
    }
    startTimeoutRef.current = setTimeout(() => {
      setStreaming(true);
    }, 400);
  }, [setStreaming, isStreaming]);

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

  return null;
  // return (
  //   <div
  //     className="rounded-lg absolute bg-gray-200 bg-opacity-80 p-4 cursor-move flex flex-col"
  //     style={{
  //       top: `${position.y}px`,
  //       left: `${position.x}px`,
  //       zIndex: 3,
  //     }}
  //     onMouseDown={onMouseDown}
  //     onMouseUp={onMouseUp}
  //     onMouseMove={onMouseMove}>
  //     <div className="text-center font-bold text-xl">Menu</div>
  //     {isModelLoaded && videoRef && (
  //       <button
  //         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
  //         onClick={() => {
  //           setStreaming((prevState) => !prevState);
  //         }}>
  //         {isStreaming ? "Stop Drawing" : "Start Drawing"}
  //       </button>
  //     )}
  //     {isStreaming && (
  //       <button
  //         className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
  //         onClick={() => {
  //           drawingCanvasCtx.clearRect(
  //             0,
  //             0,
  //             videoRef.current.width,
  //             videoRef.current.height
  //           );
  //         }}>
  //         Clear Canvas!
  //       </button>
  //     )}
  //     {isStreaming && (
  //       <div className="flex justify-between mt-4 space-x-2">
  //         <button
  //           className={`bg-white hover:bg-gray-200 p-2 rounded ${
  //             drawingObjectMode === ObjectShape.LINE
  //               ? "ring-2 ring-blue-500"
  //               : ""
  //           }`}
  //           onClick={() => {
  //             setDrawingObjectMode(ObjectShape.LINE);
  //             objectModeRef.current = ObjectShape.LINE;
  //           }}>
  //           <i className="fa-solid fa-pen"></i>
  //         </button>
  //         <button
  //           className={`bg-white hover:bg-gray-200 p-2 rounded ${
  //             drawingObjectMode === ObjectShape.CIRCLE
  //               ? "ring-2 ring-blue-500"
  //               : ""
  //           }`}
  //           onClick={() => {
  //             setDrawingObjectMode(ObjectShape.CIRCLE);
  //             objectModeRef.current = ObjectShape.CIRCLE;
  //           }}>
  //           <i className="fa-regular fa-circle"></i>
  //         </button>
  //         <button
  //           className={`bg-white hover:bg-gray-200 p-2 rounded ${
  //             drawingObjectMode === ObjectShape.RECTANGLE
  //               ? "ring-2 ring-blue-500"
  //               : ""
  //           }`}
  //           onClick={() => {
  //             setDrawingObjectMode(ObjectShape.RECTANGLE);
  //             objectModeRef.current = ObjectShape.RECTANGLE;
  //           }}>
  //           <i className="fa-regular fa-square"></i>
  //         </button>
  //       </div>
  //     )}
  //   </div>
  // );
};

export default FloatingMenu;
