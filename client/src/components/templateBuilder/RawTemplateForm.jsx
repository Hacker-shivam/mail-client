import React from "react";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

const inputText = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object" && Array.isArray(value.$ifNull)) {
    const item = value.$ifNull.find((entry) => entry !== undefined && entry !== null && typeof entry !== "object");
    return item === undefined ? "" : String(item);
  }

  return "";
};

const InputField = ({ label, ...props }) => (
  <label className="block">
    {label && <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>}
    <input className={inputClass} {...props} />
  </label>
);

const RawTemplateForm = ({ rawTemplate, updateRawField }) => (
  <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3">
      <InputField name="name" value={inputText(rawTemplate.name)} onChange={updateRawField} placeholder="Template name" required />
      <InputField name="slug" value={inputText(rawTemplate.slug)} onChange={updateRawField} placeholder="template-slug" />
      <InputField name="subject" value={inputText(rawTemplate.subject)} onChange={updateRawField} placeholder="Subject" />
    </div>
    <textarea name="html" value={rawTemplate.html} onChange={updateRawField} placeholder="HTML email template" required rows={10} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    <textarea name="amp" value={rawTemplate.amp} onChange={updateRawField} placeholder="Optional AMP email template" rows={6} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    <textarea name="formHtml" value={rawTemplate.formHtml} onChange={updateRawField} placeholder="Hosted form HTML" rows={8} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
  </div>
);

export default RawTemplateForm;
