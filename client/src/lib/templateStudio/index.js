export {
  CANVAS_FEATURES,
  DEFAULT_THEME,
  DOCUMENT_VERSION,
  INTERACTIVE_BLOCK_TYPES,
  createEmptyDocument
} from "./schema";

export {
  cloneStudioBlock,
  createBlockId,
  duplicateBlockInDocument,
  getDocumentStats,
  insertBlockInDocument,
  insertBlocksInDocument,
  moveBlockInDocument,
  normalizeDocument,
  removeBlockFromDocument,
  updateBlockPropsInDocument,
  updateThemeToken
} from "./document";

export { createComponentRegistry } from "./registry";

export {
  DEFAULT_SAMPLE_VALUES,
  collectDocumentVariables,
  extractVariables,
  interpolateVariables
} from "./variables";

export { validateStudioDocument } from "./validation";

export { toEasyEmailValues, toEmailBuilderDocument } from "./integrations";

export { renderStudioDocument } from "./renderHtml";
