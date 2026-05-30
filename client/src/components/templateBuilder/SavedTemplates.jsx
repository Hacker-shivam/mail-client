import React from "react";

const displayText = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const item = value.find((entry) => entry !== undefined && entry !== null && typeof entry !== "object");
    return item === undefined ? fallback : String(item);
  }

  if (typeof value === "object" && Array.isArray(value.$ifNull)) {
    return displayText(value.$ifNull, fallback);
  }

  return fallback;
};

const SavedTemplates = ({
  listLoading,
  templates,
  activeTemplateId,
  loadSavedTemplate,
  versions,
  restoreVersion,
  compact = false
}) => (
  <div className={compact ? "mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" : "border-t border-slate-200 bg-slate-50 p-5"}>
    <div className={compact ? "space-y-3" : "flex flex-col gap-3 md:flex-row md:items-start md:justify-between"}>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Saved Templates</h3>
        <p className={compact ? "mt-1 text-xs text-slate-500" : "mt-1 text-sm text-slate-500"}>Load saved builder templates.</p>
      </div>
      {activeTemplateId && !compact && (
        <div className="w-full rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:w-80">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Version Restore</p>
          <VersionList versions={versions} restoreVersion={restoreVersion} fullDate />
        </div>
      )}
    </div>

    <div className={compact ? "mt-3 max-h-44 space-y-2 overflow-y-auto pr-1" : "mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3"}>
      {listLoading && <p className="text-sm text-slate-500">Loading templates...</p>}
      {!listLoading && templates.length === 0 && <p className="text-sm text-slate-500">No templates saved yet.</p>}
      {templates.map((item) => (
        <button
          key={item._id}
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("template/id", item._id);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => loadSavedTemplate(item._id)}
          className={`cursor-grab rounded-lg border bg-white p-3 text-left shadow-sm hover:border-emerald-400 hover:bg-emerald-50 active:cursor-grabbing ${
            activeTemplateId === item._id ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">{displayText(item.name, "Untitled template")}</p>
              <p className="text-sm text-slate-500">{displayText(item.slug)}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {item.sourceJson ? "Builder" : "Raw"}
            </span>
          </div>
        </button>
      ))}
    </div>

    {activeTemplateId && compact && versions.length > 0 && (
      <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-500">
          Versions
        </summary>
        <div className="mt-2">
          <VersionList versions={versions} restoreVersion={restoreVersion} />
        </div>
      </details>
    )}
  </div>
);

const VersionList = ({ versions, restoreVersion, fullDate = false }) => (
  <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
    {versions.length === 0 && <p className="text-sm text-slate-500">No versions yet.</p>}
    {versions.map((version) => (
      <button
        key={version._id}
        type="button"
        onClick={() => restoreVersion(version.version)}
        className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1 text-left text-xs hover:bg-slate-50"
      >
        <span className="font-semibold text-slate-800">v{version.version}</span>
        <span className="text-slate-500">
          {fullDate
            ? new Date(version.createdAt).toLocaleString()
            : new Date(version.createdAt).toLocaleDateString()}
        </span>
      </button>
    ))}
  </div>
);

export default SavedTemplates;
