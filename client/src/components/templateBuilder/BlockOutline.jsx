import React from "react";
import DropZone from "./DropZone";

const BlockOutline = ({
  blocks,
  selectedBlockId,
  setSelectedBlockId,
  handleBuilderDrop
}) => (
  <div className="mt-5">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Outline</p>
      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">{blocks.length}</span>
    </div>
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <DropZone index={0} handleBuilderDrop={handleBuilderDrop} compact />
      {blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("block/id", block.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => setSelectedBlockId(block.id)}
            className={`w-full cursor-grab rounded-md border px-3 py-2 text-left text-sm active:cursor-grabbing ${
              selectedBlockId === block.id
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="font-semibold">{index + 1}. {block.type}</span>
            <span className="block truncate text-xs text-slate-500">
              {block.props?.text || block.props?.title || block.props?.src || block.id}
            </span>
          </button>
          <DropZone index={index + 1} handleBuilderDrop={handleBuilderDrop} compact />
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default BlockOutline;
