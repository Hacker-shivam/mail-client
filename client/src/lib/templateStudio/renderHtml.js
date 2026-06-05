import { DEFAULT_THEME, INTERACTIVE_BLOCK_TYPES } from "./schema";
import { interpolateVariables } from "./variables";
import { apiUrl } from "../../api/Api";

const DEFAULT_FORM_AMP_URL = "https://example.com/amp-form-submit";
const templateAssetUrl = (path) => apiUrl(`/template-assets/${path}`);

const SOCIAL_BRAND_ICONS = {
  facebook: { text: "f", color: "#1877f2", src: templateAssetUrl("social-logos/facebook.svg") },
  instagram: { text: "ig", color: "#e4405f", src: templateAssetUrl("social-logos/instagram.svg") },
  linkedin: { text: "in", color: "#0a66c2", src: templateAssetUrl("social-logos/linkedin.svg") },
  youtube: { text: "yt", color: "#ff0000", src: templateAssetUrl("social-logos/youtube.svg") },
  x: { text: "x", color: "#000000", src: templateAssetUrl("social-logos/x.svg") },
  twitter: { text: "x", color: "#000000", src: templateAssetUrl("social-logos/x.svg") },
  whatsapp: { text: "wa", color: "#25d366", src: templateAssetUrl("social-logos/whatsapp.svg") },
  telegram: { text: "tg", color: "#26a5e4" },
  tiktok: { text: "tt", color: "#000000" },
  threads: { text: "@", color: "#000000" },
  email: { text: "@", color: "#ea4335" },
  website: { text: "www", color: "#4285f4" },
  link: { text: "go", color: "#0f766e" }
};

const LEGACY_SOCIAL_LOGO_URLS = {
  "facebook-logo.svg": SOCIAL_BRAND_ICONS.facebook.src,
  "facebook_dnmevs.svg": SOCIAL_BRAND_ICONS.facebook.src,
  "instagram-logo.svg": SOCIAL_BRAND_ICONS.instagram.src,
  "instagram_tzptb7.svg": SOCIAL_BRAND_ICONS.instagram.src,
  "youtube-logo.svg": SOCIAL_BRAND_ICONS.youtube.src,
  "youtube_w6vzni.svg": SOCIAL_BRAND_ICONS.youtube.src,
  "x-logo.svg": SOCIAL_BRAND_ICONS.x.src,
  "x_urkz34.svg": SOCIAL_BRAND_ICONS.x.src,
  "whatsapp-logo.svg": SOCIAL_BRAND_ICONS.whatsapp.src,
  "whatsapp_gma4kg.svg": SOCIAL_BRAND_ICONS.whatsapp.src
};

const normalizeSocialLogoUrl = (url) => {
  const fileName = String(url || "").split("/").pop();
  return LEGACY_SOCIAL_LOGO_URLS[fileName] || url;
};

const getSocialBrandIcon = (link = {}) => {
  const key = String(link.iconKey || link.label || link.icon || "link").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return SOCIAL_BRAND_ICONS[key] || SOCIAL_BRAND_ICONS.link;
};

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const stripImportant = (value = "") => String(value).replace(/\s*!important\s*/gi, "");

const css = (styles = {}) => Object.entries(styles)
  .filter(([, value]) => value !== undefined && value !== null && value !== "")
  .map(([key, value]) => `${key}:${stripImportant(value)}`)
  .join(";");

