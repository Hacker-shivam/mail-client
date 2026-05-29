export const createComponentRegistry = ({
  presets = {},
  groups = [],
  labels = {},
  descriptions = {}
} = {}) => {
  const blockMap = new Map(Object.entries(presets));
  const labelMap = new Map(Object.entries(labels));
  const descriptionMap = new Map(Object.entries(descriptions));

  return {
    listGroups() {
      return groups.map((group) => ({
        ...group,
        items: [...(group.items || [])]
      }));
    },
    listTypes() {
      return Array.from(blockMap.keys());
    },
    has(type) {
      return blockMap.has(type);
    },
    get(type) {
      return blockMap.get(type);
    },
    getLabel(type) {
      return labelMap.get(type) || type;
    },
    getDescription(type) {
      return descriptionMap.get(type) || "Custom block";
    },
    register(type, preset, options = {}) {
      blockMap.set(type, preset);

      if (options.label) {
        labelMap.set(type, options.label);
      }

      if (options.description) {
        descriptionMap.set(type, options.description);
      }
    },
    extend(entries = []) {
      entries.forEach((entry) => {
        this.register(entry.type, entry.block, {
          label: entry.label,
          description: entry.description
        });
      });
    }
  };
};
