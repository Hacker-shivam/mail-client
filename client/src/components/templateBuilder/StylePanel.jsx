import React, { useState } from "react";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

const ThemeEditor = ({ theme, updateTheme }) => {
  const [device, setDevice] = useState("desktop");
  const fontOptions = [
    "Arial, sans-serif",
    "Verdana, sans-serif",
    "Helvetica, Arial, sans-serif",
    "Georgia, serif",
    "Tahoma, sans-serif",
    "Trebuchet MS, sans-serif"
  ];
  const fontLabel = String(theme.fontFamily || "Arial, sans-serif").split(",")[0];

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200">
        {["desktop", "mobile"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setDevice(item)}
            className={`mr-8 border-b-2 px-0 py-3 text-lg font-semibold capitalize ${
              device === item
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {device === "mobile" ? (
        <MobileStylePanel theme={theme} updateTheme={updateTheme} />
      ) : (
        <DesktopStylePanel
          theme={theme}
          updateTheme={updateTheme}
          fontOptions={fontOptions}
          fontLabel={fontLabel}
        />
      )}
    </div>
  );
};

const DesktopStylePanel = ({ theme, updateTheme, fontOptions, fontLabel }) => (
  <>
    <StyleAccordion title="Font" defaultOpen>
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Family</span>
        <div className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-white">
          <span className="border-r border-slate-200 px-3 text-lg font-black text-slate-300">A</span>
          <select
            value={theme.fontFamily || "Arial, sans-serif"}
            onChange={(event) => updateTheme("fontFamily", event.target.value)}
            className="min-w-0 flex-1 px-3 py-3 text-base font-semibold text-slate-900 outline-none"
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>
                {font.split(",")[0]}
              </option>
            ))}
          </select>
          <span className="mr-2 rounded bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">
            Email safe
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">Current: {fontLabel}</p>
      </label>
    </StyleAccordion>

    <StyleAccordion title="Color">
      <div className="grid gap-3">
        <SwatchField label="Page background" value={theme.backgroundColor || "#f8fafc"} onChange={(event) => updateTheme("backgroundColor", event.target.value)} />
        <SwatchField label="Email body" value={theme.contentColor || "#ffffff"} onChange={(event) => updateTheme("contentColor", event.target.value)} />
        <SwatchField label="Primary / Accent" value={theme.primaryColor || "#178218"} onChange={(event) => updateTheme("primaryColor", event.target.value)} />
        <SwatchField label="Text" value={theme.textColor || "#111827"} onChange={(event) => updateTheme("textColor", event.target.value)} />
        <SwatchField label="Muted text" value={theme.mutedColor || "#64748b"} onChange={(event) => updateTheme("mutedColor", event.target.value)} />
      </div>
    </StyleAccordion>

    <StyleAccordion title="Shell Background Image">
      <div className="grid gap-3">
        <InputField label="Shell image URL" value={theme.backgroundImageUrl || ""} onChange={(event) => updateTheme("backgroundImageUrl", event.target.value)} placeholder="https://example.com/background.jpg" />
        <InputField label="Overlay" value={theme.backgroundOverlayColor || ""} onChange={(event) => updateTheme("backgroundOverlayColor", event.target.value)} placeholder="rgba(0,0,0,0.25)" />
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Size</span>
            <select value={theme.backgroundImageSize || "cover"} onChange={(event) => updateTheme("backgroundImageSize", event.target.value)} className={inputClass}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="auto">Original</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Position</span>
            <select value={theme.backgroundImagePosition || "center"} onChange={(event) => updateTheme("backgroundImagePosition", event.target.value)} className={inputClass}>
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Repeat</span>
            <select value={theme.backgroundImageRepeat || "no-repeat"} onChange={(event) => updateTheme("backgroundImageRepeat", event.target.value)} className={inputClass}>
              <option value="no-repeat">No repeat</option>
              <option value="repeat">Repeat</option>
              <option value="repeat-x">Repeat X</option>
              <option value="repeat-y">Repeat Y</option>
            </select>
          </label>
        </div>
      </div>
    </StyleAccordion>

    <StyleAccordion title="Text">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Body size" type="number" value={theme.bodyFontSize || 16} onChange={(event) => updateTheme("bodyFontSize", Number(event.target.value))} />
        <InputField label="Heading size" type="number" value={theme.headingFontSize || 28} onChange={(event) => updateTheme("headingFontSize", Number(event.target.value))} />
        <InputField label="Line height" value={theme.lineHeight || "1.45"} onChange={(event) => updateTheme("lineHeight", event.target.value)} />
        <InputField label="Weight" value={theme.fontWeight || "400"} onChange={(event) => updateTheme("fontWeight", event.target.value)} />
      </div>
    </StyleAccordion>

    <StyleAccordion title="Button">
      <ButtonStylePicker theme={theme} updateTheme={updateTheme} />
    </StyleAccordion>

    <StyleAccordion title="Border">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Body radius" type="number" value={theme.radius || 0} onChange={(event) => updateTheme("radius", Number(event.target.value))} />
        <InputField label="Border width" type="number" value={theme.borderWidth || 0} onChange={(event) => updateTheme("borderWidth", Number(event.target.value))} />
      </div>
      <div className="mt-3">
        <SwatchField label="Border color" value={theme.borderColor || "#e2e8f0"} onChange={(event) => updateTheme("borderColor", event.target.value)} />
      </div>
    </StyleAccordion>

    <StyleAccordion title="Padding & Dimension">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Body width" type="number" value={theme.width || 600} onChange={(event) => updateTheme("width", Number(event.target.value))} />
        <InputField label="Image width" type="number" value={theme.desktopImageWidth || theme.bannerWidth || 240} onChange={(event) => {
          const value = Number(event.target.value);
          updateTheme("desktopImageWidth", value);
          updateTheme("bannerWidth", value);
          updateTheme("imageWidth", value);
        }} />
        <InputField label="Padding" value={theme.padding || "24px"} onChange={(event) => updateTheme("padding", event.target.value)} />
      </div>
    </StyleAccordion>
  </>
);

const MobileStylePanel = ({ theme, updateTheme }) => (
  <div className="space-y-4">
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700">
      Setup default text formatting for mobile view.
    </div>

    <StyleAccordion title="Text" defaultOpen>
      <div className="grid gap-4">
        <StepperField label="Paragraph" value={theme.mobileParagraphFontSize || theme.bodyFontSize || 16} onChange={(value) => updateTheme("mobileParagraphFontSize", value)} />
        <StepperField label="Heading 1" value={theme.mobileHeading1FontSize || 28} onChange={(value) => updateTheme("mobileHeading1FontSize", value)} />
        <StepperField label="Heading 2" value={theme.mobileHeading2FontSize || 24} onChange={(value) => updateTheme("mobileHeading2FontSize", value)} />
        <StepperField label="Heading 3" value={theme.mobileHeading3FontSize || 20} onChange={(value) => updateTheme("mobileHeading3FontSize", value)} />
        <StepperField label="Heading 4" value={theme.mobileHeading4FontSize || 18} onChange={(value) => updateTheme("mobileHeading4FontSize", value)} />
      </div>
    </StyleAccordion>

    <StyleAccordion title="Padding & Dimension">
      <div className="grid gap-3">
        <InputField label="Mobile width" type="number" value={theme.mobileWidth || 390} onChange={(event) => updateTheme("mobileWidth", Number(event.target.value))} />
        <InputField label="Mobile padding" value={theme.mobilePadding || theme.padding || "20px"} onChange={(event) => updateTheme("mobilePadding", event.target.value)} />
      </div>
    </StyleAccordion>
  </div>
);

const StyleAccordion = ({ title, defaultOpen = false, children }) => (
  <details open={defaultOpen} className="border-b border-slate-200 py-4">
    <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-black text-slate-800 [&::-webkit-details-marker]:hidden">
      {title}
      <span className="text-xl text-slate-900">v</span>
    </summary>
    <div className="mt-4">{children}</div>
  </details>
);

const ButtonStylePicker = ({ theme, updateTheme }) => {
  const presets = [
    {
      id: "primary",
      label: "Primary",
      backgroundColor: theme.buttonColor || theme.primaryColor || "#059669",
      color: theme.buttonTextColor || "#ffffff",
      border: "0",
      radius: 999
    },
    {
      id: "secondary",
      label: "Secondary",
      backgroundColor: theme.secondaryButtonColor || "#3217e6",
      color: theme.secondaryButtonTextColor || "#ffffff",
      border: "0",
      radius: 999
    },
    {
      id: "tertiary",
      label: "Tertiary",
      backgroundColor: theme.tertiaryButtonColor || "#ffffff",
      color: theme.tertiaryButtonTextColor || "#047857",
      border: theme.tertiaryButtonBorder || "1px solid #020617",
      radius: 999
    }
  ];

  const applyPreset = (preset) => {
    updateTheme("buttonVariant", preset.id);
    updateTheme("buttonColor", preset.backgroundColor);
    updateTheme("buttonTextColor", preset.color);
    updateTheme("buttonBorder", preset.border);
    updateTheme("buttonRadius", preset.radius);
  };

  return (
    <div className="space-y-4">
      {presets.map((preset) => (
        <div key={preset.id}>
          <p className="mb-2 text-sm font-medium text-slate-600">{preset.label}</p>
          <button
            type="button"
            onClick={() => applyPreset(preset)}
            className={`flex w-full items-center justify-between rounded-sm border bg-slate-50 px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50 ${
              theme.buttonVariant === preset.id ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"
            }`}
          >
            <span
              className="inline-flex items-center rounded-full px-4 py-2 text-xs font-black"
              style={{
                backgroundColor: preset.backgroundColor,
                color: preset.color,
                border: preset.border
              }}
            >
              Button text
            </span>
            <span className="text-lg text-slate-600">&gt;</span>
          </button>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Radius" type="number" value={theme.buttonRadius || 999} onChange={(event) => updateTheme("buttonRadius", Number(event.target.value))} />
        <InputField label="Font size" type="number" value={theme.buttonFontSize || 16} onChange={(event) => updateTheme("buttonFontSize", Number(event.target.value))} />
      </div>
    </div>
  );
};

const InputField = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <input className={inputClass} {...props} />
  </label>
);

const SwatchField = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
    <div className="flex overflow-hidden rounded-md border border-slate-300 bg-white">
      <input type="color" value={value} onChange={onChange} className="h-11 w-14 border-0 bg-transparent p-1" />
      <input value={value} onChange={onChange} className="min-w-0 flex-1 px-3 py-2 text-sm font-semibold text-slate-700 outline-none" />
    </div>
  </label>
);

const StepperField = ({ label, value, onChange }) => {
  const numericValue = Number(value) || 0;
  const setValue = (nextValue) => {
    onChange(Math.max(1, Number(nextValue) || 1));
  };

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="inline-grid grid-cols-[36px_80px_36px] overflow-hidden rounded-sm border border-slate-300 bg-white">
        <button type="button" onClick={() => setValue(numericValue - 1)} className="border-r border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">-</button>
        <input type="number" value={numericValue} onChange={(event) => setValue(event.target.value)} className="w-full px-2 py-2 text-center text-xs font-semibold text-slate-900 outline-none" />
        <button type="button" onClick={() => setValue(numericValue + 1)} className="border-l border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">+</button>
      </div>
    </label>
  );
};

export default ThemeEditor;
