import React, { useState } from "react";
import DropZone from "./DropZone";

const defaultImageGallery = [
  {
    name: "Finance desk",
    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    alt: "Finance documents on a desk"
  },
  {
    name: "Team meeting",
    src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    alt: "Team discussing a project"
  }
];

const replaceSampleValues = (html = "") => {
  const sample = {
    email: "demo@example.com",
    campaignName: "startup-loan",
    campaignType: "Loan",
    subject: "Preview subject",
    unsubscribeUrl: "#unsubscribe",
    formHtmlUrl: "https://example.com/hosted-form"
  };

  const replaced = Object.entries(sample).reduce((next, [key, value]) => {
    return next.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
  }, html);

  return replaced.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key) => `[${key}]`);
};

const EmailCanvas = ({
  sourceJson,
  selectedBlockId,
  setSelectedBlockId,
  handleBuilderDrop,
  updateBlockProps,
  removeBlock
}) => {
  const theme = sourceJson.theme || {};

  return (
    <div
      className="mx-auto min-h-[520px] w-full max-w-full border border-slate-300 shadow-lg sm:min-h-[620px] lg:max-w-[760px] xl:min-h-[700px]"
      style={{
        backgroundColor: theme.contentColor || "#ffffff",
        fontFamily: theme.fontFamily || "Arial, sans-serif"
      }}
    >
      <div className="p-6">
        <DropZone index={0} handleBuilderDrop={handleBuilderDrop} />
        {sourceJson.blocks.map((block, index) => (
          <React.Fragment key={block.id}>
            <CanvasBlock
              block={block}
              theme={theme}
              selected={selectedBlockId === block.id}
              onSelect={() => setSelectedBlockId(block.id)}
              updateBlockProps={updateBlockProps}
              removeBlock={removeBlock}
            />
            <DropZone index={index + 1} handleBuilderDrop={handleBuilderDrop} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const CanvasBlock = ({
  block,
  theme,
  selected,
  onSelect,
  updateBlockProps,
  removeBlock
}) => {
  const props = block.props || {};
  const selectedClass = selected
    ? "ring-2 ring-emerald-500"
    : "ring-1 ring-transparent hover:ring-emerald-300";
  const commonClass = `group relative cursor-grab rounded-sm p-2 transition active:cursor-grabbing ${selectedClass}`;
  const dragProps = {
    draggable: true,
    onDragStart: (event) => {
      event.dataTransfer.setData("block/id", block.id);
      event.dataTransfer.effectAllowed = "move";
    },
    onClick: onSelect
  };
  const actions = (
    <CanvasActions
      type={block.type}
      removeBlock={() => removeBlock(block.id)}
    />
  );

  if (block.type === "heading" || block.type === "text") {
    const Tag = block.type === "heading" ? (props.level || "h2") : "p";

    return (
      <div {...dragProps} className={commonClass}>
        <Tag
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
          onBlur={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
          style={{
            margin: block.type === "heading" ? "0 0 10px" : "0 0 14px",
            color: props.color || theme.textColor || "#111827",
            textAlign: props.align || "left",
            fontSize: `${props.fontSize || (block.type === "heading" ? 24 : 16)}px`,
            fontWeight: block.type === "heading" ? 700 : 400,
            lineHeight: 1.45
          }}
        >
          {replaceSampleValues(props.text || "")}
        </Tag>
        {actions}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div {...dragProps} className={`${commonClass} min-h-48`}>
        <ImageCanvasBlock block={block} selected={selected} updateBlockProps={updateBlockProps} />
        {actions}
      </div>
    );
  }

  if (block.type === "button") {
    return (
      <div {...dragProps} className={`${commonClass} text-center`}>
        <span
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
          onBlur={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
          className="inline-block font-bold"
          style={{
            backgroundColor: props.backgroundColor || theme.primaryColor || "#178218",
            color: props.color || "#ffffff",
            borderRadius: `${props.radius || 6}px`,
            padding: props.padding || "13px 20px",
            fontSize: `${props.fontSize || 16}px`
          }}
        >
          {props.text || "Button"}
        </span>
        {actions}
      </div>
    );
  }

  if (["form", "poll", "survey", "rating", "nps", "appointment", "booking", "quiz", "productFeedback", "rsvp"].includes(block.type)) {
    return (
      <div {...dragProps} className={commonClass}>
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-1 text-lg font-bold text-slate-900">{props.title || props.question || "Form"}</h3>
          <p className="mb-3 text-sm text-slate-500">{props.description || "Interactive email component"}</p>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {block.type}
          </div>
          <div
            className="mt-4 rounded-md py-3 text-center text-sm font-bold text-white"
            style={{ backgroundColor: props.backgroundColor || theme.primaryColor || "#178218" }}
          >
            {props.submitText || "Submit"}
          </div>
        </div>
        {actions}
      </div>
    );
  }

  if (block.type === "card") {
    return (
      <div {...dragProps} className={commonClass}>
        <div
          className="rounded-lg border border-slate-200 p-4"
          style={{
            backgroundColor: props.backgroundColor || "#f8fafc",
            borderRadius: `${props.radius || 8}px`,
            padding: props.padding || "18px",
            border: props.border || "1px solid #e5e7eb"
          }}
        >
          <h3 className="mb-2 font-bold text-slate-900">{props.title || "Card title"}</h3>
          <p className="text-sm leading-6" style={{ color: props.textColor || "#64748b" }}>
            {props.text || "Card text"}
          </p>
        </div>
        {actions}
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div {...dragProps} className={commonClass}>
        <div className="h-px w-full" style={{ backgroundColor: props.color || "#e5e7eb" }} />
        {actions}
      </div>
    );
  }

  if (block.type === "spacer") {
    return (
      <div {...dragProps} className={commonClass}>
        <div className="rounded bg-slate-100" style={{ height: `${props.height || 24}px` }} />
        {actions}
      </div>
    );
  }

  if (block.type === "footer") {
    return (
      <div {...dragProps} className={`${commonClass} text-center text-xs text-slate-500`}>
        <span className="underline">Unsubscribe</span>
        {actions}
      </div>
    );
  }

  return (
    <div {...dragProps} className={commonClass}>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="font-bold capitalize text-slate-900">{block.type}</p>
        <p className="mt-1 text-sm text-slate-500">{props.title || props.label || "Content block"}</p>
      </div>
      {actions}
    </div>
  );
};

const ImageCanvasBlock = ({ block, selected, updateBlockProps }) => {
  const props = block.props || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const fileInputId = `image-upload-${block.id}`;
  const isPlaceholder = !props.src || String(props.src).includes("placeholder.com");

  const applyImage = (image) => {
    updateBlockProps(block.id, {
      src: image.src,
      alt: image.alt || props.alt || image.name || "Email image",
      width: image.width || props.width || 600,
      height: image.height || props.height || 320
    });
    setMenuOpen(false);
  };

  const applyDroppedFile = (file) => {
    if (!file || !file.type?.startsWith("image/")) {
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => applyImage({
      src: reader.result,
      alt: file.name.replace(/\.[^.]+$/, "")
    });
    reader.readAsDataURL(file);
    return true;
  };

  const handleImageDrop = (event) => {
    const hasBlockPayload = event.dataTransfer.getData("block/id") ||
      event.dataTransfer.getData("component/type") ||
      event.dataTransfer.getData("saved-block/id") ||
      event.dataTransfer.getData("template/id") ||
      event.dataTransfer.getData("template/predefined-slug");

    if (hasBlockPayload) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsImageDragOver(false);

    if (applyDroppedFile(event.dataTransfer.files?.[0])) {
      return;
    }

    const url = event.dataTransfer.getData("text/uri-list") ||
      event.dataTransfer.getData("text/plain");

    if (url && /^https?:\/\//i.test(url.trim())) {
      applyImage({ src: url.trim(), alt: props.alt || "Dropped image" });
    }
  };

  const handleUrl = () => {
    const url = window.prompt("Paste image URL", props.src || "");
    if (url) {
      applyImage({ src: url, alt: props.alt || "Email image" });
    }
  };

  const handleUpload = (event) => {
    applyDroppedFile(event.target.files?.[0]);
  };

  const imageActions = [
    ["Upload Image", () => document.getElementById(fileInputId)?.click()],
    ["Add from Gallery", () => applyImage(defaultImageGallery[0])],
    ["Image from URL", handleUrl],
    ["Get Stock Images", () => applyImage(defaultImageGallery[1])]
  ];

  return (
    <div
      onDragOver={(event) => {
        const hasFiles = event.dataTransfer.types?.includes("Files") ||
          event.dataTransfer.types?.includes("text/uri-list") ||
          event.dataTransfer.types?.includes("text/plain");

        if (hasFiles) {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "copy";
          setIsImageDragOver(true);
        }
      }}
      onDragLeave={(event) => {
        event.stopPropagation();
        setIsImageDragOver(false);
      }}
      onDrop={handleImageDrop}
      className={`relative flex min-h-52 items-center justify-center border border-dashed p-5 transition ${
        isImageDragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-400 bg-slate-50"
      }`}
    >
      <input id={fileInputId} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

      {!isPlaceholder ? (
        <img src={props.src} alt={props.alt || ""} className="block h-auto max-h-80 w-full object-contain" />
      ) : (
        <div className="text-center text-slate-400">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-xs font-bold">IMG</div>
          <p className="text-sm font-semibold">{isImageDragOver ? "Drop image here" : "Image goes here"}</p>
          <p className="mt-1 text-xs">Drag an image file or URL here</p>
        </div>
      )}

      {selected && (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 translate-y-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((value) => !value);
            }}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold text-white shadow-lg hover:bg-indigo-700"
          >
            Add image v
          </button>

          {menuOpen && (
            <div onClick={(event) => event.stopPropagation()} className="mt-2 w-56 rounded-md border border-slate-200 bg-white py-1 text-sm shadow-xl">
              {imageActions.map(([label, action]) => (
                <button key={label} type="button" onClick={action} className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CanvasActions = ({ type, removeBlock }) => (
  <div className="absolute right-1 top-1 hidden items-center gap-1 group-hover:flex">
    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
      {type}
    </span>
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        removeBlock();
      }}
      className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
    >
      Delete
    </button>
  </div>
);

export default EmailCanvas;
