export const DEFAULT_SAMPLE_VALUES = {
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

export const extractVariables = (value = "") => {
  const variables = new Set();
  const pattern = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;
  let match = pattern.exec(value);

  while (match) {
    variables.add(match[1]);
    match = pattern.exec(value);
  }

  return Array.from(variables);
};

export const interpolateVariables = (value = "", sampleValues = DEFAULT_SAMPLE_VALUES) => {
  const replaced = Object.entries(sampleValues).reduce((next, [key, sample]) => {
    return next.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), sample);
  }, String(value || ""));

  return replaced.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key) => `[${key}]`);
};

export const collectDocumentVariables = (document) => {
  const values = [];

  (document?.blocks || []).forEach((block) => {
    Object.values(block.props || {}).forEach((value) => {
      if (typeof value === "string") {
        values.push(...extractVariables(value));
      }
    });
  });

  return Array.from(new Set(values));
};
