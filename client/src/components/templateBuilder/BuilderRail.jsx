import React from "react";

const BuilderRail = ({
  sections,
  activeSection,
  setActiveSection,
  collapse
}) => (
  <nav className="flex min-h-full flex-col items-stretch border-r border-slate-200 bg-white">
    <div className="border-b border-slate-200 px-2 py-3">
      <button
        type="button"
        onClick={collapse}
        className="w-full rounded-md border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
      >
        Hide
      </button>
    </div>

    <div className="flex-1 space-y-1 p-2">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => setActiveSection(section.id)}
          className={`w-full rounded-md border px-2 py-3 text-center transition ${
            activeSection === section.id
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-transparent text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-md border border-current text-xs font-black">
            {section.label.slice(0, 1)}
          </span>
          <span className="mt-1 block text-xs font-bold">{section.label}</span>
        </button>
      ))}
    </div>
  </nav>
);

export default BuilderRail;
