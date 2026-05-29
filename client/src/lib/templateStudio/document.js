import { DEFAULT_THEME, INTERACTIVE_BLOCK_TYPES, createEmptyDocument } from "./schema";

const clampIndex = (index, length) => Math.max(0, Math.min(Number(index) || 0, length));

export const createBlockId = (type = "block") => {
  const random = Math.random().toString(36).slice(2, 7);
  return `${type}-${Date.now()}-${random}`;
};

export const cloneStudioBlock = (block, fallbackType = "block") => ({
  ...(block || {}),
  id: createBlockId(block?.type || fallbackType),
  type: block?.type || fallbackType,
  props: {
    ...(block?.props || {})
  }
});

export const normalizeDocument = (document) => {
  const source = document || createEmptyDocument();

  return {
    ...source,
    version: source.version || 1,
    theme: {
      ...DEFAULT_THEME,
      ...(source.theme || {})
    },
    blocks: Array.isArray(source.blocks)
      ? source.blocks.map((block) => ({
          ...block,
          id: block.id || createBlockId(block.type),
          props: {
            ...(block.props || {})
          }
        }))
      : []
  };
};

export const updateThemeToken = (document, key, value) => ({
  ...normalizeDocument(document),
  theme: {
    ...normalizeDocument(document).theme,
    [key]: value
  }
});

export const updateBlockPropsInDocument = (document, blockId, patch) => {
  const next = normalizeDocument(document);

  return {
    ...next,
    blocks: next.blocks.map((block) => (
      block.id === blockId
        ? {
            ...block,
            props: {
              ...(block.props || {}),
              ...(patch || {})
            }
          }
        : block
    ))
  };
};

export const insertBlockInDocument = (document, block, index) => {
  const next = normalizeDocument(document);
  const targetIndex = clampIndex(index ?? next.blocks.length, next.blocks.length);
  const blocks = [...next.blocks];
  const inserted = cloneStudioBlock(block, block?.type);

  blocks.splice(targetIndex, 0, inserted);

  return {
    document: {
      ...next,
      blocks
    },
    block: inserted
  };
};

export const insertBlocksInDocument = (document, blocksToInsert = [], index) => {
  const next = normalizeDocument(document);
  const targetIndex = clampIndex(index ?? next.blocks.length, next.blocks.length);
  const blocks = [...next.blocks];
  const inserted = blocksToInsert.map((block) => cloneStudioBlock(block, block.type));

  blocks.splice(targetIndex, 0, ...inserted);

  return {
    document: {
      ...next,
      blocks
    },
    blocks: inserted
  };
};

export const moveBlockInDocument = (document, blockId, index) => {
  const next = normalizeDocument(document);
  const currentIndex = next.blocks.findIndex((block) => block.id === blockId);

  if (currentIndex < 0) {
    return {
      document: next,
      block: null
    };
  }

  const blocks = [...next.blocks];
  const [block] = blocks.splice(currentIndex, 1);
  const targetIndex = clampIndex(index, blocks.length);

  blocks.splice(targetIndex, 0, block);

  return {
    document: {
      ...next,
      blocks
    },
    block
  };
};

export const removeBlockFromDocument = (document, blockId) => {
  const next = normalizeDocument(document);
  const blocks = next.blocks.filter((block) => block.id !== blockId);

  return {
    document: {
      ...next,
      blocks
    },
    nextSelectedId: blocks[0]?.id || ""
  };
};

export const duplicateBlockInDocument = (document, blockId) => {
  const next = normalizeDocument(document);
  const index = next.blocks.findIndex((block) => block.id === blockId);

  if (index < 0) {
    return {
      document: next,
      block: null
    };
  }

  const blocks = [...next.blocks];
  const duplicate = cloneStudioBlock(blocks[index], blocks[index].type);
  blocks.splice(index + 1, 0, duplicate);

  return {
    document: {
      ...next,
      blocks
    },
    block: duplicate
  };
};

export const getDocumentStats = (document, validation) => {
  const blocks = normalizeDocument(document).blocks;
  const missingVariables = validation?.warnings
    ?.find((issue) => issue.code === "MISSING_VARIABLE_VALUES")
    ?.variables?.length || 0;

  return {
    blocks: blocks.length,
    interactive: blocks.filter((block) => INTERACTIVE_BLOCK_TYPES.has(block.type)).length,
    variables: missingVariables,
    errors: validation?.errors?.length || 0,
    warnings: validation?.warnings?.length || 0
  };
};
