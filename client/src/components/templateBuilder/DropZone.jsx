import React, { useState } from "react";

const DropZone = ({
  index,
  handleBuilderDrop,
  compact = false
}) => {
  const [active, setActive] = useState(false);

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        setActive(false);
        handleBuilderDrop(event, index);
      }}
      className={`transition ${
        compact
          ? `h-3 rounded ${active ? "bg-[#0f766e]/20" : "bg-transparent"}`
          : `my-2 flex h-10 items-center justify-center rounded-lg border border-dashed text-xs font-black uppercase tracking-[0.18em] ${
              active
                ? "border-[#0f766e] bg-emerald-50 text-[#0f766e]"
                : "border-transparent text-transparent hover:border-slate-300 hover:bg-slate-50 hover:text-slate-400"
            }`
      }`}
    >
      {!compact && (active ? "Release to place block" : "Drop block here")}
    </div>
  );
};

export default DropZone;
