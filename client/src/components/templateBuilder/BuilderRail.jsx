import React from "react";
import {
  ClipboardList,
  Folder,
  LayoutPanelLeft,
  Lightbulb,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Wand2
} from "lucide-react";

const icons = {
  edit: SlidersHorizontal,
  style: Palette,
  layouts: LayoutPanelLeft,
  designs: Sparkles,
  widgets: Wand2,
  forms: ClipboardList,
  saved: Folder
};

const BuilderRail = ({
  sections,
  activeSection,
  setActiveSection,
  collapse
}) => (
  <nav className="flex min-h-full flex-col items-stretch border-r border-[#dde5f0] bg-white">
    <div className="flex-1 space-y-1 py-5">
      {sections.map((section) => (
        <RailButton
          key={section.id}
          section={section}
          active={activeSection === section.id}
          onClick={() => setActiveSection(section.id)}
        />
      ))}
    </div>
    <button
      type="button"
      onClick={collapse}
      className="mb-4 flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-semibold text-slate-500 hover:text-[#6c4cff]"
    >
      <span className="relative">
        <Lightbulb size={20} />
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">4</span>
      </span>
      Improve
    </button>
  </nav>
);

const RailButton = ({ section, active, onClick }) => {
  const Icon = icons[section.id] || Palette;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center gap-1 border-l-2 px-2 py-3 text-[11px] font-semibold transition ${
        active
          ? "border-[#6c4cff] bg-[#f1edff] text-[#6c4cff]"
          : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <Icon size={20} strokeWidth={1.8} />
      {section.label}
    </button>
  );
};

export default BuilderRail;
