export const DOCUMENT_VERSION = 1;

export const DEFAULT_THEME = {
  width: 600,
  backgroundColor: "#f8fafc",
  contentColor: "#ffffff",
  primaryColor: "#0f766e",
  textColor: "#111827",
  mutedColor: "#64748b",
  fontFamily: "Arial, sans-serif"
};

export const INTERACTIVE_BLOCK_TYPES = new Set([
  "form",
  "poll",
  "survey",
  "rating",
  "nps",
  "appointment",
  "booking",
  "quiz",
  "productFeedback",
  "rsvp"
]);

export const CANVAS_FEATURES = {
  dragAndDrop: true,
  sortableLayers: true,
  editableText: true,
  reusableBlocks: true,
  responsivePreview: true,
  themeTokens: true,
  customBlocks: true,
  validation: true,
  exportTargets: ["html", "amp", "formHtml", "text"],
  planned: [
    "absolute freeform canvas mode",
    "multi-select and alignment tools",
    "brand kit asset manager",
    "layout constraints",
    "collaboration presence",
    "version branches"
  ]
};

export const createEmptyDocument = (overrides = {}) => ({
  version: DOCUMENT_VERSION,
  theme: {
    ...DEFAULT_THEME,
    ...(overrides.theme || {})
  },
  blocks: overrides.blocks || [],
  meta: {
    editor: "Acolyte Template Studio",
    ...(overrides.meta || {})
  }
});
