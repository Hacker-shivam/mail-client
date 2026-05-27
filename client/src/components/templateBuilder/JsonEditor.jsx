import React from "react";

const JsonEditor = ({
  jsonText,
  setJsonText,
  applyJson,
  jsonError
}) => (
  <details className="rounded-lg border border-slate-200 p-4">
    <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-slate-500">Advanced JSON</summary>
    <div className="mt-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">Directly edit the single template source.</p>
        <button type="button" onClick={applyJson} className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold">Apply</button>
      </div>
      {jsonError && <p className="mb-2 text-sm font-semibold text-red-600">{jsonError}</p>}
      <textarea
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
        rows={12}
        className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  </details>
);

export default JsonEditor;
