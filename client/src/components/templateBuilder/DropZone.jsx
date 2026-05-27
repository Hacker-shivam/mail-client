import React from "react";

const DropZone = ({
  index,
  handleBuilderDrop,
  compact = false
}) => (
  <div
    onDragOver={(event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }}
    onDrop={(event) => handleBuilderDrop(event, index)}
    className={`rounded-md border border-dashed border-transparent transition hover:border-emerald-400 hover:bg-emerald-50 ${
      compact ? "h-3" : "my-2 flex h-10 items-center justify-center text-xs font-bold uppercase tracking-wide text-emerald-700"
    }`}
  >
    {!compact && "Drop here"}
  </div>
);

export default DropZone;
