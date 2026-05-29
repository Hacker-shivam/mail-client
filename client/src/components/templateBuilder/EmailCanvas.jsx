import React, { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Image,
  Minus,
  MousePointer2,
  Rows3,
  Space,
  Type,
  X
} from "lucide-react";
import { interpolateVariables } from "../../lib/templateStudio";
import DropZone from "./DropZone";

const imageGallery = [
  {
    name: "Finance desk",
    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    alt: "Finance documents on a desk"
  },
  {
    name: "Team meeting",
    src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    alt: "Team discussing a project"
  },
  {
    name: "Customer growth",
    src: "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&q=80",
    alt: "Business growth dashboard"
  }
];

const viewportWidths = {
  desktop: 760,
  email: 640,
  mobile: 390
};

const EmailCanvas = ({
  sourceJson,
  selectedBlockId,
  setSelectedBlockId,
  handleBuilderDrop,
  reorderBlock,
  updateBlockProps,
  removeBlock
}) => {
  const [zoom, setZoom] = useState(100);
  const [viewport, setViewport] = useState("email");
  const theme = sourceJson.theme || {};
  const blocks = sourceJson.blocks || [];
  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId),
    [blocks, selectedBlockId]
  );
  const canvasWidth = viewport === "email"
    ? Number(theme.width || 600)
    : viewportWidths[viewport];
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleSortEnd = ({ active, over }) => {
    if (!over || active.id === over.id) {
      return;
    }

    const nextIndex = blocks.findIndex((block) => block.id === over.id);

    if (nextIndex >= 0) {
      reorderBlock(active.id, nextIndex);
      setSelectedBlockId(active.id);
    }
  };

  return (
    <section className="min-w-0 bg-[#f4f6f9]">
      <div className="premium-scrollbar min-h-[calc(100vh-97px)] overflow-auto px-4 py-10 sm:px-6">
        <div
          className="mx-auto transition-transform duration-200"
          style={{
            width: `${canvasWidth}px`,
            maxWidth: "100%",
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center"
          }}
        >
          <div
            className="overflow-hidden bg-white shadow-sm"
            style={{
              backgroundColor: theme.backgroundColor || "#f8fafc",
              fontFamily: theme.fontFamily || "Arial, sans-serif"
            }}
          >
            <div
              className="mx-auto min-h-[720px]"
              style={{
                width: "100%",
                maxWidth: `${Number(theme.width || 600)}px`,
                backgroundColor: theme.contentColor || "#ffffff",
                border: `${Number(theme.borderWidth || 0)}px solid ${theme.borderColor || "#e2e8f0"}`,
                borderRadius: `${Number(theme.radius || 0)}px`,
                overflow: "hidden"
              }}
            >
              <div style={{ padding: theme.padding || `${Number(theme.contentPadding || 20)}px` }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortEnd}>
                  <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                    {!blocks.length ? (
                      <EmptyCanvasDropZone handleBuilderDrop={handleBuilderDrop} />
                    ) : (
                      <>
                        <DropZone index={0} handleBuilderDrop={handleBuilderDrop} />
                        {blocks.map((block, index) => (
                          <React.Fragment key={block.id}>
                            <SortableCanvasBlock
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
                      </>
                    )}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CanvasTopBar = ({ blocks, theme, viewport, setViewport, zoom, setZoom }) => (
  <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f766e]">Acolyte Canvas</p>
      <h3 className="mt-1 text-lg font-black text-slate-950">Full Editing Workspace</h3>
      <p className="mt-1 text-sm text-slate-500">
        {blocks.length} blocks, {theme.width || 600}px email width, inline editing enabled.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {["desktop", "email", "mobile"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setViewport(item)}
            className={`rounded-md px-3 py-2 text-xs font-black capitalize transition ${
              viewport === item
                ? "bg-white text-[#0f766e] shadow-sm"
                : "text-slate-500 hover:bg-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <span className="text-xs font-black text-slate-500">Zoom</span>
        <input
          type="range"
          min="60"
          max="130"
          step="5"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-24 accent-[#0f766e]"
        />
        <span className="w-10 text-right text-xs font-black text-slate-700">{zoom}%</span>
      </div>
    </div>
  </div>
);

const EmptyCanvasDropZone = ({ handleBuilderDrop }) => (
  <div
    onDragOver={(event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }}
    onDrop={(event) => handleBuilderDrop(event, 0)}
    className="flex min-h-[660px] flex-col items-center justify-between p-6 text-center"
  >
    <div />
    <div className="w-full">
      <h2 className="text-3xl font-normal text-black">This is a Test mail</h2>
      <p className="mt-24 text-sm text-[#46608a]">This is a blank block, start adding elements in this..</p>
      <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-5 text-sm text-slate-400">
        <QuickInsert icon={Type} label="Title" />
        <QuickInsert icon={Rows3} label="Subtext" />
        <QuickInsert icon={Image} label="Image" />
        <QuickInsert icon={MousePointer2} label="Button" />
        <QuickInsert icon={Space} label="Spacer" />
        <QuickInsert icon={Minus} label="Divider" />
        <QuickInsert icon={MousePointer2} label="Social" />
        <QuickInsert icon={Rows3} label="Element set" wide />
      </div>
    </div>
    <EmailFooterPreview />
  </div>
);

const QuickInsert = ({ icon: Icon, label, wide = false }) => (
  <button
    type="button"
    className={`inline-flex items-center gap-2 font-medium text-slate-400 hover:text-[#6c4cff] ${wide ? "basis-full justify-center" : ""}`}
  >
    <Icon size={17} />
    {label}
  </button>
);

const EmailFooterPreview = () => (
  <div className="w-full pb-2 text-center text-sm text-black">
    <div className="mb-10 flex justify-center gap-9">
      <span className="text-lg font-black text-blue-600">f</span>
      <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-md bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-[11px] font-black text-white">◎</span>
      <X size={18} className="text-black" />
      <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-sm bg-blue-700 text-[11px] font-black text-white">in</span>
    </div>
    <p>© 2020 Your Company Name</p>
    <p className="mt-2">About Us <span className="mx-4">|</span> Terms & Conditions <span className="mx-4">|</span> Privacy Policy</p>
    <p className="mt-2">No.11, 80 Feet Road, 4th Block, S.T Bed, Koramangala, Bangalore - 560034, Karnataka</p>
    <p className="mt-2">This is an auto-generated email. You received this email because you are subscribed to</p>
    <p className="mt-2">Your Company Name. If you don't want to hear from us, click here.</p>
    <p className="mt-8">Need assistance? visit our help center.</p>
  </div>
);

const SelectedStrip = ({ block, updateBlockProps, removeBlock }) => {
  if (!block) {
    return (
      <div className="border-b border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-500">
        Select any block to edit typography, color, layout, images, and content.
      </div>
    );
  }

  return (
    <div className="premium-scrollbar flex gap-2 overflow-x-auto border-b border-slate-200 bg-white/90 px-4 py-3">
      <span className="shrink-0 rounded-md bg-slate-950 px-3 py-2 text-xs font-black uppercase text-white">
        {block.type}
      </span>
      <InlineColor label="Text" value={block.props?.color || block.props?.textColor || "#111827"} onChange={(value) => updateBlockProps(block.id, { color: value, textColor: value })} />
      <InlineColor label="Fill" value={block.props?.backgroundColor || "#ffffff"} onChange={(value) => updateBlockProps(block.id, { backgroundColor: value })} />
      <InlineNumber label="Size" value={block.props?.fontSize || block.props?.titleSize || 16} onChange={(value) => updateBlockProps(block.id, { fontSize: value, titleSize: value })} />
      <div className="flex shrink-0 rounded-md border border-slate-200 bg-slate-50 p-1">
        {["left", "center", "right"].map((align) => (
          <button
            key={align}
            type="button"
            onClick={() => updateBlockProps(block.id, { align })}
            className={`rounded px-2 py-1 text-xs font-black ${
              (block.props?.align || "left") === align ? "bg-white text-[#0f766e] shadow-sm" : "text-slate-500"
            }`}
          >
            {align}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => removeBlock(block.id)}
        className="shrink-0 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100"
      >
        Delete
      </button>
    </div>
  );
};

const InlineColor = ({ label, value, onChange }) => (
  <label className="flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-600">
    {label}
    <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-7 w-8 rounded border border-slate-200 bg-white" />
  </label>
);

const InlineNumber = ({ label, value, onChange }) => (
  <label className="flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-600">
    {label}
    <input
      type="number"
      min="8"
      max="72"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-7 w-16 rounded border border-slate-200 px-2 text-xs"
    />
  </label>
);

const SortableCanvasBlock = ({
  block,
  theme,
  selected,
  onSelect,
  updateBlockProps,
  removeBlock
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  return (
    <CanvasBlock
      block={block}
      theme={theme}
      selected={selected}
      onSelect={onSelect}
      updateBlockProps={updateBlockProps}
      removeBlock={removeBlock}
      dragHandleProps={{ ...attributes, ...listeners }}
      setNodeRef={setNodeRef}
      isDragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    />
  );
};

const CanvasBlock = ({
  block,
  theme,
  selected,
  onSelect,
  updateBlockProps,
  removeBlock,
  dragHandleProps,
  setNodeRef,
  isDragging,
  style
}) => {
  const props = block.props || {};
  const frameClass = selected
    ? "border-[#0f766e] bg-emerald-50/30 shadow-[0_16px_40px_rgba(15,118,110,0.16)]"
    : "border-transparent hover:border-slate-300 hover:bg-slate-50/70";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative rounded-lg border p-2 transition ${frameClass} ${
        isDragging ? "z-30 scale-[0.99] opacity-70 shadow-2xl" : ""
      }`}
    >
      <BlockChrome type={block.type} selected={selected} dragHandleProps={dragHandleProps} removeBlock={() => removeBlock(block.id)} />
      <BlockRenderer block={block} theme={theme} updateBlockProps={updateBlockProps} />
    </div>
  );
};

const BlockChrome = ({ type, selected, dragHandleProps, removeBlock }) => (
  <div className={`absolute -right-2 -top-3 z-20 flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-lg transition ${
    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
  }`}>
    <button
      type="button"
      title="Drag to reorder"
      onClick={(event) => event.stopPropagation()}
      className="cursor-grab rounded bg-slate-950 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white active:cursor-grabbing"
      {...dragHandleProps}
    >
      Move
    </button>
    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{type}</span>
    <button type="button" onClick={(event) => { event.stopPropagation(); removeBlock(); }} className="rounded bg-rose-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
      Delete
    </button>
  </div>
);

const BlockRenderer = ({ block, theme, updateBlockProps }) => {
  const props = block.props || {};

  if (block.type === "heading" || block.type === "text") {
    return <EditableTextBlock block={block} theme={theme} updateBlockProps={updateBlockProps} />;
  }

  if (block.type === "image") {
    return <ImageBlock block={block} updateBlockProps={updateBlockProps} />;
  }

  if (block.type === "button") {
    return <ButtonBlock block={block} theme={theme} updateBlockProps={updateBlockProps} />;
  }

  if (block.type === "card" || block.type === "hero" || block.type === "offer" || block.type === "coupon") {
    return <CardBlock block={block} theme={theme} updateBlockProps={updateBlockProps} />;
  }

  if (["form", "poll", "survey", "rating", "nps", "appointment", "booking", "quiz", "productFeedback", "rsvp"].includes(block.type)) {
    return <FormBlock block={block} theme={theme} updateBlockProps={updateBlockProps} />;
  }

  if (block.type === "shape") {
    return <ShapeBlock block={block} />;
  }

  if (block.type === "divider") {
    return <div className="py-3"><div className="h-px w-full" style={{ backgroundColor: props.color || "#e5e7eb" }} /></div>;
  }

  if (block.type === "spacer") {
    return <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase tracking-wide text-slate-400" style={{ height: `${props.height || 24}px`, lineHeight: `${props.height || 24}px` }}>Spacer</div>;
  }

  if (block.type === "rawHtml") {
    return <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: props.html || "" }} />;
  }

  if (block.type === "footer") {
    return <div className="py-4 text-center text-xs text-slate-500"><span className="underline">Unsubscribe</span></div>;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <EditableField
        value={props.title || props.label || block.type}
        className="text-base font-black text-slate-900"
        style={{
          color: props.titleColor || props.textColor || "#0f172a",
          fontSize: `${props.titleSize || props.fontSize || 16}px`,
          fontWeight: props.titleWeight || 800
        }}
        onCommit={(value) => updateBlockProps(block.id, { title: value, label: value })}
      />
      <EditableField
        value={props.text || props.description || "Edit this custom block from the right panel."}
        className="mt-2 text-sm leading-6 text-slate-500"
        style={{
          color: props.textColor || "#64748b",
          fontSize: `${props.textSize || 14}px`,
          fontWeight: props.textWeight || 400,
          lineHeight: props.lineHeight || 1.5
        }}
        onCommit={(value) => updateBlockProps(block.id, { text: value, description: value })}
      />
    </div>
  );
};

const EditableTextBlock = ({ block, theme, updateBlockProps }) => {
  const props = block.props || {};
  const Tag = block.type === "heading" ? (props.level || "h2") : "p";

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
      style={{
        margin: block.type === "heading" ? "0 0 10px" : "0 0 14px",
        color: props.color || theme.textColor || "#111827",
        textAlign: props.align || "left",
        fontSize: `${props.fontSize || (block.type === "heading" ? theme.headingFontSize || 28 : theme.bodyFontSize || 16)}px`,
        fontWeight: props.fontWeight || (block.type === "heading" ? 800 : theme.fontWeight || 400),
        lineHeight: props.lineHeight || theme.lineHeight || 1.45
      }}
      className="rounded px-1 outline-none focus:bg-white focus:ring-2 focus:ring-[#0f766e]/30"
    >
      {interpolateVariables(props.text || "")}
    </Tag>
  );
};

const EditableField = ({ value, className, style, onCommit }) => (
  <div
    contentEditable
    suppressContentEditableWarning
    onBlur={(event) => onCommit(event.currentTarget.textContent)}
    className={`${className} rounded outline-none focus:bg-white focus:ring-2 focus:ring-[#0f766e]/30`}
    style={style}
  >
    {interpolateVariables(value || "")}
  </div>
);

const ButtonBlock = ({ block, theme, updateBlockProps }) => {
  const props = block.props || {};

  return (
    <div className="py-3" style={{ textAlign: props.align || "center" }}>
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
        className="inline-block font-black outline-none focus:ring-2 focus:ring-[#0f766e]/30"
        style={{
          backgroundColor: props.backgroundColor || theme.primaryColor || "#0f766e",
          color: props.color || "#ffffff",
          borderRadius: `${props.radius || theme.buttonRadius || 8}px`,
          padding: props.padding || theme.buttonPadding || "13px 22px",
          fontSize: `${props.fontSize || theme.buttonFontSize || 16}px`,
          fontWeight: props.fontWeight || 800,
          lineHeight: props.lineHeight || 1.2,
          width: props.width || props.buttonWidth || "auto",
          maxWidth: "100%",
          minHeight: props.height ? `${Number(props.height)}px` : undefined,
          boxSizing: "border-box"
        }}
      >
        {props.text || "Button"}
      </span>
    </div>
  );
};

const CardBlock = ({ block, theme, updateBlockProps }) => {
  const props = block.props || {};

  return (
    <div
      className="border"
      style={{
        backgroundColor: props.backgroundColor || "#f8fafc",
        borderRadius: `${props.radius || 10}px`,
        padding: props.padding || "22px",
        border: props.border || "1px solid #e5e7eb",
        textAlign: props.align || "left"
      }}
    >
      <EditableField
        value={props.title || "Feature card"}
        className="text-xl font-black"
        style={{
          color: props.titleColor || props.textColor || "#0f172a",
          fontSize: `${props.titleSize || 20}px`,
          fontWeight: props.titleWeight || 800
        }}
        onCommit={(value) => updateBlockProps(block.id, { title: value })}
      />
      <EditableField
        value={props.text || "Write a benefit, offer, testimonial, or content section."}
        className="mt-2 text-sm leading-6"
        style={{
          color: props.textColor || "#64748b",
          fontSize: `${props.textSize || 14}px`,
          fontWeight: props.textWeight || 400,
          lineHeight: props.lineHeight || 1.5
        }}
        onCommit={(value) => updateBlockProps(block.id, { text: value })}
      />
      <div className="mt-4 h-1 w-16 rounded-full" style={{ backgroundColor: theme.primaryColor || "#0f766e" }} />
    </div>
  );
};

const FormBlock = ({ block, theme, updateBlockProps }) => {
  const props = block.props || {};
  const fields = props.fields || [];
  const inputBackgroundColor = props.inputBackgroundColor || "#f8fafc";
  const showTitle = props.showTitle !== false;
  const showDescription = props.showDescription !== false;
  const hasHeader = showTitle || (showDescription && props.description);
  const inputTextStyle = {
    color: props.inputTextColor || "#64748b",
    fontSize: `${props.inputFontSize || 14}px`,
    fontWeight: props.inputFontWeight || 600
  };
  const updateFieldLabel = (index, value) => {
    const nextFields = fields.map((field, fieldIndex) => (
      fieldIndex === index ? { ...field, label: value } : field
    ));
    updateBlockProps(block.id, { fields: nextFields });
  };

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: props.formBackgroundColor || "#ffffff",
        borderColor: props.borderColor || "#e2e8f0",
        borderRadius: `${props.radius || 12}px`,
        padding: props.padding || "20px"
      }}
    >
      {showTitle && (
        <EditableField
          value={props.title || props.question || "Interactive form"}
          className="text-lg font-black text-slate-950"
          style={{
            color: props.titleColor || "#020617",
            fontSize: `${props.titleSize || 18}px`,
            fontWeight: props.titleWeight || 800,
            textAlign: props.titleAlign || props.align || "left",
            marginTop: `${Number(props.titleTopGap ?? 0)}px`,
            marginBottom: `${Number(props.titleBottomGap ?? 0)}px`,
            paddingLeft: `${Number(props.titleIndent ?? 0)}px`
          }}
          onCommit={(value) => updateBlockProps(block.id, { title: value, question: value })}
        />
      )}
      {showDescription && (
        <EditableField
          value={props.description || "Collect customer details directly from this campaign."}
          className="mt-1 text-sm leading-6 text-slate-500"
          style={{
            color: props.descriptionColor || props.textColor || "#64748b",
            fontSize: `${props.descriptionSize || props.textSize || 14}px`,
            fontWeight: props.descriptionWeight || props.textWeight || 400,
            lineHeight: props.lineHeight || 1.5,
            textAlign: props.descriptionAlign || props.titleAlign || props.align || "left"
          }}
          onCommit={(value) => updateBlockProps(block.id, { description: value })}
        />
      )}
      <div
        className="grid"
        style={{
          gap: `${Number(props.fieldGap ?? 10)}px`,
          marginTop: hasHeader ? `${Number(props.fieldTopGap ?? 14)}px` : 0
        }}
      >
        {fields.length ? fields.slice(0, 4).map((field, fieldIndex) => (
          <div key={`${field.name || field.label}-${field.label}`} className="grid" style={{ gap: `${Number(props.labelGap ?? 5)}px` }}>
            <div style={{ textAlign: props.inputAlign || "left" }}>
              <EditableField
                value={`${field.label || field.name || "Field"}${field.required ? " *" : ""}`}
                className="text-sm font-semibold"
                style={{
                  display: "inline-block",
                  width: props.inputWidth || "100%",
                  maxWidth: "100%",
                  textAlign: "left",
                  ...inputTextStyle
                }}
                onCommit={(value) => updateFieldLabel(fieldIndex, value.replace(/\s\*$/, ""))}
              />
            </div>
            <div style={{ textAlign: props.inputAlign || "left" }}>
              <div
                className="border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-500"
                style={{
                  display: "inline-block",
                  backgroundColor: inputBackgroundColor,
                  borderRadius: `${Number(props.inputRadius ?? 6)}px`,
                  width: props.inputWidth || "100%",
                  maxWidth: "100%",
                  minHeight: `${Number(props.inputHeight ?? 40)}px`,
                  ...inputTextStyle
                }}
              >
                {field.placeholder || field.name || ""}
              </div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: props.inputAlign || "left" }}>
            <div
              className="border border-dashed border-slate-300 px-3 py-3 text-center text-sm font-semibold text-slate-500"
              style={{
                display: "inline-block",
                backgroundColor: inputBackgroundColor,
                borderRadius: `${Number(props.inputRadius ?? 6)}px`,
                width: props.inputWidth || "100%",
                maxWidth: "100%",
                minHeight: `${Number(props.inputHeight ?? 40)}px`,
                ...inputTextStyle
              }}
            >
              Add form fields from the inspector
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: `${Number(props.buttonTopGap ?? 12)}px`, textAlign: props.buttonAlign || props.align || "left" }}>
        <div
          className="py-3 text-center text-sm font-black text-white"
          style={{
            display: "inline-block",
            backgroundColor: props.buttonColor || props.submitColor || props.backgroundColor || theme.primaryColor || "#0f766e",
            borderRadius: `${props.buttonRadius || 8}px`,
            color: props.buttonTextColor || props.color || "#ffffff",
            fontSize: `${props.buttonFontSize || props.fontSize || 14}px`,
            fontWeight: props.buttonFontWeight || 800,
            lineHeight: props.buttonLineHeight || 1.2,
            width: props.buttonWidth || "100%",
            maxWidth: "100%",
            minHeight: `${Number(props.buttonHeight ?? 44)}px`
          }}
        >
          {props.submitText || "Submit"}
        </div>
      </div>
    </div>
  );
};

const ShapeBlock = ({ block }) => {
  const props = block.props || {};
  const isCircle = props.shape === "circle";
  const radius = isCircle ? 999 : props.shape === "pill" ? 999 : props.radius || 8;

  return (
    <div className="flex justify-center py-4">
      <div
        style={{
          width: `${props.width || 160}px`,
          height: `${props.height || 80}px`,
          borderRadius: `${radius}px`,
          backgroundColor: props.backgroundColor || "#0f766e",
          border: props.border || "none"
        }}
      />
    </div>
  );
};

const ImageBlock = ({ block, updateBlockProps }) => {
  const props = block.props || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const fileInputId = `image-upload-${block.id}`;
  const isPlaceholder = !props.src || String(props.src).includes("placeholder.com");
  const width = Number(props.width || 600);

  const applyImage = (image) => {
    updateBlockProps(block.id, {
      src: image.src,
      alt: image.alt || props.alt || image.name || "Email image",
      width: image.width || props.width || 600,
      height: image.height || props.height || "auto"
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
    event.preventDefault();
    event.stopPropagation();
    setIsImageDragOver(false);

    if (applyDroppedFile(event.dataTransfer.files?.[0])) {
      return;
    }

    const url = event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");

    if (url && /^https?:\/\//i.test(url.trim())) {
      applyImage({ src: url.trim(), alt: props.alt || "Dropped image" });
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsImageDragOver(true);
      }}
      onDragLeave={(event) => {
        event.stopPropagation();
        setIsImageDragOver(false);
      }}
      onDrop={handleImageDrop}
      className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-lg border border-dashed transition ${
        isImageDragOver ? "border-[#0f766e] bg-emerald-50" : "border-slate-300 bg-slate-50"
      }`}
    >
      <input id={fileInputId} type="file" accept="image/*" onChange={(event) => applyDroppedFile(event.target.files?.[0])} className="hidden" />

      {!isPlaceholder ? (
        <img
          src={props.src}
          alt={props.alt || ""}
          className="block h-auto max-h-96 w-full object-contain"
          style={{
            maxWidth: `min(100%, ${width}px)`,
            width: "100%",
            objectFit: props.objectFit || "contain"
          }}
        />
      ) : (
        <div className="px-6 text-center text-slate-400">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-black">IMG</div>
          <p className="text-sm font-black">{isImageDragOver ? "Drop image here" : "Image block"}</p>
          <p className="mt-1 text-xs">Upload, paste URL, or drag media here</p>
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          className="rounded-md bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-lg"
        >
          Image options
        </button>
      </div>

      {menuOpen && (
        <div onClick={(event) => event.stopPropagation()} className="absolute bottom-14 left-1/2 z-30 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-xl">
          <button type="button" onClick={() => document.getElementById(fileInputId)?.click()} className="w-full rounded-md px-3 py-2 text-left font-bold text-slate-700 hover:bg-slate-50">Upload image</button>
          {imageGallery.map((image) => (
            <button key={image.name} type="button" onClick={() => applyImage(image)} className="w-full rounded-md px-3 py-2 text-left font-bold text-slate-700 hover:bg-slate-50">
              {image.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Paste image URL", props.src || "");
              if (url) applyImage({ src: url, alt: props.alt || "Email image" });
            }}
            className="w-full rounded-md px-3 py-2 text-left font-bold text-slate-700 hover:bg-slate-50"
          >
            Paste image URL
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailCanvas;
