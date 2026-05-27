import React from "react";

const replaceSampleValues = (html = "") => {
  const sample = {
    email: "demo@example.com",
    trackingId: "preview-tracking-id",
    campaignName: "startup-loan",
    campaignType: "Loan",
    subject: "Preview subject",
    unsubscribeUrl: "#unsubscribe",
    formHtmlUrl: "https://example.com/hosted-form",
    directFormHtmlUrl: "https://example.com/hosted-form",
    formAmpUrl: "https://example.com/amp-form-submit",
    formActionUrl: "https://example.com/form-submit",
    baseUrl: "http://localhost:5000",
    templateId: "preview-template-id",
    templateSlug: "preview-template",
    preheader: "Preview"
  };

  const replaced = Object.entries(sample).reduce((next, [key, value]) => {
    return next.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
  }, html);

  return replaced.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key) => `[${key}]`);
};

const OutputPreview = ({
  previewMarkup,
  renderedPreviewMarkup,
  previewTab,
  setPreviewTab,
  preview,
  previewViewport,
  setPreviewViewport,
  sideBySidePreview,
  setSideBySidePreview,
  previewLoading,
  previewError,
  previewValidation
}) => {
  const exportCode = () => {
    const blob = new Blob([previewMarkup || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${previewTab}-template.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const frameClass = previewViewport === "mobile"
    ? "mx-auto h-[520px] w-[375px] max-w-full bg-white"
    : "h-[420px] w-full bg-white xl:h-[520px]";
  const tabs = ["html", "amp", "formHtml"];
  const tabLabel = (tab) => {
    if (tab === "html") {
      return "HTML Email";
    }

    if (tab === "amp") {
      return "AMP Email";
    }

    return "AMP Web Form";
  };

  return (
    <>
      <div className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
          <div className="flex min-w-0 flex-1 overflow-x-auto rounded-md bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                className={`shrink-0 rounded-md px-2 py-2 text-xs font-bold sm:flex-1 ${
                  previewTab === tab ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
              >
                {tabLabel(tab)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPreviewViewport(previewViewport === "desktop" ? "mobile" : "desktop")} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold">
            {previewViewport === "desktop" ? "Mobile" : "Desktop"}
          </button>
          <button type="button" onClick={() => setSideBySidePreview(!sideBySidePreview)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold">
            {sideBySidePreview ? "Single" : "Side-by-side"}
          </button>
          <button type="button" onClick={exportCode} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold">
            Export
          </button>
        </div>

        {sideBySidePreview ? (
          <div className="grid min-w-0 gap-3 p-3 lg:grid-cols-3">
            {tabs.map((tab) => (
              <div key={tab} className="min-w-0 overflow-hidden rounded border border-slate-200">
                <p className="border-b border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
                  {tabLabel(tab)}
                </p>
                <iframe
                  title={`${tab} preview`}
                  srcDoc={replaceSampleValues(preview?.[tab] || "")}
                  className="block h-[360px] w-full max-w-full bg-white"
                />
              </div>
            ))}
          </div>
        ) : (
          <iframe
            title="Generated output preview"
            srcDoc={renderedPreviewMarkup}
            className={`${frameClass} block`}
          />
        )}

        {!previewMarkup && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {previewLoading ? "Generating preview..." : "Preview will appear here automatically. You can also click Generate Outputs."}
          </div>
        )}
      </div>

      {previewLoading && (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Updating preview from your latest canvas changes...
        </div>
      )}
      {previewError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {previewError}
        </div>
      )}
      {previewValidation && (
        <div className={`rounded-md border px-3 py-2 text-xs ${
          previewValidation.valid
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          <div className="mb-2 font-bold">
            {previewValidation.valid ? "Validation passed" : "Validation needs attention"}
          </div>
          {previewValidation.errors?.map((issue) => (
            <div key={`${issue.code}-${issue.message}`} className="mb-1">
              Error: {issue.message}
            </div>
          ))}
          {previewValidation.warnings?.map((issue) => (
            <div key={`${issue.code}-${issue.message}`} className="mb-1">
              Warning: {issue.message}
              {issue.variables?.length ? ` (${issue.variables.join(", ")})` : ""}
            </div>
          ))}
        </div>
      )}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Preview uses sample values. Saved templates still keep real placeholders for each recipient.
      </div>
      <textarea
        readOnly
        value={renderedPreviewMarkup}
        rows={8}
        className="w-full max-w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
      />
      <details className="rounded-md border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-500">
          Raw generated code with placeholders
        </summary>
        <textarea
          readOnly
          value={previewMarkup}
          rows={8}
          className="mt-3 w-full max-w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs"
        />
      </details>
    </>
  );
};

export default OutputPreview;