const cssUrl = (value = "") => encodeURI(String(value)).replace(/[)"'\\\r\n]/g, "");

const transparentIfEnabled = (enabled, value, fallback) => (
  enabled ? "transparent" : (value || fallback)
);

const formContainerStyles = (props = {}) => ({
  background: transparentIfEnabled(props.formBackgroundTransparent, props.formBackgroundColor, "#ffffff"),
  "background-image": props.backgroundImageUrl
    ? `${props.backgroundOverlayColor ? `linear-gradient(${props.backgroundOverlayColor}, ${props.backgroundOverlayColor}), ` : ""}url(${cssUrl(props.backgroundImageUrl)})`
    : "",
  "background-size": props.backgroundImageUrl ? (props.backgroundImageSize || "cover") : "",
  "background-position": props.backgroundImageUrl ? (props.backgroundImagePosition || "center") : "",
  "background-repeat": props.backgroundImageUrl ? (props.backgroundImageRepeat || "no-repeat") : "",
  border: `${Number(props.borderWidth ?? 1)}px solid ${props.borderColor || "#e2e8f0"}`,
  "border-top": props.topAccentColor ? `${Number(props.topAccentWidth ?? 4)}px solid ${props.topAccentColor}` : "",
  "border-radius": px(props.radius, 12),
  padding: props.padding || "20px",
  "text-align": props.align || "left"
});

const emailBackgroundStyles = (theme = {}) => ({
  background: theme.backgroundColor || "#f8fafc"
});

const emailShellStyles = (theme = {}) => ({
  background: theme.contentColor || "#ffffff",
  "background-image": theme.backgroundImageUrl
    ? `${theme.backgroundOverlayColor ? `linear-gradient(${theme.backgroundOverlayColor}, ${theme.backgroundOverlayColor}), ` : ""}url(${cssUrl(theme.backgroundImageUrl)})`
    : "",
  "background-size": theme.backgroundImageUrl ? (theme.backgroundImageSize || "cover") : "",
  "background-position": theme.backgroundImageUrl ? (theme.backgroundImagePosition || "center") : "",
  "background-repeat": theme.backgroundImageUrl ? (theme.backgroundImageRepeat || "no-repeat") : "",
  "background-color": theme.contentColor || "#ffffff"
});

const formProgressDots = (props = {}, theme = {}) => {
  if (!props.progressDots) {
    return "";
  }

  const active = props.progressColor || theme.primaryColor || "#6c4cff";
  const muted = props.progressMutedColor || "#cbd5e1";
  return `<div style="text-align:center;margin-bottom:16px"><span style="display:inline-block;width:26px;height:8px;border-radius:999px;background:${active};vertical-align:middle"></span><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${muted};margin-left:8px;vertical-align:middle"></span><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${muted};margin-left:8px;vertical-align:middle"></span></div>`;
};

const formDivider = (props = {}) => {
  if (!props.dividerText) {
    return "";
  }

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0"><tr><td style="border-top:1px solid ${props.dividerColor || "#e2e8f0"}"></td><td style="width:1%;white-space:nowrap;padding:0 12px;color:${props.dividerTextColor || props.descriptionColor || props.textColor || "#64748b"};font-size:12px;font-weight:700">${escapeHtml(props.dividerText)}</td><td style="border-top:1px solid ${props.dividerColor || "#e2e8f0"}"></td></tr></table>`;
};

const formTrustBadges = (props = {}, theme = {}) => {
  const badges = Array.isArray(props.trustBadges) ? props.trustBadges : [];

  if (!badges.length) {
    return "";
  }

  const dotColor = props.trustColor || theme.primaryColor || "#0f766e";
  const textColor = props.trustTextColor || props.descriptionColor || "#64748b";
  const content = badges.map((badge) => `<span style="display:inline-block;margin:4px 10px;color:${textColor};font-size:13px;font-weight:700"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${dotColor};margin-right:7px"></span>${escapeHtml(badge)}</span>`).join("");
  return `<div style="text-align:center;margin-top:20px">${content}</div>`;
};

const renderThankYouMessage = (props = {}, theme = {}) => {
  const title = props.thankYouTitle || theme.thankYouTitle || "Thank you";
  const text = props.thankYouText || theme.thankYouText || "Your response was submitted.";

  return `<div style="${css({
    background: props.thankYouBackgroundColor || theme.thankYouBackgroundColor || "#ecfdf5",
    border: `1px solid ${props.thankYouBorderColor || theme.thankYouBorderColor || "#34d399"}`,
    "border-radius": px(props.thankYouRadius || theme.thankYouRadius, 10),
    padding: props.thankYouPadding || theme.thankYouPadding || "16px",
    "text-align": props.thankYouAlign || theme.thankYouAlign || "center",
    margin: props.thankYouMargin || theme.thankYouMargin || "14px 0 0"
  })}">
    <div style="${css({
      color: props.thankYouTitleColor || theme.thankYouTitleColor || "#047857",
      "font-size": fontSize(props.thankYouTitleSize || theme.thankYouTitleSize, 18, 14),
      "font-weight": props.thankYouTitleWeight || theme.thankYouTitleWeight || 800,
      "line-height": 1.3,
      margin: "0"
    })}">${escapeHtml(interpolateVariables(title))}</div>
    <div style="${css({
      color: props.thankYouTextColor || theme.thankYouTextColor || "#064e3b",
      "font-size": fontSize(props.thankYouTextSize || theme.thankYouTextSize, 14, 12),
      "font-weight": props.thankYouTextWeight || theme.thankYouTextWeight || 600,
      "line-height": 1.5,
      margin: "6px 0 0"
    })}">${escapeHtml(interpolateVariables(text))}</div>
  </div>`;
};

const removeMediaFeatureBlocks = (value = "", feature = "prefers-color-scheme") => {
  let output = "";
  let index = 0;
  const lowerValue = String(value).toLowerCase();
  const lowerFeature = feature.toLowerCase();

  while (index < value.length) {
    const mediaIndex = lowerValue.indexOf("@media", index);

    if (mediaIndex === -1) {
      output += value.slice(index);
      break;
    }

    const openIndex = value.indexOf("{", mediaIndex);

    if (openIndex === -1) {
      output += value.slice(index);
      break;
    }

    const mediaHeader = lowerValue.slice(mediaIndex, openIndex);

    if (!mediaHeader.includes(lowerFeature)) {
      output += value.slice(index, openIndex + 1);
      index = openIndex + 1;
      continue;
    }

    output += value.slice(index, mediaIndex);
    let depth = 1;
    let cursor = openIndex + 1;

    while (cursor < value.length && depth > 0) {
      if (value[cursor] === "{") {
        depth += 1;
      } else if (value[cursor] === "}") {
        depth -= 1;
      }

      cursor += 1;
    }

    index = cursor;
  }

  return output;
};

const sanitizeAmpCss = (value = "") => removeMediaFeatureBlocks(String(value), "prefers-color-scheme")
  .replace(/\s*!important\s*/gi, "");

const sanitizeAmpHtml = (value = "") => String(value)
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/\s+target=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  .replace(/\s*!important\s*/gi, "");

const sanitizeAmpDocument = (value = "") => String(value)
  .replace(/<html\b[^>]*>/i, '<html ⚡4email data-css-strict>')
  .replace(/(<style\s+amp-custom\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, cssText, close) => (
    `${open}${sanitizeAmpCss(cssText)}${close}`
  ))
  .replace(/\s+target=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  .replace(/action-xhr=(["'])\s*\{\{\s*formAmpUrl\s*\}\}\s*\1/gi, `action-xhr="${DEFAULT_FORM_AMP_URL}"`)
  .replace(/action-xhr=(["'])(?!https:\/\/)(.*?)\1/gi, `action-xhr="${DEFAULT_FORM_AMP_URL}"`)
  .replace(/\s*!important\s*/gi, "");

const ampActionXhr = (value) => {
  const action = String(value || "").trim();
  return /^https:\/\//i.test(action) ? action : DEFAULT_FORM_AMP_URL;
};

const px = (value, fallback) => `${Number(value || fallback)}px`;

const spacingPx = (value, fallback) => `${Number(value ?? fallback)}px`;

const sizeValue = (value, fallback = "100%") => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "number") {
    return `${value}px`;
  }

  const stringValue = String(value).trim();
  return /^\d+$/.test(stringValue) ? `${stringValue}px` : stringValue;
};

const fontSize = (value, fallback, min = 12) => {
  const size = Number(value || fallback);
  const vw = Math.min(Math.max(size / 6, 3.2), 10);
  return `clamp(${min}px, ${vw}vw, ${size}px)`;
};

const boxPadding = (props = {}, fallback = "0") => {
  const top = props.paddingTop;
  const right = props.paddingRight;
  const bottom = props.paddingBottom;
  const left = props.paddingLeft;
  const hasSidePadding = [top, right, bottom, left].some((value) => value !== undefined && value !== "");

  if (hasSidePadding) {
    return `${Number(top ?? 0)}px ${Number(right ?? 0)}px ${Number(bottom ?? 0)}px ${Number(left ?? 0)}px`;
  }

  return props.padding || fallback;
};

const boxMargin = (props = {}, fallback = "0") => {
  const top = props.marginTop;
  const right = props.marginRight;
  const bottom = props.marginBottom;
  const left = props.marginLeft;
  const hasSideMargin = [top, right, bottom, left].some((value) => value !== undefined && value !== "");

  if (hasSideMargin) {
    return `${Number(top ?? 0)}px ${Number(right ?? 0)}px ${Number(bottom ?? 0)}px ${Number(left ?? 0)}px`;
  }

  return props.margin || fallback;
};

const responsiveCss = (width) => `
      body { width:100%; min-width:100%; }
      table { border-collapse:collapse; }
      img { border:0; outline:none; text-decoration:none; }
      .studio-outer { width:100%; }
      .studio-canvas { width:100%; max-width:${Number(width || 600)}px; }
      .email-shell { width:${Number(width || 600)}px; max-width:100%; margin:0 auto; }
      .studio-block-cell { box-sizing:border-box; }
      .studio-fluid-image { max-width:100%; height:auto; }
      .studio-image-wrap { max-width:100%; box-sizing:border-box; }
      .email-image-frame { width:100%; max-width:100%; margin:0 auto; box-sizing:border-box; }
      .email-image { width:100%; max-width:100%; height:auto; }
      .studio-responsive-button { max-width:100%; box-sizing:border-box; overflow-wrap:anywhere; }
      .studio-responsive-form { box-sizing:border-box; max-width:100%; }
      .studio-responsive-shape { max-width:100%; box-sizing:border-box; }
      .studio-text { overflow-wrap:anywhere; word-break:break-word; }
      .studio-fields { margin-top:14px; }
      .studio-field { display:block; margin:0 0 10px; }
      .studio-field-label { display:block; margin-bottom:5px; }
      .studio-choice-group { margin:0 0 10px; }
      .studio-choice-option { display:block; margin:5px 0; }
      .studio-form-button { margin-top:12px; }
      @media only screen and (max-width: 480px) {
        .studio-page-pad { padding:0; }
        .studio-canvas { width:100%; max-width:100%; }
        .email-shell,
        .email-image-frame { width:100% !important; max-width:100% !important; }
        .email-image { max-width:100% !important; height:auto !important; }
        .studio-block-cell { padding:0; }
        .studio-title { font-size:clamp(18px, 6.5vw, 28px); line-height:1.25; }
        .studio-body { font-size:clamp(13px, 4vw, 16px); line-height:1.5; }
        .studio-description { font-size:clamp(12px, 3.8vw, 15px); }
        .studio-responsive-button { display:block; width:100%; text-align:center; }
        .studio-responsive-form { padding:14px; border-radius:10px; }
        .studio-fields { margin-top:10px; }
        .studio-field { margin-bottom:8px; }
        .studio-field-label { margin-bottom:4px; }
        .studio-choice-group { margin-bottom:8px; }
        .studio-choice-option { margin:4px 0; }
        .studio-form-button { margin-top:9px; }
        .studio-input { font-size:14px; padding:10px; }
        .studio-image-wrap { width:100%; }
      }
    `;

const textStyle = (props = {}, theme = {}, scope = "body") => {
  if (scope === "title") {
    return css({
      color: props.titleColor || props.textColor || theme.textColor || "#0f172a",
      "font-size": fontSize(props.titleSize || props.fontSize || theme.headingFontSize, 20, 16),
      "font-weight": props.titleWeight || props.fontWeight || 800,
      "line-height": props.titleLineHeight || props.lineHeight || 1.3,
      margin: "0"
    });
  }

  if (scope === "description") {
    return css({
      color: props.descriptionColor || props.textColor || theme.mutedColor || "#64748b",
      "font-size": fontSize(props.descriptionSize || props.textSize || theme.bodyFontSize, 14, 12),
      "font-weight": props.descriptionWeight || props.textWeight || 400,
      "line-height": props.lineHeight || 1.5,
      margin: "6px 0 0"
    });
  }

  if (scope === "input") {
    return css({
      color: props.inputLabelColor || props.inputTextColor || theme.mutedColor || "#64748b",
      "font-size": fontSize(props.inputFontSize, 14, 12),
      "font-weight": props.inputFontWeight || 600
    });
  }

  return css({
    color: props.color || props.textColor || theme.mutedColor || "#64748b",
    "font-size": fontSize(props.textSize || props.fontSize || theme.bodyFontSize, 14, 12),
    "font-weight": props.textWeight || props.fontWeight || theme.fontWeight || 400,
    "line-height": props.lineHeight || theme.lineHeight || 1.5,
    margin: "0"
  });
};

const renderFields = (props = {}, fields = []) => {
  const fieldStyle = css({
    background: transparentIfEnabled(props.inputBackgroundTransparent, props.inputBackgroundColor, "#f8fafc"),
    border: `${Number(props.inputBorderWidth ?? 1)}px solid ${props.inputBorderColor || "#e2e8f0"}`,
    "border-radius": px(props.inputRadius, 6),
    padding: "10px 12px",
    "box-sizing": "border-box",
    width: sizeValue(props.inputWidth, "100%"),
    "max-width": "100%",
    "min-height": sizeValue(props.inputHeight, "40px"),
    color: props.inputValueColor || props.inputTextColor || "#64748b",
    "font-size": fontSize(props.inputFontSize, 14, 12),
    "font-weight": props.inputFontWeight || 600,
    "overflow-wrap": "anywhere"
  });

  if (!fields.length) {
    return `<div class="studio-input" style="${fieldStyle};text-align:center;border-style:dashed">Add form fields from the editor</div>`;
  }

  return fields.map((field) => {
    const label = escapeHtml(field.label || field.question || field.name || "Field");
    const helper = field.helperText
      ? `<div style="margin-top:7px;color:${props.helperTextColor || props.descriptionColor || props.textColor || "#64748b"};font-size:13px;font-weight:600">${escapeHtml(field.helperText)}</div>`
      : "";
    return `
      <label class="studio-field" style="margin-bottom:${spacingPx(props.fieldGap, 10)}">
        <div style="text-align:${props.inputAlign || "left"}"><span class="studio-input studio-field-label" style="${textStyle(props, {}, "input")};display:inline-block;width:${sizeValue(props.inputWidth, "100%")};max-width:100%;text-align:left;margin-bottom:${spacingPx(props.labelGap, 5)}">${label}${field.required ? " *" : ""}</span></div>
        <div style="text-align:${props.inputAlign || "left"}"><div class="studio-input" style="${fieldStyle};display:inline-block;text-align:left">${escapeHtml(field.placeholder || "")}</div>${helper}</div>
      </label>
    `;
  }).join("");
};

const renderRealFormFields = (props = {}, fields = [], amp = false) => {
  const inputStyle = css({
    background: transparentIfEnabled(props.inputBackgroundTransparent, props.inputBackgroundColor, "#f8fafc"),
    border: `${Number(props.inputBorderWidth ?? 1)}px solid ${props.inputBorderColor || "#e2e8f0"}`,
    "border-radius": px(props.inputRadius, 6),
    padding: "10px 12px",
    "box-sizing": "border-box",
    width: sizeValue(props.inputWidth, "100%"),
    "max-width": "100%",
    "min-height": sizeValue(props.inputHeight, "40px"),
    color: props.inputValueColor || props.inputTextColor || "#64748b",
    "font-size": fontSize(props.inputFontSize, 14, 12),
    "font-weight": props.inputFontWeight || 600
  });

  const items = fields.length ? fields : [
    { label: "Email", name: "email", type: "email", required: true }
  ];

  return items.map((field, index) => {
    const type = ["textarea", "select", "radio", "checkbox"].includes(field.type) ? field.type : (field.type || "text");
    const name = escapeHtml(field.name || `field_${index + 1}`);
    const label = escapeHtml(field.label || field.question || field.name || `Field ${index + 1}`);
    const required = field.required ? " required" : "";
    const placeholder = escapeHtml(field.placeholder || "");

    if (type === "textarea") {
      const helper = field.helperText ? `<div style="margin-top:7px;color:${props.helperTextColor || props.descriptionColor || props.textColor || "#64748b"};font-size:13px;font-weight:600">${escapeHtml(field.helperText)}</div>` : "";
      return `<label class="studio-field" style="margin-bottom:${spacingPx(props.fieldGap, 10)}"><div style="text-align:${props.inputAlign || "left"}"><span class="studio-input studio-field-label" style="${textStyle(props, {}, "input")};display:inline-block;width:${sizeValue(props.inputWidth, "100%")};max-width:100%;text-align:left;margin-bottom:${spacingPx(props.labelGap, 5)}">${label}${field.required ? " *" : ""}</span></div><div style="text-align:${props.inputAlign || "left"}"><textarea name="${name}"${required} placeholder="${placeholder}" rows="4" style="${inputStyle};display:inline-block;text-align:left"></textarea>${helper}</div></label>`;
    }

    if (type === "select") {
      const options = (field.options || []).map((option) => {
        const optionLabel = typeof option === "string" ? option : (option.label || option.value || "");
        const optionValue = typeof option === "string" ? option : (option.value || option.label || "");
        return `<option value="${escapeHtml(optionValue)}">${escapeHtml(optionLabel)}</option>`;
      }).join("");
      const helper = field.helperText ? `<div style="margin-top:7px;color:${props.helperTextColor || props.descriptionColor || props.textColor || "#64748b"};font-size:13px;font-weight:600">${escapeHtml(field.helperText)}</div>` : "";
      return `<label class="studio-field" style="margin-bottom:${spacingPx(props.fieldGap, 10)}"><div style="text-align:${props.inputAlign || "left"}"><span class="studio-input studio-field-label" style="${textStyle(props, {}, "input")};display:inline-block;width:${sizeValue(props.inputWidth, "100%")};max-width:100%;text-align:left;margin-bottom:${spacingPx(props.labelGap, 5)}">${label}${field.required ? " *" : ""}</span></div><div style="text-align:${props.inputAlign || "left"}"><select name="${name}"${required} style="${inputStyle};display:inline-block;text-align:left">${options}</select>${helper}</div></label>`;
    }

    if (type === "radio" || type === "checkbox") {
      const options = (field.options?.length ? field.options : [{ label, value: "yes" }]).map((option) => {
        const optionLabel = typeof option === "string" ? option : (option.label || option.value || "");
        const optionValue = typeof option === "string" ? option : (option.value || option.label || "");
        return `<label class="studio-choice-option" style="${textStyle(props, {}, "input")}"><input type="${type}" name="${name}" value="${escapeHtml(optionValue)}"${required} /> ${escapeHtml(optionLabel)}</label>`;
      }).join("");
      return `<div class="studio-choice-group" style="margin-bottom:${spacingPx(props.fieldGap, 10)}"><div style="text-align:${props.inputAlign || "left"}"><div class="studio-input studio-field-label" style="${textStyle(props, {}, "input")};display:inline-block;width:${sizeValue(props.inputWidth, "100%")};max-width:100%;text-align:left;margin-bottom:${spacingPx(props.labelGap, 5)}">${label}${field.required ? " *" : ""}</div></div>${options}</div>`;
    }

    const helper = field.helperText ? `<div style="margin-top:7px;color:${props.helperTextColor || props.descriptionColor || props.textColor || "#64748b"};font-size:13px;font-weight:600">${escapeHtml(field.helperText)}</div>` : "";
    return `<label class="studio-field" style="margin-bottom:${spacingPx(props.fieldGap, 10)}"><div style="text-align:${props.inputAlign || "left"}"><span class="studio-input studio-field-label" style="${textStyle(props, {}, "input")};display:inline-block;width:${sizeValue(props.inputWidth, "100%")};max-width:100%;text-align:left;margin-bottom:${spacingPx(props.labelGap, 5)}">${label}${field.required ? " *" : ""}</span></div><div style="text-align:${props.inputAlign || "left"}"><input type="${escapeHtml(type)}" name="${name}"${required} placeholder="${placeholder}" style="${inputStyle};display:inline-block;text-align:left" />${helper}</div></label>`;
  }).join("");
};

const renderFormLikeBlock = (block, theme) => {
  const props = block.props || {};
  const fields = props.fields || props.questions || [];
  const title = props.title || props.question || "Interactive form";
  const description = props.description || "Collect customer details directly from this campaign.";
  const showTitle = props.showTitle !== false;
  const showDescription = props.showDescription !== false && Boolean(description);
  const fieldTopGap = showTitle || showDescription ? spacingPx(props.fieldTopGap, 14) : "0";
  const buttonStyle = css({
    background: transparentIfEnabled(props.buttonBackgroundTransparent, props.buttonColor || props.submitColor || props.backgroundColor, theme.buttonColor || theme.primaryColor || "#0f766e"),
    color: props.buttonTextColor || props.color || theme.buttonTextColor || "#ffffff",
    "font-size": fontSize(props.buttonFontSize || props.fontSize || theme.buttonFontSize, 14, 13),
    "font-weight": props.buttonFontWeight || 800,
    "line-height": props.buttonLineHeight || 1.2,
    "border-radius": px(props.buttonRadius || theme.buttonRadius, 8),
    padding: props.buttonPadding || theme.buttonPadding || "13px 18px",
    width: sizeValue(props.buttonWidth, "100%"),
    "max-width": "100%",
    "min-height": sizeValue(props.buttonHeight, "44px"),
    border: `${Number(props.buttonBorderWidth ?? 0)}px solid ${props.buttonBorderColor || "transparent"}`,
    display: "inline-block",
    "text-align": "center",
    "box-sizing": "border-box",
    "overflow-wrap": "anywhere"
  });

  return `
    <div class="studio-responsive-form" style="${css(formContainerStyles(props))}">
      ${formProgressDots(props, theme)}
      ${showTitle ? `<div class="studio-text studio-title" style="${textStyle(props, theme, "title")};text-align:${props.titleAlign || props.align || "left"};margin-top:${spacingPx(props.titleTopGap, 0)};margin-bottom:${spacingPx(props.titleBottomGap, 0)};padding-left:${spacingPx(props.titleIndent, 0)}">${escapeHtml(interpolateVariables(title))}</div>` : ""}
      ${showDescription ? `<div class="studio-text studio-description" style="${textStyle(props, theme, "description")};text-align:${props.descriptionAlign || props.titleAlign || props.align || "left"}">${escapeHtml(interpolateVariables(description))}</div>` : ""}
      <div class="studio-fields" style="margin-top:${fieldTopGap}">${renderFields(props, fields)}</div>
      ${formDivider(props)}
      <div style="text-align:${props.buttonAlign || props.align || "left"}"><div class="studio-responsive-button studio-form-button" style="${buttonStyle};margin-top:${spacingPx(props.buttonTopGap, 12)}">${escapeHtml(props.submitText || props.buttonText || "Submit")}</div></div>
      ${formTrustBadges(props, theme)}
    </div>
  `;
};

const renderAmpFormBlock = (block, theme) => {
  const props = block.props || {};
  const fields = props.fields || props.questions || [];
  const title = props.title || props.question || "Interactive form";
  const description = props.description || "Collect customer details directly from this campaign.";
  const showTitle = props.showTitle !== false;
  const showDescription = props.showDescription !== false && Boolean(description);
  const fieldTopGap = showTitle || showDescription ? spacingPx(props.fieldTopGap, 14) : "0";
  const buttonStyle = css({
    background: transparentIfEnabled(props.buttonBackgroundTransparent, props.buttonColor || props.submitColor || props.backgroundColor, theme.buttonColor || theme.primaryColor || "#0f766e"),
    color: props.buttonTextColor || props.color || theme.buttonTextColor || "#ffffff",
    "font-size": fontSize(props.buttonFontSize || props.fontSize || theme.buttonFontSize, 14, 13),
    "font-weight": props.buttonFontWeight || 800,
    "border-radius": px(props.buttonRadius || theme.buttonRadius, 8),
    padding: props.buttonPadding || theme.buttonPadding || "13px 18px",
    border: `${Number(props.buttonBorderWidth ?? 0)}px solid ${props.buttonBorderColor || "transparent"}`,
    width: sizeValue(props.buttonWidth, "100%"),
    "max-width": "100%",
    "min-height": sizeValue(props.buttonHeight, "44px"),
    display: "inline-block",
    cursor: "pointer"
  });

  return `
    <form class="studio-responsive-form" method="post" action-xhr="${escapeHtml(ampActionXhr(props.actionXhr || theme.formAmpUrl))}" style="${css(formContainerStyles(props))}">
      ${formProgressDots(props, theme)}
      ${showTitle ? `<div class="studio-text studio-title" style="${textStyle(props, theme, "title")};text-align:${props.titleAlign || props.align || "left"};margin-top:${spacingPx(props.titleTopGap, 0)};margin-bottom:${spacingPx(props.titleBottomGap, 0)};padding-left:${spacingPx(props.titleIndent, 0)}">${escapeHtml(interpolateVariables(title))}</div>` : ""}
      ${showDescription ? `<div class="studio-text studio-description" style="${textStyle(props, theme, "description")};text-align:${props.descriptionAlign || props.titleAlign || props.align || "left"}">${escapeHtml(interpolateVariables(description))}</div>` : ""}
      <div class="studio-fields" style="margin-top:${fieldTopGap}">${renderRealFormFields(props, fields, true)}</div>
      ${formDivider(props)}
      <div style="text-align:${props.buttonAlign || props.align || "left"}"><button type="submit" class="studio-responsive-button studio-form-button" style="${buttonStyle};margin-top:${spacingPx(props.buttonTopGap, 12)}">${escapeHtml(props.submitText || props.buttonText || "Submit")}</button></div>
      ${formTrustBadges(props, theme)}
      <div submit-success><template type="amp-mustache">${renderThankYouMessage(props, theme)}</template></div>
      <div submit-error><template type="amp-mustache">Something went wrong. Please try again.</template></div>
    </form>
  `;
};

const renderHtmlEmailFormBlock = (block, theme) => {
  const props = block.props || {};
  return `
    <div style="text-align:${props.align || "center"};padding:12px 0">
      <a class="studio-responsive-button" href="${escapeHtml(props.href || "{{formHtmlUrl}}")}" style="${css({
        display: "inline-block",
        background: props.buttonColor || props.submitColor || props.backgroundColor || theme.buttonColor || theme.primaryColor || "#0f766e",
        color: props.buttonTextColor || props.color || theme.buttonTextColor || "#ffffff",
        "font-size": fontSize(props.buttonFontSize || props.fontSize || theme.buttonFontSize, 14, 13),
        "font-weight": props.buttonFontWeight || 800,
        "border-radius": px(props.buttonRadius || theme.buttonRadius, 8),
        padding: props.buttonPadding || theme.buttonPadding || "13px 18px",
        width: sizeValue(props.buttonWidth, ""),
        "max-width": "100%",
        "min-height": sizeValue(props.buttonHeight, ""),
        "text-decoration": "none",
        "box-sizing": "border-box"
      })}">${escapeHtml(props.submitText || "Open form")}</a>
    </div>
  `;
};

const renderBlock = (block, theme, mode = "html") => {
  const props = block.props || {};
  const type = block.type;

  if (type === "heading" || type === "text") {
    const tag = type === "heading" ? (props.level || "h2") : "p";
    return `<${tag} style="${css({
      color: props.color || theme.textColor || "#111827",
      "font-size": fontSize(props.fontSize || (type === "heading" ? theme.headingFontSize : theme.bodyFontSize), type === "heading" ? 28 : 16, type === "heading" ? 16 : 12),
      "font-weight": props.fontWeight || (type === "heading" ? 800 : theme.fontWeight || 400),
      "line-height": props.lineHeight || theme.lineHeight || 1.45,
      "text-align": props.align || "left",
      padding: boxPadding(props, "0"),
      margin: type === "heading" ? "0 0 10px" : "0 0 14px"
    })}" class="studio-text ${type === "heading" ? "studio-title" : "studio-body"}">${escapeHtml(interpolateVariables(props.text || ""))}</${tag}>`;
  }

  if (type === "button") {
    return `<div style="text-align:${props.align || "center"};padding:12px 0"><a class="studio-responsive-button" href="${escapeHtml(props.href || props.url || "{{formHtmlUrl}}")}" style="${css({
      display: "inline-block",
      background: props.buttonColor || props.submitColor || props.backgroundColor || theme.buttonColor || theme.primaryColor || "#0f766e",
      color: props.buttonTextColor || props.color || theme.buttonTextColor || "#ffffff",
      "font-size": fontSize(props.buttonFontSize || props.fontSize || theme.buttonFontSize, 16, 13),
      "font-weight": props.buttonFontWeight || props.fontWeight || 800,
      "line-height": props.lineHeight || 1.2,
      "border-radius": px(props.buttonRadius || props.radius || theme.buttonRadius, 8),
      padding: props.buttonPadding || props.padding || theme.buttonPadding || "13px 22px",
      width: sizeValue(props.width || props.buttonWidth, ""),
      "max-width": "100%",
      "min-height": sizeValue(props.height || props.buttonHeight, ""),
      "text-decoration": "none",
      "box-sizing": "border-box",
      "overflow-wrap": "anywhere"
    })}">${escapeHtml(props.text || "Button")}</a></div>`;
  }

  if (type === "image") {
    const imageWidth = props.width || props.bannerWidth || props.imageWidth || theme.desktopImageWidth || theme.bannerWidth || theme.imageWidth || 240;
    const imageHeight = props.height || props.bannerHeight || props.imageHeight;

    return `<div style="${css({
      "text-align": props.align || "center",
      padding: props.padding ?? theme.imagePadding ?? "0",
      "box-sizing": "border-box"
    })}">
      <span class="studio-image-wrap email-image-frame" style="${css({
        display: "block",
        width: "100%",
        "max-width": px(imageWidth, 240),
        margin: "0 auto"
      })}">
        <img class="studio-fluid-image email-image" src="${escapeHtml(props.src || "")}" alt="${escapeHtml(props.alt || "")}" width="${Number(imageWidth || 240)}"${imageHeight ? ` height="${Number(imageHeight)}"` : ""} style="${css({
      width: "100%",
      height: imageHeight && imageHeight !== "auto" && !props.responsiveHeight ? px(imageHeight, 120) : "auto",
      "max-width": px(imageWidth, 240),
      "border-radius": px(props.radius, 0),
      display: "block",
      "object-fit": props.objectFit || "contain"
    })}" />
      </span>
    </div>`;
  }

  if (type === "social") {
    const links = Array.isArray(props.links) ? props.links : [];
    const visibleLinks = links.filter((link) => link?.label || link?.href);
    const title = props.title
      ? `<div class="studio-text studio-title" style="${css({
        color: props.titleColor || props.textColor || theme.textColor || "#0f172a",
        "font-size": fontSize(props.titleSize, 16, 13),
        "font-weight": props.titleWeight || 800,
        "line-height": 1.3,
        "text-align": props.align || "center",
        margin: `0 0 ${spacingPx(props.titleGap, 12)}`
      })}">${escapeHtml(interpolateVariables(props.title))}</div>`
      : "";

    const layout = props.layout || "icons";
    const itemStyle = (brand, link = {}) => css({
      display: "inline-block",
      background: layout === "text"
        ? "transparent"
        : (link.backgroundColor || link.iconBackgroundColor || (
          props.useBrandColors === false
            ? (props.iconBackgroundColor || props.backgroundColor || theme.primaryColor || "#0f172a")
            : brand.color
        )),
      color: layout === "text" ? (props.textColor || theme.primaryColor || "#0f766e") : (props.iconColor || "#ffffff"),
      "border-radius": layout === "text" ? "0" : px(props.radius, 999),
      padding: layout === "text" ? "0" : (props.itemPadding || "9px 13px"),
      "font-size": fontSize(props.fontSize, 13, 11),
      "font-weight": props.fontWeight || 800,
      "line-height": 1.2,
      "text-decoration": layout === "text" ? "underline" : "none",
      "box-sizing": "border-box",
      "min-width": layout === "icons" ? sizeValue(props.iconSize, "38px") : "",
      "text-align": "center"
    });

    return `<div style="${css({
      background: props.backgroundColor || "transparent",
      padding: props.padding || "18px",
      "text-align": props.align || "center"
    })}">
      ${title}
      <div>
        ${visibleLinks.map((link, index) => {
          const brand = getSocialBrandIcon(link);
          const label = escapeHtml(link.label || link.icon || "Link");
          const iconSize = sizeValue(props.iconSize, "18px");
          const iconDimension = Number.parseInt(iconSize, 10) || 18;
          const iconText = escapeHtml(link.icon || brand.text || label.slice(0, 2).toLowerCase());
          const logoSrc = normalizeSocialLogoUrl(link.iconUrl || link.logoUrl || brand.src);
          const iconBadge = `<span aria-hidden="true" style="${css({
            display: "inline-block",
            width: iconSize,
            height: iconSize,
            "min-width": iconSize,
            "border-radius": "999px",
            background: layout === "text" ? (brand.color || props.textColor || theme.primaryColor || "#0f766e") : "transparent",
            color: layout === "text" ? "#ffffff" : "inherit",
            "font-size": fontSize(props.iconTextSize, 11, 9),
            "font-weight": 900,
            "line-height": iconSize,
            "text-align": "center",
            "vertical-align": "middle",
            "font-family": "Arial, sans-serif",
            "text-transform": "lowercase"
          })}">${logoSrc ? `<img src="${escapeHtml(logoSrc)}" alt="${label}" width="${iconDimension}" height="${iconDimension}" style="${css({
            display: "block",
            width: iconSize,
            height: iconSize,
            border: "0",
            outline: "none",
            "text-decoration": "none",
            "vertical-align": "middle"
          })}" />` : iconText}</span>`;
          const text = layout === "icons" ? iconBadge : `${iconBadge}<span style="vertical-align:middle;margin-left:6px">${label}</span>`;
          return `<a href="${escapeHtml(link.href || "#")}" aria-label="${label}" style="${itemStyle(brand, link)};margin:${index === 0 ? "0" : `0 0 0 ${spacingPx(props.gap, 10)}`}">${text}</a>`;
        }).join("")}
      </div>
    </div>`;
  }

  if (type === "card" || type === "hero" || type === "offer" || type === "coupon") {
    return `<div style="${css({
      background: props.backgroundColor || "#f8fafc",
      border: props.border || "1px solid #e5e7eb",
      "border-radius": px(props.radius, 10),
      padding: props.padding || "22px",
      "text-align": props.align || "left"
    })}">
      <div class="studio-text studio-title" style="${textStyle(props, theme, "title")}">${escapeHtml(interpolateVariables(props.title || "Feature card"))}</div>
      <div class="studio-text studio-body" style="${textStyle(props, theme)};margin-top:8px">${escapeHtml(interpolateVariables(props.text || ""))}</div>
    </div>`;
  }

  if (INTERACTIVE_BLOCK_TYPES.has(type) || ["productList", "conditionalGroup"].includes(type)) {
    if (mode === "amp") {
      return renderAmpFormBlock(block, theme);
    }

    if (mode === "html-email") {
      return renderHtmlEmailFormBlock(block, theme);
    }

    return renderFormLikeBlock(block, theme);
  }

  if (type === "footer") {
    const address = props.address
      ? `<div style="margin-top:6px">${escapeHtml(interpolateVariables(props.address))}</div>`
      : "";
    const copyright = props.copyright
      ? `<div>${escapeHtml(interpolateVariables(props.copyright))}</div>`
      : "";
    const unsubscribeText = escapeHtml(props.unsubscribeText || "Unsubscribe");
    const unsubscribe = props.unsubscribe === false
      ? ""
      : `<div style="margin-top:${copyright || address ? "8px" : "0"}"><a href="${escapeHtml(props.unsubscribeUrl || "{{unsubscribeUrl}}")}" style="color:${props.linkColor || props.color || theme.primaryColor || "#0f766e"};text-decoration:underline">${unsubscribeText}</a></div>`;
    const helpText = props.helpText
      ? `<div style="margin-top:10px">${escapeHtml(interpolateVariables(props.helpText))}</div>`
      : "";

    if (!copyright && !address && !unsubscribe && !helpText) {
      return "";
    }

    return `<div style="${css({
      "text-align": props.align || "center",
      color: props.color || theme.mutedColor || "#64748b",
      "font-size": fontSize(props.fontSize, 12, 11),
      "font-weight": props.fontWeight || 400,
      "line-height": props.lineHeight || 1.6,
      padding: props.padding || "18px 8px"
    })}">
      ${copyright}
      ${address}
      ${unsubscribe}
      ${helpText}
    </div>`;
  }

  if (type === "divider") {
    return `<div style="height:1px;background:${props.color || "#e5e7eb"};margin:${boxMargin(props, "12px 0")}"></div>`;
  }

  if (type === "spacer") {
    return `<div style="height:${px(props.height, 24)};line-height:${px(props.height, 24)}"></div>`;
  }

  if (type === "rawHtml") {
    return mode === "amp" ? sanitizeAmpHtml(props.html || "") : (props.html || "");
  }

  if (type === "shape") {
    return `<div style="text-align:${props.align || "center"};padding:12px 0"><span class="studio-responsive-shape" style="${css({
      display: "inline-block",
      width: px(props.width, 160),
      height: px(props.height, 80),
      background: props.shape === "line" ? "transparent" : (props.backgroundColor || theme.primaryColor || "#0f766e"),
      border: props.shape === "line"
        ? `${props.lineWidth || 2}px ${props.lineStyle || "solid"} ${props.backgroundColor || theme.primaryColor || "#0f766e"}`
        : (props.border || "0"),
      "border-radius": props.shape === "circle" || props.shape === "pill" ? "999px" : px(props.radius, 8)
    })}"></span></div>`;
  }

  return `<div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px">
    <div class="studio-text studio-title" style="${textStyle(props, theme, "title")}">${escapeHtml(interpolateVariables(props.title || props.label || type))}</div>
    <div class="studio-text studio-body" style="${textStyle(props, theme)};margin-top:8px">${escapeHtml(interpolateVariables(props.text || props.description || ""))}</div>
  </div>`;
};

