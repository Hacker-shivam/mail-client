const padding = (value = 16) => ({
  top: value,
  bottom: value,
  right: 24,
  left: 24
});

const waypointFont = (fontFamily = "") => {
  if (fontFamily.toLowerCase().includes("serif")) {
    return "BOOK_SERIF";
  }

  if (fontFamily.toLowerCase().includes("mono")) {
    return "MONOSPACE";
  }

  return "MODERN_SANS";
};

export const toEmailBuilderDocument = (sourceJson = {}) => {
  const theme = sourceJson.theme || {};
  const childrenIds = [];
  const document = {
    root: {
      type: "EmailLayout",
      data: {
        backdropColor: theme.backgroundColor || "#f8fafc",
        canvasColor: theme.contentColor || "#ffffff",
        textColor: theme.textColor || "#111827",
        fontFamily: waypointFont(theme.fontFamily),
        childrenIds
      }
    }
  };

  (sourceJson.blocks || []).forEach((block, index) => {
    const id = block.id || `${block.type}-${index}`;
    const props = block.props || {};
    childrenIds.push(id);

    if (block.type === "heading") {
      document[id] = {
        type: "Heading",
        data: {
          props: {
            text: props.text || "Heading",
            level: props.level || "h2"
          },
          style: {
            color: props.color || theme.textColor || "#111827",
            fontSize: Number(props.fontSize || 24),
            textAlign: props.align || "left",
            padding: padding(12)
          }
        }
      };
      return;
    }

    if (block.type === "button") {
      document[id] = {
        type: "Button",
        data: {
          props: {
            text: props.text || "Open",
            url: props.href || props.url || "{{formHtmlUrl}}",
            buttonBackgroundColor: props.backgroundColor || theme.primaryColor || "#0f766e",
            buttonTextColor: props.color || "#ffffff",
            buttonStyle: Number(props.radius || 6) > 20 ? "pill" : "rounded"
          },
          style: {
            textAlign: props.align || "center",
            padding: padding(12)
          }
        }
      };
      return;
    }

    if (block.type === "image") {
      document[id] = {
        type: "Image",
        data: {
          props: {
            url: props.src || "",
            alt: props.alt || "Email image",
            width: Number(props.width || theme.width || 600),
            height: Number(props.height || 320),
            linkHref: props.href || null
          },
          style: {
            textAlign: props.align || "center",
            padding: padding(0)
          }
        }
      };
      return;
    }

    if (block.type === "divider") {
      document[id] = {
        type: "Divider",
        data: {
          props: {
            lineColor: props.color || "#e5e7eb",
            lineHeight: 1
          },
          style: {
            padding: padding(8)
          }
        }
      };
      return;
    }

    if (block.type === "spacer") {
      document[id] = {
        type: "Spacer",
        data: {
          props: {
            height: Number(props.height || 24)
          }
        }
      };
      return;
    }

    if (block.type === "rawHtml") {
      document[id] = {
        type: "Html",
        data: {
          props: {
            contents: props.html || ""
          },
          style: {
            padding: padding(12)
          }
        }
      };
      return;
    }

    const text = props.text || props.description || props.title || "Content block";
    document[id] = {
      type: "Text",
      data: {
        props: {
          text,
          markdown: false
        },
        style: {
          color: props.color || props.textColor || theme.mutedColor || "#475569",
          fontSize: Number(props.fontSize || 15),
          textAlign: props.align || "left",
          padding: padding(12)
        }
      }
    };
  });

  return document;
};

export const toEasyEmailValues = (sourceJson = {}, template = {}) => ({
  subject: template.subject || sourceJson.subject || "Campaign template",
  subTitle: "Built with Acolyte Template Studio",
  content: null
});
