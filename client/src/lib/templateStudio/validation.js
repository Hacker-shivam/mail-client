import { INTERACTIVE_BLOCK_TYPES } from "./schema";
import { collectDocumentVariables } from "./variables";

const requireText = (block, prop, errors) => {
  if (!String(block.props?.[prop] || "").trim()) {
    errors.push({
      code: "MISSING_BLOCK_TEXT",
      blockId: block.id,
      blockType: block.type,
      message: `${block.type} block needs ${prop}.`
    });
  }
};

export const validateStudioDocument = (document) => {
  const errors = [];
  const warnings = [];
  const blocks = document?.blocks || [];

  if (!blocks.length) {
    warnings.push({
      code: "EMPTY_TEMPLATE",
      message: "Add at least one block before sending."
    });
  }

  blocks.forEach((block) => {
    if (!block.id) {
      errors.push({
        code: "MISSING_BLOCK_ID",
        blockType: block.type,
        message: "Every block must have a stable id."
      });
    }

    if (!block.type) {
      errors.push({
        code: "MISSING_BLOCK_TYPE",
        blockId: block.id,
        message: "Every block must define a type."
      });
    }

    if (block.type === "heading" || block.type === "text") {
      requireText(block, "text", errors);
    }

    if (block.type === "image" && !block.props?.src) {
      warnings.push({
        code: "MISSING_IMAGE_SOURCE",
        blockId: block.id,
        message: "Image block has no image source."
      });
    }

    if (INTERACTIVE_BLOCK_TYPES.has(block.type) && !(block.props?.fields || []).length) {
      warnings.push({
        code: "EMPTY_INTERACTIVE_BLOCK",
        blockId: block.id,
        message: "Interactive block should include at least one field."
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    variables: collectDocumentVariables(document)
  };
};