export const renderStudioDocument = (sourceJson = {}) => {
  const theme = {
    ...DEFAULT_THEME,
    ...(sourceJson.theme || {})
  };
  const blocks = sourceJson.blocks || [];
  const outerBackgroundStyle = css(emailBackgroundStyles(theme));
  const shellBackgroundStyle = css(emailShellStyles(theme));
  const content = blocks.map((block) => `
    <tr>
      <td class="studio-block-cell" style="padding:${theme.blockPadding ?? "0"}">
        ${renderBlock(block, theme, "html-email")}
      </td>
    </tr>
  `).join("");
  const ampContent = blocks.map((block) => `
    <tr>
      <td class="studio-block-cell" style="padding:${theme.blockPadding ?? "0"}">
        ${renderBlock(block, theme, "amp")}
      </td>
    </tr>
  `).join("");
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(sourceJson.subject || sourceJson.name || "Template preview")}</title>
    <style>
${responsiveCss(theme.width)}
    </style>
  </head>
  <body style="margin:0;padding:0;${outerBackgroundStyle};font-family:${theme.fontFamily};color:${theme.textColor}">
    <table class="studio-outer" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="${outerBackgroundStyle};width:100%">
      <tr>
        <td class="studio-page-pad" align="center" style="padding:${theme.pagePadding ?? "0"}">
          <table class="studio-canvas email-shell" role="presentation" width="${Number(theme.width || 600)}" cellspacing="0" cellpadding="0" style="width:${Number(theme.width || 600)}px;max-width:100%;margin:0 auto;${shellBackgroundStyle};border:${Number(theme.borderWidth || 0)}px solid ${theme.borderColor || "#e2e8f0"};border-radius:${Number(theme.radius || 0)}px">
            ${content || `<tr><td style="padding:80px 20px;text-align:center;color:${theme.mutedColor}">Blank template</td></tr>`}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const amp = sanitizeAmpDocument(`<!doctype html>
<html ⚡4email data-css-strict>
  <head>
    <meta charset="utf-8" />
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
    <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
    <style amp4email-boilerplate>body{visibility:hidden}</style>
    <style amp-custom>
${sanitizeAmpCss(responsiveCss(theme.width))}
    </style>
  </head>
  <body style="margin:0;padding:0;${outerBackgroundStyle};font-family:${theme.fontFamily};color:${theme.textColor}">
    <table class="studio-outer" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="${outerBackgroundStyle};width:100%">
      <tr>
        <td class="studio-page-pad" align="center" style="padding:${theme.pagePadding ?? "0"}">
          <table class="studio-canvas email-shell" role="presentation" width="${Number(theme.width || 600)}" cellspacing="0" cellpadding="0" style="width:${Number(theme.width || 600)}px;max-width:100%;margin:0 auto;${shellBackgroundStyle};border:${Number(theme.borderWidth || 0)}px solid ${theme.borderColor || "#e2e8f0"};border-radius:${Number(theme.radius || 0)}px">
            ${ampContent || `<tr><td style="padding:80px 20px;text-align:center;color:${theme.mutedColor}">Blank template</td></tr>`}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`);

  const formHtml = `<!doctype html>
<html ⚡>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="canonical" href="{{directFormHtmlUrl}}" />
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
    <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
    <style amp-custom>
${sanitizeAmpCss(responsiveCss(theme.width))}
      body { font-family:${theme.fontFamily}; ${outerBackgroundStyle}; padding:16px; color:${theme.textColor}; box-sizing:border-box; }
      .studio-web-form-shell { max-width:${Number(theme.width || 600)}px; margin:0 auto; }
    </style>
  </head>
  <body>
    <main class="studio-web-form-shell">
      ${blocks.filter((block) => INTERACTIVE_BLOCK_TYPES.has(block.type)).map((block) => renderAmpFormBlock(block, theme)).join("") || "<p>No form components added.</p>"}
    </main>
  </body>
</html>`;

  return {
    html,
    amp,
    formHtml,
    text: blocks.map((block) => block.props?.text || block.props?.title || block.props?.description || "").filter(Boolean).join("\n\n")
  };
};
