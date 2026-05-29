import React, { useMemo, useState } from "react";
import { toEmailBuilderDocument, toEasyEmailValues } from "../../lib/templateStudio";
import FabricComposer from "./FabricComposer";

const engineTabs = [
  { id: "emailbuilder", label: "EmailBuilder.js" },
  { id: "easyemail", label: "Easy Email" },
  { id: "fabric", label: "Fabric.js" }
];

const AdvancedEditorSuite = ({
  sourceJson,
  template,
  addImageBlockFromComposer
}) => {
  const [activeEngine, setActiveEngine] = useState("emailbuilder");

  return (
    <section className="min-w-0 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#0f766e]">Advanced engines</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Professional Editor Stack</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use EmailBuilder.js rendering, Easy Email layout tooling, and Fabric.js visual composition beside your native Acolyte builder.
            </p>
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
            {engineTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveEngine(tab.id)}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-black transition ${
                  activeEngine === tab.id
                    ? "bg-white text-[#0f766e] shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeEngine === "emailbuilder" && (
        <EmailBuilderPreview sourceJson={sourceJson} />
      )}

      {activeEngine === "easyemail" && (
        <EasyEmailWorkspace sourceJson={sourceJson} template={template} />
      )}

      {activeEngine === "fabric" && (
        <FabricComposer onExportImage={addImageBlockFromComposer} />
      )}
    </section>
  );
};

const EmailBuilderPreview = ({ sourceJson }) => {
  const [error, setError] = useState("");
  const [html, setHtml] = useState("");
  const waypointDocument = useMemo(() => toEmailBuilderDocument(sourceJson), [sourceJson]);

  const renderHtml = async () => {
    try {
      setError("");
      const { renderToStaticMarkup } = await import("@usewaypoint/email-builder");
      const output = renderToStaticMarkup(waypointDocument, { rootBlockId: "root" });
      setHtml(output);
    } catch (renderError) {
      setError(renderError.message || "EmailBuilder.js render failed");
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">EmailBuilder.js</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">Renderer Compatibility Preview</h3>
          <p className="mt-1 text-sm text-slate-500">Current Acolyte JSON is adapted into the EmailBuilder.js document shape.</p>
        </div>
        <button type="button" onClick={renderHtml} className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700">
          Render HTML
        </button>
      </div>

      {error && <p className="m-4 rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}

      <div className="grid gap-4 p-4 xl:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Adapted JSON</p>
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-xs text-slate-700">
            {JSON.stringify(waypointDocument, null, 2)}
          </pre>
        </div>
        <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
            Rendered output
          </div>
          {html ? (
            <iframe title="EmailBuilder.js output" srcDoc={html} className="h-[520px] w-full bg-white" />
          ) : (
            <div className="flex h-[520px] items-center justify-center p-6 text-center text-sm font-semibold text-slate-500">
              Render with EmailBuilder.js to inspect compatibility.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const EasyEmailWorkspace = ({ sourceJson, template }) => {
  const [modules, setModules] = useState(null);
  const [error, setError] = useState("");

  const initialValues = useMemo(() => toEasyEmailValues(sourceJson, template), [sourceJson, template]);

  const loadEasyEmail = async () => {
    try {
      setError("");
      await Promise.all([
        import("easy-email-editor/lib/style.css"),
        import("easy-email-extensions/lib/style.css")
      ]);

      const core = await import("easy-email-core");
      const editor = await import("easy-email-editor");
      const extensions = await import("easy-email-extensions");

      const content = core.BlockManager.getBlockByType(core.BasicType.PAGE).create({});
      setModules({
        core,
        EmailEditor: editor.EmailEditor,
        EmailEditorProvider: editor.EmailEditorProvider,
        StandardLayout: extensions.StandardLayout,
        categories: [
          {
            label: "Content",
            active: true,
            blocks: [
              { type: core.AdvancedType.TEXT },
              { type: core.AdvancedType.IMAGE },
              { type: core.AdvancedType.BUTTON },
              { type: core.AdvancedType.SOCIAL },
              { type: core.AdvancedType.DIVIDER },
              { type: core.AdvancedType.SPACER },
              { type: core.AdvancedType.HERO }
            ]
          },
          {
            label: "Layout",
            active: true,
            displayType: "column",
            blocks: [
              { title: "2 columns", payload: [["50%", "50%"], ["33%", "67%"], ["67%", "33%"]] },
              { title: "3 columns", payload: [["33.33%", "33.33%", "33.33%"], ["25%", "25%", "50%"]] }
            ]
          }
        ],
        initialData: {
          ...initialValues,
          content
        }
      });
    } catch (loadError) {
      setError(loadError.message || "Easy Email could not be loaded");
    }
  };

  if (!modules) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-violet-700">Zalify Easy Email</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">MJML-Style Email Editor</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Easy Email was built for React 18, while this app uses React 19. It is isolated as an optional engine so your main builder remains stable.
        </p>
        {error && <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
        <button type="button" onClick={loadEasyEmail} className="mt-5 rounded-md bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-700">
          Load Easy Email Editor
        </button>
      </section>
    );
  }

  const { EmailEditor, EmailEditorProvider, StandardLayout, categories, initialData } = modules;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <EmailEditorProvider data={initialData} height="720px" autoComplete dashed={false}>
        {() => (
          <StandardLayout categories={categories} showSourceCode>
            <EmailEditor />
          </StandardLayout>
        )}
      </EmailEditorProvider>
    </section>
  );
};

export default AdvancedEditorSuite;
