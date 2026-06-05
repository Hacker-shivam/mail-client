import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlignJustify,
  ChevronDown,
  Edit3,
  FilePlus2,
  Grid2X2,
  Image,
  Library,
  List,
  ListOrdered,
  Minus,
  Monitor,
  MousePointer2,
  Share2,
  Space,
  Table2,
  Type
} from "lucide-react";
import { apiUrl } from "../api/Api";
import ThemeEditor from "./templateBuilder/StylePanel";
import BuilderRail from "./templateBuilder/BuilderRail";
import EmailCanvas from "./templateBuilder/EmailCanvas";
import DropZone from "./templateBuilder/DropZone";
import JsonEditor from "./templateBuilder/JsonEditor";
import OutputPreview from "./templateBuilder/OutputPreview";
import RawTemplateForm from "./templateBuilder/RawTemplateForm";
import SavedTemplates from "./templateBuilder/SavedTemplates";
import BlockOutline from "./templateBuilder/BlockOutline";
import AdvancedEditorSuite from "./templateBuilder/AdvancedEditorSuite";
import {
  cloneStudioBlock,
  createComponentRegistry,
  duplicateBlockInDocument,
  getDocumentStats,
  insertBlockInDocument,
  insertBlocksInDocument,
  interpolateVariables,
  moveBlockInDocument,
  removeBlockFromDocument,
  renderStudioDocument,
  updateBlockPropsInDocument,
  updateThemeToken,
  validateStudioDocument
} from "../lib/templateStudio";

const initialTemplate = {
  name: "Builder Demo Template",
  slug: "builder-demo",
  subject: "Hi {{email}}, check your eligibility",
  status: "draft"
};

const displayText = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const item = value.find((entry) => entry !== undefined && entry !== null && typeof entry !== "object");
    return item === undefined ? fallback : String(item);
  }

  if (typeof value === "object") {
    if (Array.isArray(value.$ifNull)) {
      return displayText(value.$ifNull, fallback);
    }

    if (value.$literal !== undefined) {
      return displayText(value.$literal, fallback);
    }

    return fallback;
  }

  return fallback;
};

const templateText = (template = {}, key, fallback = "") => displayText(template?.[key], fallback);

const templateIdentifier = (template = {}) => (
  templateText(template, "_id") ||
  templateText(template, "id") ||
  templateText(template, "uuid") ||
  templateText(template, "mongoId") ||
  templateText(template, "slug")
);

const starterSource = {
  version: 1,
  theme: {
    width: 300,
    desktopImageWidth: 240,
    bannerWidth: 240,
    backgroundColor: "#f8fafc",
    contentColor: "#ffffff",
    primaryColor: "#178218",
    textColor: "#111827",
    mutedColor: "#64748b",
    fontFamily: "Arial, sans-serif"
  },
  blocks: [
    {
      id: "heading-1",
      type: "heading",
      props: {
        text: "Check Your Eligibility",
        level: "h1",
        align: "center",
        fontSize: 28
      }
    },
    {
      id: "text-1",
      type: "text",
      props: {
        text: "Hi {{email}}, submit your details and our team will contact you.",
        align: "center",
        color: "#475569"
      }
    },
    {
      id: "form-1",
      type: "form",
      props: {
        title: "Business Details",
        description: "Please submit your company and contact details.",
        submitText: "Apply Now",
        fields: [
          {
            name: "company",
            label: "Company Name",
            type: "text",
            required: true
          },
          {
            name: "mobile",
            label: "Mobile No",
            type: "tel",
            required: true
          }
        ]
      }
    },
    {
      id: "footer-1",
      type: "footer",
      props: {
        unsubscribe: true
      }
    }
  ]
};

const emptyBuilderSource = {
  ...starterSource,
  blocks: []
};

const AUTO_DRAFT_STORAGE_KEY = "template-studio:auto-draft";
const AUTO_DRAFT_MAX_CHARS = 750000;

const isStorageQuotaError = (error) => (
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
);

const compactDraftPayload = (draftPayload) => {
  if (draftPayload.mode === "builder") {
    return {
      mode: "builder",
      template: {
        name: draftPayload.template?.name || "",
        slug: draftPayload.template?.slug || "",
        subject: draftPayload.template?.subject || "",
        status: "draft"
      },
      omittedLargeContent: true
    };
  }

  return {
    mode: "raw",
    rawTemplate: {
      name: draftPayload.rawTemplate?.name || "",
      slug: draftPayload.rawTemplate?.slug || "",
      subject: draftPayload.rawTemplate?.subject || "",
      status: "draft"
    },
    omittedLargeContent: true
  };
};

const getBoxPadding = (props = {}, fallback = "0") => {
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

const getBoxMargin = (props = {}, fallback = "0") => {
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

const templateAssetUrl = (path) => apiUrl(`/template-assets/${path}`);

const socialLogoUrls = {
  facebook: templateAssetUrl("social-logos/facebook.svg"),
  instagram: templateAssetUrl("social-logos/instagram.svg"),
  linkedin: templateAssetUrl("social-logos/linkedin.svg"),
  youtube: templateAssetUrl("social-logos/youtube.svg"),
  x: templateAssetUrl("social-logos/x.svg"),
  twitter: templateAssetUrl("social-logos/x.svg"),
  whatsapp: templateAssetUrl("social-logos/whatsapp.svg")
};

const predefinedTemplates = [
  {
    category: "Lead Generation",
    name: "Startup Loan Lead",
    slug: "startup-loan-lead",
    subject: "Check your business loan eligibility",
    sourceJson: starterSource
  },
  {
    category: "Lead Generation",
    name: "Consultation Booking",
    slug: "consultation-booking",
    subject: "Book your free consultation",
    sourceJson: {
      ...starterSource,
      blocks: [
        {
          id: "hero-consult",
          type: "card",
          props: {
            title: "Book a Free Consultation",
            text: "Tell us what you need and our team will call you back.",
            backgroundColor: "#ecfdf5",
            radius: 8,
            padding: "28px",
            align: "center"
          }
        },
        {
          id: "form-consult",
          type: "form",
          props: {
            title: "Your Details",
            description: "Choose a preferred date and share your contact details.",
            submitText: "Book Now",
            fields: [
              { name: "name", label: "Name", type: "text", required: true },
              { name: "phone", label: "Phone", type: "tel", required: true },
              { name: "date", label: "Preferred Date", type: "date" }
            ]
          }
        },
        { id: "footer-consult", type: "footer", props: { unsubscribe: true } }
      ]
    }
  },
  {
    category: "Offers",
    name: "Coupon Offer",
    slug: "coupon-offer",
    subject: "Your exclusive offer is inside",
    sourceJson: {
      ...starterSource,
      theme: {
        ...starterSource.theme,
        primaryColor: "#4f46e5",
        backgroundColor: "#eef2ff"
      },
      blocks: [
        {
          id: "offer-head",
          type: "heading",
          props: {
            text: "Exclusive Deal for You",
            level: "h1",
            align: "center",
            fontSize: 30
          }
        },
        {
          id: "coupon-card",
          type: "card",
          props: {
            title: "SAVE20",
            text: "Use this code before checkout to claim your offer.",
            backgroundColor: "#ffffff",
            radius: 8,
            padding: "24px",
            align: "center"
          }
        },
        {
          id: "offer-button",
          type: "button",
          props: {
            text: "Claim Offer",
            href: "https://example.com",
            backgroundColor: "#4f46e5"
          }
        },
        { id: "footer-offer", type: "footer", props: { unsubscribe: true } }
      ]
    }
  },
  {
    category: "Feedback",
    name: "Customer Survey",
    slug: "customer-survey",
    subject: "Tell us what you think",
    sourceJson: {
      ...starterSource,
      blocks: [
        {
          id: "survey-title",
          type: "heading",
          props: {
            text: "How was your experience?",
            level: "h1",
            align: "center",
            fontSize: 28
          }
        },
        {
          id: "survey-text",
          type: "text",
          props: {
            text: "Your feedback helps us improve.",
            align: "center",
            color: "#475569"
          }
        },
        {
          id: "survey-form",
          type: "form",
          props: {
            title: "Quick Survey",
            description: "This takes less than a minute.",
            submitText: "Submit Feedback",
            fields: [
              {
                name: "rating",
                label: "Rating",
                type: "radio",
                required: true,
                options: [
                  { label: "1", value: "1" },
                  { label: "2", value: "2" },
                  { label: "3", value: "3" },
                  { label: "4", value: "4" },
                  { label: "5", value: "5" }
                ]
              },
              { name: "comment", label: "Comment", type: "textarea" }
            ]
          }
        },
        { id: "footer-survey", type: "footer", props: { unsubscribe: true } }
      ]
    }
  },
  {
    category: "Events",
    name: "Event Registration",
    slug: "event-registration",
    subject: "Register for our upcoming event",
    sourceJson: {
      ...starterSource,
      blocks: [
        {
          id: "event-hero",
          type: "card",
          props: {
            title: "You're Invited",
            text: "Reserve your seat for our upcoming business growth session.",
            backgroundColor: "#fff7ed",
            radius: 8,
            padding: "28px",
            align: "center"
          }
        },
        {
          id: "event-form",
          type: "form",
          props: {
            title: "Register Now",
            description: "Choose your ticket and submit your details.",
            submitText: "Register",
            fields: [
              { name: "fullName", label: "Full Name", type: "text", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              {
                name: "ticketType",
                label: "Ticket Type",
                type: "select",
                required: true,
                options: [
                  { label: "General", value: "general" },
                  { label: "VIP", value: "vip" }
                ]
              }
            ]
          }
        },
        { id: "footer-event", type: "footer", props: { unsubscribe: true } }
      ]
    }
  },
  {
    category: "Designs",
    name: "Acolyte Living",
    slug: "acolyte-living",
    subject: "Now open for January intake students",
    sourceJson: {
      ...starterSource,
      theme: {
        ...starterSource.theme,
        primaryColor: "#1f2937",
        backgroundColor: "#f8fafc",
        contentColor: "#ffffff",
        textColor: "#0f172a",
        mutedColor: "#475569",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      blocks: [
        {
          id: "acolyte-hero-image",
          type: "image",
          props: {
            src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
            alt: "Acolyte Living Student Accommodation",
            width: 600,
            height: "auto",
            mobileWidth: 320,
            mobileHeight: "auto",
            href: "{{formHtmlUrl}}",
            display: "block",
            maxWidth: "100%",
            style: "display: block; width: 100%; max-width: 600px; height: auto; margin: 0 auto;",
            mobileStyle: "display: block; width: 100%; max-width: 320px; height: auto; margin: 0 auto;"
          }
        },
        {
          id: "acolyte-hero-title",
          type: "heading",
          props: {
            text: "NOW OPEN FOR JANUARY INTAKE STUDENTS",
            level: "h1",
            align: "center",
            fontSize: 30,
            color: "#0f172a"
          }
        },
        {
          id: "acolyte-hero-subtitle",
          type: "text",
          props: {
            text: "Acolyte Living homestays offer award-winning rooms, all bills included, and up to 10% cashback.",
            align: "center",
            color: "#334155",
            fontSize: 16
          }
        },
        {
          id: "acolyte-highlight-card",
          type: "card",
          props: {
            title: "Premium Student Homestay",
            text: "Enjoy safe, insured student accommodation with 90 days post-booking guidance and hassle-free support.",
            backgroundColor: "#ffffff",
            radius: 16,
            padding: "26px",
            textColor: "#334155"
          }
        },
        {
          id: "acolyte-benefits-title",
          type: "heading",
          props: {
            text: "Additional Benefits",
            level: "h2",
            align: "center",
            fontSize: 24,
            color: "#0f172a"
          }
        },
        {
          id: "acolyte-benefits-text",
          type: "text",
          props: {
            text: "Student Safety Insurance up to $50,000 USD + 90 Days Post Booking Guidance.",
            align: "center",
            color: "#475569",
            fontSize: 16
          }
        },
        {
          id: "acolyte-cta-button",
          type: "button",
          props: {
            text: "SELECT",
            href: "{{formHtmlUrl}}",
            backgroundColor: "#047857",
            color: "#ffffff",
            radius: 999,
            padding: "14px 30px",
            fontSize: 16
          }
        },
        {
          id: "acolyte-form",
          type: "form",
          props: {
            title: "Your Homestay",
            description: "Fill in your details below to book your student accommodation.",
            submitText: "SUBMIT",
            backgroundColor: "#0f172a",
            buttonRadius: 999,
            formWidth: "100%",
            formMaxWidth: 600,
            formPadding: "32px",
            inputPadding: "12px 14px",
            inputHeight: "40px",
            inputFontSize: 14,
            inputBorderRadius: 6,
            inputBorderColor: "#cbd5e1",
            inputBackgroundColor: "#ffffff",
            inputTextColor: "#1e293b",
            buttonHeight: "44px",
            buttonPadding: "12px 24px",
            buttonFontSize: 16,
            buttonBorderRadius: 6,
            fields: [
              { name: "name", label: "Name", type: "text", required: true },
              { name: "phone", label: "Phone", type: "tel", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              { name: "university_country", label: "University / Country", type: "text", required: true }
            ]
          }
        },
        {
          id: "acolyte-footer",
          type: "footer",
          props: {
            unsubscribe: true
          }
        }
      ]
    }
  }
];

const createPlaceholderImage = (label, width = 600, height = 320) => {
  const safeLabel = String(label)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f1f5f9"/><rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="8" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="8 8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#64748b">${safeLabel}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const replaceLegacyPlaceholderUrl = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(
    /(?:https?:\/\/via\.placeholder\.com\/)?(\d+)x(\d+)\.png\?text=([^"'\s<)]+)/gi,
    (match, width, height, label) => {
      if (!match.includes("placeholder.com") && match !== value) {
        return match;
      }

      return createPlaceholderImage(
        decodeURIComponent(label).replace(/\+/g, " "),
        Number(width),
        Number(height)
      );
    }
  );
};

const normalizeLegacyPlaceholderImages = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeLegacyPlaceholderImages);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeLegacyPlaceholderImages(entry)])
    );
  }

  return replaceLegacyPlaceholderUrl(value);
};

const THANK_YOU_THEME_FIELDS = [
  "thankYouBackgroundColor",
  "thankYouTitleColor",
  "thankYouTextColor",
  "thankYouBorderColor",
  "thankYouTitle",
  "thankYouText"
];

const pickThankYouThemeFields = (theme = {}) => (
  Object.fromEntries(
    THANK_YOU_THEME_FIELDS
      .filter((key) => theme[key] !== undefined && theme[key] !== "")
      .map((key) => [key, theme[key]])
  )
);

const hydrateThankYouThemeFields = (templateRecord = {}) => ({
  ...(templateRecord.sourceJson || {}),
  theme: {
    ...(templateRecord.sourceJson?.theme || {}),
    ...pickThankYouThemeFields(templateRecord)
  }
});

const templateSaveErrorMessage = (error) => {
  if (!error.response && error.message === "Network Error") {
    return "Template save failed because the API request was blocked or unreachable. In local dev, restart Vite so /api requests use the proxy. If calling localhost:5000 directly, allow PUT in the backend CORS methods.";
  }

  return error.response?.data?.message || "Template save failed";
};

const blockPresets = {
  heading: {
    type: "heading",
    props: {
      text: "New Heading",
      level: "h2",
      align: "left",
      fontSize: 24
    }
  },
  text: {
    type: "text",
    props: {
      text: "Write your message here.",
      align: "left",
      color: "#475569"
    }
  },
  image: {
    type: "image",
    props: {
      src: createPlaceholderImage("Campaign Image", 600, 320),
      alt: "Campaign image",
      width: 240,
      height: 120,
      bannerWidth: 240,
      bannerHeight: 120,
      imageWidth: 240,
      imageHeight: 120,
      href: "{{formHtmlUrl}}"
    }
  },
  button: {
    type: "button",
    props: {
      text: "Open Form",
      href: "{{formHtmlUrl}}",
      backgroundColor: "#178218"
    }
  },
  card: {
    type: "card",
    props: {
      title: "Feature Card",
      text: "Use this block for offers, summaries, benefits, or content groups.",
      backgroundColor: "#f8fafc",
      radius: 8,
      padding: "18px"
    }
  },
  shape: {
    type: "shape",
    props: {
      shape: "rectangle",
      width: 160,
      height: 80,
      radius: 8,
      backgroundColor: "#178218"
    }
  },
  circle: {
    type: "shape",
    props: {
      shape: "circle",
      width: 96,
      height: 96,
      backgroundColor: "#178218"
    }
  },
  pill: {
    type: "shape",
    props: {
      shape: "pill",
      width: 220,
      height: 48,
      backgroundColor: "#178218"
    }
  },
  line: {
    type: "shape",
    props: {
      shape: "line",
      width: 520,
      height: 1,
      lineWidth: 2,
      lineStyle: "solid",
      backgroundColor: "#d1d5db"
    }
  },
  rawHtml: {
    type: "rawHtml",
    props: {
      html: "<p style=\"text-align:center;color:#475569;\">Custom HTML block</p>"
    }
  },
  navbar: {
    type: "navbar",
    props: {
      links: [
        { label: "Home", href: "https://example.com" },
        { label: "Products", href: "https://example.com/products" },
        { label: "Contact", href: "https://example.com/contact" }
      ],
      align: "center",
      color: "#178218"
    }
  },
  logoHeader: {
    type: "logoHeader",
    props: {
      logoUrl: createPlaceholderImage("Logo", 180, 60),
      logoAlt: "Logo",
      logoWidth: 140,
      title: "Brand Header",
      align: "center"
    }
  },
  productCard: {
    type: "productCard",
    props: {
      imageUrl: createPlaceholderImage("Product", 600, 320),
      title: "Product Name",
      text: "Describe your product, offer, or service.",
      price: "$49",
      buttonText: "View Product",
      href: "https://example.com"
    }
  },
  pricingCard: {
    type: "pricingCard",
    props: {
      title: "Pro Plan",
      price: "$29/mo",
      features: ["Feature one", "Feature two", "Feature three"],
      buttonText: "Choose Plan",
      href: "https://example.com"
    }
  },
  testimonial: {
    type: "testimonial",
    props: {
      quote: "This service helped us grow faster.",
      name: "Customer Name",
      role: "Founder",
      backgroundColor: "#f8fafc"
    }
  },
  countdown: {
    type: "countdown",
    props: {
      label: "Offer ends on",
      date: "2026-12-31",
      backgroundColor: "#fef2f2",
      color: "#dc2626"
    }
  },
  rating: {
    type: "form",
    props: {
      title: "Rate your experience",
      submitText: "Submit Rating",
      fields: [
        {
          name: "rating",
          label: "Rating",
          type: "radio",
          required: true,
          options: ["1", "2", "3", "4", "5"].map((value) => ({ label: value, value }))
        }
      ]
    }
  },
  nps: {
    type: "form",
    props: {
      title: "How likely are you to recommend us?",
      submitText: "Submit",
      fields: [
        {
          name: "nps",
          label: "Score",
          type: "radio",
          required: true,
          options: Array.from({ length: 11 }, (_, index) => ({ label: String(index), value: String(index) }))
        }
      ]
    }
  },
  accordion: {
    type: "accordion",
    props: {
      items: [
        { title: "What is included?", text: "Everything you need to get started." },
        { title: "How do I apply?", text: "Submit the form and our team will contact you." }
      ]
    }
  },
  carousel: {
    type: "carousel",
    props: {
      slides: [
        { imageUrl: createPlaceholderImage("Slide 1", 600, 260), title: "First slide" },
        { imageUrl: createPlaceholderImage("Slide 2", 600, 260), title: "Second slide" }
      ]
    }
  },
  form: {
    type: "form",
    props: {
      title: "Lead Form",
      description: "Collect customer details directly from AMP email.",
      submitText: "Submit",
      fields: [
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true
        }
      ]
    }
  },
  acolyteLiving: {
    type: "form",
    props: {
      title: "Your Homestay",
      description: "Fill in your details below to book your student accommodation.",
      submitText: "SUBMIT",
      backgroundColor: "#0f172a",
      buttonRadius: 999,
      formWidth: "100%",
      formMaxWidth: 600,
      formPadding: "32px",
      inputPadding: "12px 14px",
      inputHeight: "40px",
      inputFontSize: 14,
      inputBorderRadius: 6,
      inputBorderColor: "#cbd5e1",
      inputBackgroundColor: "#ffffff",
      inputTextColor: "#1e293b",
      buttonHeight: "44px",
      buttonPadding: "12px 24px",
      buttonFontSize: 16,
      buttonBorderRadius: 6,
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "university_country", label: "University / Country", type: "text", required: true }
      ]
    }
  },
  divider: {
    type: "divider",
    props: {
      color: "#e5e7eb",
      margin: "12px 0"
    }
  },
  spacer: {
    type: "spacer",
    props: {
      height: 24
    }
  },
  hero: {
    type: "card",
    props: {
      title: "Launch Your Campaign",
      text: "Create rich email experiences with forms, buttons, and personalized content.",
      backgroundColor: "#ecfdf5",
      radius: 8,
      padding: "28px",
      align: "center",
      titleSize: 28,
      textSize: 16
    }
  },
  textSection: {
    type: "text",
    props: {
      text: "Write your text here.",
      align: "left",
      fontSize: 16,
      fontWeight: "400",
      lineHeight: "1.5",
      color: "#475569"
    }
  },
  offer: {
    type: "card",
    props: {
      title: "Limited Time Offer",
      text: "Use this section to highlight a benefit, discount, eligibility message, or CTA.",
      backgroundColor: "#fff7ed",
      radius: 8,
      padding: "20px"
    }
  },
  twoColumn: {
    type: "card",
    props: {
      title: "Two Column Layout",
      text: "Use this as a layout placeholder. Add image, text, or button blocks around it.",
      backgroundColor: "#f8fafc",
      radius: 8,
      padding: "18px"
    }
  },
  survey: {
    type: "form",
    props: {
      title: "Quick Survey",
      description: "Collect feedback from your audience.",
      submitText: "Send Feedback",
      fields: [
        {
          name: "rating",
          label: "Rating",
          type: "number",
          required: true
        },
        {
          name: "feedback",
          label: "Feedback",
          type: "textarea"
        }
      ]
    }
  },
  leadForm: {
    type: "form",
    props: {
      title: "Lead Capture",
      description: "Collect customer contact details.",
      submitText: "Submit",
      fields: [
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true
        },
        {
          name: "phone",
          label: "Phone",
          type: "tel",
          required: true
        },
        {
          name: "email",
          label: "Email",
          type: "email"
        }
      ]
    }
  },
  contactForm: {
    type: "form",
    props: {
      title: "Contact Us",
      description: "Let your audience send a quick message.",
      submitText: "Send Message",
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "message", label: "Message", type: "textarea", required: true }
      ]
    }
  },
  registrationForm: {
    type: "form",
    props: {
      title: "Event Registration",
      description: "Capture event signups from email or hosted form.",
      submitText: "Register",
      fields: [
        { name: "fullName", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "ticketType",
          label: "Ticket Type",
          type: "select",
          required: true,
          options: [
            { label: "General", value: "general" },
            { label: "VIP", value: "vip" }
          ]
        }
      ]
    }
  },
  appointmentForm: {
    type: "form",
    props: {
      title: "Book Appointment",
      description: "Let customers request a callback or appointment.",
      submitText: "Book Now",
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        { name: "date", label: "Preferred Date", type: "date" }
      ]
    }
  },
  eligibilityForm: {
    type: "form",
    props: {
      title: "Check your eligibility",
      description: "Takes less than 30 seconds - no commitment required",
      submitText: "Check now",
      formBackgroundColor: "#292b28",
      borderColor: "#9ca3af",
      borderWidth: 1,
      radius: 24,
      padding: "48px 40px 34px",
      topAccentColor: "#21c98b",
      progressDots: true,
      progressColor: "#b84cff",
      progressMutedColor: "#b7c4c8",
      titleColor: "#b84cff",
      titleSize: 28,
      titleWeight: "800",
      titleAlign: "center",
      descriptionColor: "#d8d2bf",
      descriptionSize: 16,
      descriptionWeight: "700",
      descriptionAlign: "center",
      fieldTopGap: 36,
      fieldGap: 22,
      labelGap: 8,
      inputLabelColor: "#d8d2bf",
      inputValueColor: "#8c9497",
      inputBackgroundColor: "transparent",
      inputBackgroundTransparent: true,
      inputBorderColor: "#4b4f4d",
      inputBorderWidth: 1,
      inputRadius: 7,
      inputHeight: 45,
      inputFontSize: 18,
      inputWidth: "100%",
      dividerText: "Instant results",
      dividerColor: "#525654",
      dividerTextColor: "#b8b0a1",
      buttonTopGap: 24,
      buttonAlign: "center",
      buttonWidth: "100%",
      buttonHeight: 44,
      buttonColor: "transparent",
      buttonBackgroundTransparent: true,
      buttonBorderColor: "#626866",
      buttonBorderWidth: 1,
      buttonRadius: 8,
      buttonTextColor: "#ffffff",
      buttonFontSize: 18,
      buttonFontWeight: "800",
      trustBadges: ["256-bit secure", "No spam", "Instant check"],
      trustColor: "#2ad58f",
      trustTextColor: "#b8b0a1",
      fields: [
        {
          name: "companyName",
          label: "Company name",
          type: "text",
          required: true,
          placeholder: "e.g. Acme Corp",
          helperText: "Enter your registered company name"
        },
        {
          name: "mobileNumber",
          label: "Mobile number",
          type: "tel",
          required: true,
          placeholder: "e.g. +91 98765 43210",
          helperText: "We'll send your results via SMS"
        }
      ]
    }
  },
  social: {
    type: "social",
    props: {
      title: "Follow us",
      align: "center",
      layout: "icons",
      padding: "18px",
      gap: 10,
      backgroundColor: "#ffffff",
      iconBackgroundColor: "#0f172a",
      iconColor: "#ffffff",
      textColor: "#0f172a",
      fontSize: 13,
      iconSize: 18,
      radius: 999,
      links: [
        { label: "Facebook", href: "https://facebook.com", icon: "f", iconKey: "facebook", iconUrl: socialLogoUrls.facebook },
        { label: "Instagram", href: "https://instagram.com", icon: "ig", iconKey: "instagram", iconUrl: socialLogoUrls.instagram },
        { label: "X", href: "https://x.com", icon: "x", iconKey: "x", iconUrl: socialLogoUrls.x },
        { label: "YouTube", href: "https://youtube.com", icon: "yt", iconKey: "youtube", iconUrl: socialLogoUrls.youtube },
        { label: "WhatsApp", href: "https://wa.me/", icon: "wa", iconKey: "whatsapp", iconUrl: socialLogoUrls.whatsapp }
      ]
    }
  },
  footer: {
    type: "footer",
    props: {
      unsubscribe: true,
      unsubscribeText: "Unsubscribe",
      unsubscribeUrl: "{{unsubscribeUrl}}"
    }
  },
  coupon: {
    type: "card",
    props: {
      title: "COUPON2026",
      text: "Use this code before checkout.",
      backgroundColor: "#eef2ff",
      radius: 8,
      padding: "20px",
      align: "center"
    }
  }
};

const componentGroups = [
  {
    title: "Style",
    items: ["heading", "text", "button", "divider", "spacer", "logoHeader", "navbar"]
  },
  {
    title: "Layouts",
    items: ["hero", "twoColumn", "card", "social", "footer"]
  },
  {
    title: "Designs",
    items: ["image", "offer", "coupon", "productCard", "pricingCard", "testimonial", "acolyteLiving"]
  },
  {
    title: "Widgets",
    items: ["rawHtml", "countdown", "accordion", "carousel"]
  },
  {
    title: "Forms",
    items: ["form", "eligibilityForm", "leadForm", "contactForm", "registrationForm", "appointmentForm", "survey", "rating", "nps"]
  },
  {
    title: "Shapes",
    items: ["shape", "circle", "pill", "line"]
  }
];

const componentLabels = {
  heading: "Heading",
  text: "Text",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  hero: "Hero",
  twoColumn: "2 Column",
  card: "Card",
  image: "Image",
  offer: "Offer",
  coupon: "Coupon",
  social: "Social",
  footer: "Unsubscribe",
  rawHtml: "HTML",
  form: "Form",
  eligibilityForm: "Eligibility",
  leadForm: "Lead",
  contactForm: "Contact",
  registrationForm: "Register",
  appointmentForm: "Booking",
  survey: "Survey",
  shape: "Box",
  circle: "Circle",
  pill: "Pill",
  line: "Line"
  ,
  navbar: "Navbar",
  logoHeader: "Logo",
  productCard: "Product",
  pricingCard: "Pricing",
  testimonial: "Testimonial",
  countdown: "Countdown",
  rating: "Rating",
  nps: "NPS",
  accordion: "Accordion",
  carousel: "Carousel"
  ,
  acolyteLiving: "Acolyte Living"
};

const componentDescriptions = {
  heading: "Large title",
  text: "Paragraph copy",
  button: "Clickable CTA",
  divider: "Separator",
  spacer: "Vertical gap",
  hero: "Intro panel",
  twoColumn: "Split layout",
  card: "Content box",
  image: "Visual media",
  offer: "Promo panel",
  coupon: "Code block",
  social: "Social links",
  footer: "Unsubscribe link",
  rawHtml: "Custom code",
  form: "Basic fields",
  eligibilityForm: "Eligibility check",
  leadForm: "Lead capture",
  contactForm: "Message form",
  registrationForm: "Signup form",
  appointmentForm: "Booking form",
  survey: "Feedback",
  shape: "Rectangle",
  circle: "Round shape",
  pill: "Capsule",
  line: "Stroke"
  ,
  navbar: "Menu links",
  logoHeader: "Logo header",
  productCard: "Product sale",
  pricingCard: "Plan card",
  testimonial: "Customer quote",
  countdown: "Deadline",
  rating: "Star score",
  nps: "0-10 score",
  accordion: "FAQ items",
  carousel: "Image slides"
  ,
  acolyteLiving: "Accommodation lookup form"
};

const emptyRawTemplate = {
  name: "",
  slug: "",
  subject: "",
  status: "draft",
  html: "",
  amp: "",
  formHtml: "",
  text: "Please view this email in HTML."
};

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

const builderSections = [
  {
    id: "edit",
    label: "Edit",
    hint: "Selected"
  },
  {
    id: "style",
    label: "Style",
    hint: "Theme"
  },
  {
    id: "layouts",
    label: "Layouts",
    hint: "Blocks"
  },
  {
    id: "designs",
    label: "Designs",
    hint: "Gallery"
  },
  {
    id: "widgets",
    label: "Widgets",
    hint: "Smart"
  },
  {
    id: "forms",
    label: "Forms",
    hint: "AMP"
  },
  {
    id: "saved",
    label: "Saved",
    hint: "Library"
  }
];

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
  },
  {
    name: "Online shopping",
    src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
    alt: "Online shopping payment"
  },
  {
    name: "Event seats",
    src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    alt: "Conference event seating"
  },
  {
    name: "Customer support",
    src: "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&q=80",
    alt: "Customer support workspace"
  },
  {
    name: "Product display",
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    alt: "Product on a clean background"
  }
];

const cloneBlock = cloneStudioBlock;

const replaceSampleValues = (html = "") => {
  return interpolateVariables(html);
};

const socialIconOptions = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X / Twitter" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "tiktok", label: "TikTok" },
  { value: "threads", label: "Threads" },
  { value: "email", label: "Email" },
  { value: "website", label: "Website" },
  { value: "link", label: "Generic Link" }
];

const TemplateForm = () => {
  const [templateWorkspace, setTemplateWorkspace] = useState("gallery");
  const [mode, setMode] = useState("builder");
  const [template, setTemplate] = useState(initialTemplate);
  const [rawTemplate, setRawTemplate] = useState(emptyRawTemplate);
  const [sourceJson, setSourceJson] = useState(emptyBuilderSource);
  const [jsonText, setJsonText] = useState(JSON.stringify(emptyBuilderSource, null, 2));
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [preview, setPreview] = useState({
    html: "",
    amp: "",
    formHtml: ""
  });
  const [previewTab, setPreviewTab] = useState("html");
  const [workspaceTab, setWorkspaceTab] = useState("canvas");
  const [canvasPreviewMode, setCanvasPreviewMode] = useState("design");
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [fullPreviewMode, setFullPreviewMode] = useState("html");
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [templateStatusMenu, setTemplateStatusMenu] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveIntent, setSaveIntent] = useState("published");
  const [previewViewport, setPreviewViewport] = useState("desktop");
  const [sideBySidePreview, setSideBySidePreview] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState("");
  const [versions, setVersions] = useState([]);
  const [catalogBlocks, setCatalogBlocks] = useState([]);
  const [savedBlocks, setSavedBlocks] = useState([]);
  const [editorConfig, setEditorConfig] = useState(null);
  const [builderSection, setBuilderSection] = useState("style");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewValidation, setPreviewValidation] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [clipboardBlock, setClipboardBlock] = useState(null);

  const selectedBlock = useMemo(() => {
    return sourceJson.blocks?.find((block) => block.id === selectedBlockId);
  }, [selectedBlockId, sourceJson.blocks]);

  const templateStatusGroups = useMemo(() => ({
    draft: templates.filter((item) => (item.status || "draft") === "draft"),
    published: templates.filter((item) => item.status === "published")
  }), [templates]);

  const componentRegistry = useMemo(() => {
    const registry = createComponentRegistry({
      presets: blockPresets,
      groups: componentGroups,
      labels: componentLabels,
      descriptions: componentDescriptions
    });

    registry.extend(catalogBlocks);
    return registry;
  }, [catalogBlocks]);

  const dynamicBlockPresets = useMemo(() => {
    return Object.fromEntries(
      componentRegistry.listTypes().map((type) => [type, componentRegistry.get(type)])
    );
  }, [componentRegistry]);

  const dynamicComponentGroups = useMemo(() => {
    if (!catalogBlocks.length) {
      return componentGroups;
    }

    const groups = catalogBlocks.reduce((items, item) => {
      const category = item.category || "custom";
      return {
        ...items,
        [category]: [
          ...(items[category] || []),
          item.type
        ]
      };
    }, {});

    return Object.entries(groups).map(([title, items]) => ({
      title,
      items
    }));
  }, [catalogBlocks]);

  const dynamicComponentLabels = useMemo(() => ({
    ...componentLabels,
    ...Object.fromEntries(
      componentRegistry.listTypes().map((type) => [type, componentRegistry.getLabel(type)])
    )
  }), [componentRegistry]);

  const liveCanvasPreview = useMemo(() => renderStudioDocument({
    ...sourceJson,
    name: template.name,
    subject: template.subject
  }), [sourceJson, template.name, template.subject]);
  const liveCanvasMarkup = liveCanvasPreview?.[canvasPreviewMode] || liveCanvasPreview.html || "";
  const renderedLiveCanvasMarkup = replaceSampleValues(liveCanvasMarkup);
  const previewMarkup = preview?.[previewTab] || "";
  const renderedPreviewMarkup = replaceSampleValues(previewMarkup);
  const localValidation = useMemo(() => validateStudioDocument(sourceJson), [sourceJson]);
  const templateStats = useMemo(() => {
    const remoteStats = getDocumentStats(sourceJson, previewValidation);

    return {
      ...remoteStats,
      localErrors: localValidation.errors.length,
      localWarnings: localValidation.warnings.length
    };
  }, [sourceJson, previewValidation, localValidation]);
  const cleanSourceJsonForSave = (document) => ({
    ...document,
    blocks: (document.blocks || []).map((block) => {
      if (!block?.props) {
        return block;
      }

      const props = { ...block.props };

      if (props.showDescription === false) {
        delete props.description;
      }

      return {
        ...block,
        props
      };
    })
  });
  const builderPayload = (statusOverride = "") => {
    const payloadSourceJson = cleanSourceJsonForSave({
      ...sourceJson,
      name: template.name,
      subject: template.subject
    });
    const rendered = renderStudioDocument(payloadSourceJson);

    return {
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      status: statusOverride || template.status || "draft",
      html: rendered.html,
      amp: rendered.amp,
      formHtml: rendered.formHtml,
      text: rendered.text,
      sourceJson: payloadSourceJson
    };
  };
  const rawPayload = (statusOverride = "") => ({
    ...rawTemplate,
    status: statusOverride || rawTemplate.status || "draft"
  });

  const saveDraftSnapshot = () => {
    const draftPayload = mode === "builder"
      ? {
          mode: "builder",
          template: {
            ...template,
            status: "draft"
          },
          sourceJson: builderPayload().sourceJson
        }
      : {
          mode: "raw",
          rawTemplate: {
            ...rawTemplate,
            status: "draft"
          }
        };

    const savedAt = new Date();
    const snapshot = {
      ...draftPayload,
      savedAt: savedAt.toISOString()
    };
    const serializedSnapshot = JSON.stringify(snapshot);

    try {
      if (serializedSnapshot.length > AUTO_DRAFT_MAX_CHARS) {
        throw new DOMException("Auto-draft is too large for local storage.", "QuotaExceededError");
      }

      localStorage.setItem(AUTO_DRAFT_STORAGE_KEY, serializedSnapshot);
    } catch (error) {
      if (!isStorageQuotaError(error)) {
        throw error;
      }

      try {
        localStorage.setItem(AUTO_DRAFT_STORAGE_KEY, JSON.stringify({
          ...compactDraftPayload(draftPayload),
          savedAt: savedAt.toISOString()
        }));
      } catch (fallbackError) {
        if (!isStorageQuotaError(fallbackError)) {
          throw fallbackError;
        }

        localStorage.removeItem(AUTO_DRAFT_STORAGE_KEY);
        console.warn("Template auto-draft skipped because browser storage is full.");
      }
    }

    setDraftSavedAt(savedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }));
  };

  const openSaveDialog = (status = "published") => {
    setSaveIntent(status);
    if (mode === "builder") {
      setTemplate((current) => ({
        ...current,
        status
      }));
    } else {
      setRawTemplate((current) => ({
        ...current,
        status
      }));
    }
    setSaveDialogOpen(true);
  };

  const saveDraftNow = () => {
    saveDraftSnapshot();
    openSaveDialog("draft");
  };

  const fetchTemplates = async () => {
    try {
      setListLoading(true);
      setListError("");
      const response = await axios.get(apiUrl("/api/templates"), {
        timeout: 15000
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Template fetch failed";
      console.log("Template fetch failed:", {
        status: error.response?.status,
        message,
        response: error.response?.data,
        error
      });
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const fetchBuilderResources = async () => {
    try {
      const [catalogResponse, configResponse, savedBlocksResponse] = await Promise.all([
        axios.get(apiUrl("/api/templates/builder/catalog")),
        axios.get(apiUrl("/api/templates/builder/config")),
        axios.get(apiUrl("/api/templates/builder/blocks"))
      ]);

      setCatalogBlocks(catalogResponse.data.blocks || []);
      setEditorConfig(configResponse.data.config || null);
      setSavedBlocks(savedBlocksResponse.data.savedBlocks || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchVersions = async (templateId) => {
    if (!templateId) {
      setVersions([]);
      return;
    }

    try {
      const response = await axios.get(apiUrl(`/api/templates/${encodeURIComponent(templateId)}/versions`));
      setVersions(response.data.versions || []);
    } catch (error) {
      console.log(error);
      setVersions([]);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchBuilderResources();
  }, []);

  const syncJson = (nextSourceJson, options = {}) => {
    const { record = true } = options;
    const normalizedSourceJson = normalizeLegacyPlaceholderImages(nextSourceJson);

    if (record) {
      setHistory((items) => [...items.slice(-30), sourceJson]);
      setFuture([]);
    }

    setSourceJson(normalizedSourceJson);
    setJsonText(JSON.stringify(normalizedSourceJson, null, 2));
    setJsonError("");
  };

  const undo = () => {
    setHistory((items) => {
      if (!items.length) {
        return items;
      }

      const previous = items[items.length - 1];
      setFuture((futureItems) => [sourceJson, ...futureItems]);
      syncJson(previous, { record: false });
      return items.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((items) => {
      if (!items.length) {
        return items;
      }

      const next = items[0];
      setHistory((historyItems) => [...historyItems.slice(-30), sourceJson]);
      syncJson(next, { record: false });
      return items.slice(1);
    });
  };

  const duplicateBlock = (blockId) => {
    const result = duplicateBlockInDocument(sourceJson, blockId);

    if (!result.block) {
      return;
    }

    syncJson(result.document);
    selectBlockForEditing(result.block.id);
  };

  const copyBlock = (blockId) => {
    const block = sourceJson.blocks.find((item) => item.id === blockId);

    if (block) {
      setClipboardBlock({
        ...block,
        props: {
          ...(block.props || {})
        }
      });
    }
  };

  const pasteBlock = () => {
    if (!clipboardBlock) {
      return;
    }

    const pasted = cloneBlock(clipboardBlock, clipboardBlock.type);

    syncJson({
      ...sourceJson,
      blocks: [...sourceJson.blocks, pasted]
    });
    selectBlockForEditing(pasted.id);
  };

  const updateTemplateField = (event) => {
    setTemplate({
      ...template,
      [event.target.name]: event.target.value
    });
  };

  const updateRawField = (event) => {
    setRawTemplate({
      ...rawTemplate,
      [event.target.name]: event.target.value
    });
  };

  const updateTheme = (key, value) => {
    syncJson(updateThemeToken(sourceJson, key, value));
  };

  const updateBlockProps = (blockId, patch) => {
    syncJson(updateBlockPropsInDocument(sourceJson, blockId, patch));
  };

  const selectBlockForEditing = (blockId) => {
    setSelectedBlockId(blockId);
    if (blockId) {
      setBuilderSection("edit");
    }
  };

  const addBlock = (type) => {
    const preset = dynamicBlockPresets[type];

    if (!preset) {
      return;
    }

    const result = insertBlockInDocument(sourceJson, preset);

    syncJson(result.document);
    selectBlockForEditing(result.block.id);
  };

  const insertBlock = (type, index) => {
    const preset = dynamicBlockPresets[type];

    if (!preset) {
      return;
    }

    const result = insertBlockInDocument(sourceJson, preset, index);

    syncJson(result.document);
    selectBlockForEditing(result.block.id);
  };

  const moveBlockToIndex = (blockId, index) => {
    const result = moveBlockInDocument(sourceJson, blockId, index);

    if (!result.block) {
      return;
    }

    syncJson(result.document);
    selectBlockForEditing(result.block.id);
  };

  const insertBlocksAtIndex = (blocks = [], index = sourceJson.blocks.length) => {
    if (!blocks.length) {
      return;
    }

    const result = insertBlocksInDocument(sourceJson, blocks, index);

    syncJson(result.document);
    selectBlockForEditing(result.blocks[0]?.id || "");
  };

  const handleBuilderDrop = (event, index) => {
    event.preventDefault();

    const componentType = event.dataTransfer.getData("component/type");
    const savedBlockId = event.dataTransfer.getData("saved-block/id");
    const templateId = event.dataTransfer.getData("template/id");
    const predefinedTemplateSlug = event.dataTransfer.getData("template/predefined-slug");
    const blockId = event.dataTransfer.getData("block/id");

    if (componentType && dynamicBlockPresets[componentType]) {
      insertBlock(componentType, index);
      return;
    }

    if (savedBlockId) {
      const savedBlock = savedBlocks.find((item) => item._id === savedBlockId);

      if (savedBlock) {
        const result = insertBlockInDocument(sourceJson, savedBlock.block, index);

        syncJson(result.document);
        selectBlockForEditing(result.block.id);
      }

      return;
    }

    if (templateId) {
      const droppedTemplate = templates.find((item) => item._id === templateId);

      if (droppedTemplate?.sourceJson?.blocks?.length) {
        insertBlocksAtIndex(droppedTemplate.sourceJson.blocks, index);
      } else {
        loadSavedTemplate(templateId);
      }

      return;
    }

    if (predefinedTemplateSlug) {
      const droppedTemplate = predefinedTemplates.find((item) => item.slug === predefinedTemplateSlug);

      if (droppedTemplate?.sourceJson?.blocks?.length) {
        insertBlocksAtIndex(droppedTemplate.sourceJson.blocks, index);
      }

      return;
    }

    if (blockId) {
      moveBlockToIndex(blockId, index);
    }
  };

  const removeBlock = (blockId) => {
    const result = removeBlockFromDocument(sourceJson, blockId);

    syncJson(result.document);
    setSelectedBlockId(result.nextSelectedId);
  };

  const moveBlock = (blockId, direction) => {
    const index = sourceJson.blocks.findIndex((block) => block.id === blockId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= sourceJson.blocks.length) {
      return;
    }

    const result = moveBlockInDocument(sourceJson, blockId, nextIndex);

    syncJson(result.document);
  };

  const updateFormField = (fieldIndex, patch) => {
    if (!selectedBlock || selectedBlock.type !== "form") {
      return;
    }

    updateBlockProps(selectedBlock.id, {
      fields: selectedBlock.props.fields.map((field, index) => (
        index === fieldIndex
          ? {
              ...field,
              ...patch
            }
          : field
      ))
    });
  };

  const addFormField = () => {
    if (!selectedBlock || selectedBlock.type !== "form") {
      return;
    }

    updateBlockProps(selectedBlock.id, {
      fields: [
        ...(selectedBlock.props.fields || []),
        {
          name: `field_${Date.now()}`,
          label: "New Field",
          type: "text",
          required: false
        }
      ]
    });
  };

  const removeFormField = (fieldIndex) => {
    if (!selectedBlock || selectedBlock.type !== "form") {
      return;
    }

    updateBlockProps(selectedBlock.id, {
      fields: selectedBlock.props.fields.filter((field, index) => index !== fieldIndex)
    });
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      syncJson(parsed);
      setSelectedBlockId(parsed.blocks?.[0]?.id || "");
    } catch (error) {
      setJsonError(error.message);
    }
  };

  const previewBuilder = async ({ silent = false } = {}) => {
    const previewSource = {
      ...sourceJson,
      name: template.name,
      subject: template.subject
    };
    const localRendered = renderStudioDocument(previewSource);

    try {
      setPreviewError("");
      if (silent) {
        setPreviewLoading(true);
      } else {
        setLoading(true);
      }

      setPreview(localRendered);
      setPreviewTab("html");

      const response = await axios.post(apiUrl("/api/templates/builder/preview"), {
        sourceJson: previewSource
      });

      setPreview(response.data.rendered || response.data.compiled || localRendered);
      setPreviewValidation(response.data.validation || null);
    } catch (error) {
      console.log(error);
      const message = error.response?.data?.message || "Backend validation unavailable. Showing local canvas preview.";
      setPreview(localRendered);
      setPreviewError(message);
      setPreviewValidation(error.response?.data?.validation || null);

      if (!silent && error.response?.data?.message) {
        alert(message);
      }
    } finally {
      if (silent) {
        setPreviewLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const previewRawTemplate = async ({ silent = false } = {}) => {
    try {
      setPreviewError("");
      if (silent) {
        setPreviewLoading(true);
      } else {
        setLoading(true);
      }

      const response = await axios.post(apiUrl("/api/templates/builder/preview"), {
        subject: rawTemplate.subject,
        html: rawTemplate.html,
        amp: rawTemplate.amp,
        formHtml: rawTemplate.formHtml,
        text: rawTemplate.text
      });

      setPreview(response.data.rendered || response.data.compiled);
      setPreviewValidation(response.data.validation || null);
      setPreviewTab("html");
    } catch (error) {
      console.log(error);
      const message = error.response?.data?.message || "Preview failed. Check backend is running.";
      setPreviewError(message);
      setPreviewValidation(error.response?.data?.validation || null);

      if (!silent) {
        alert(message);
      }
    } finally {
      if (silent) {
        setPreviewLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const validateCurrentTemplate = async ({ silent = false } = {}) => {
    const fallbackValidation = mode === "builder" ? validateStudioDocument(builderPayload().sourceJson) : null;

    try {
      setPreviewError("");
      setPreviewLoading(true);

      const response = await axios.post(
        apiUrl("/api/templates/builder/validate"),
        mode === "builder"
          ? {
              sourceJson: builderPayload().sourceJson,
              subject: template.subject
            }
          : {
              subject: rawTemplate.subject,
              html: rawTemplate.html,
              amp: rawTemplate.amp,
              formHtml: rawTemplate.formHtml
            }
      );

      setPreviewValidation(response.data.validation || null);

      if (!silent) {
        alert(response.data.validation?.valid ? "Template validation passed" : "Template needs attention");
      }

      return response.data.validation;
    } catch (error) {
      const responseData = error.response?.data;
      const validation = responseData?.validation || fallbackValidation;
      const message = responseData?.message || "Template validation failed";

      console.log("Template validation failed:", {
        status: error.response?.status,
        message,
        response: responseData,
        fallbackValidation
      });

      setPreviewValidation(validation);
      setPreviewError(mode === "builder" && fallbackValidation?.valid
        ? "Backend validation failed, but the local builder document is valid."
        : message);

      if (!silent) {
        alert(mode === "builder" && fallbackValidation?.valid
          ? "Backend validation failed, but local builder validation passed. You can still save this template."
          : message);
      }

      return validation;
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "builder") {
      return undefined;
    }

    const timer = setTimeout(() => {
      previewBuilder({ silent: true });
    }, 300);

    return () => clearTimeout(timer);
  }, [mode, sourceJson, template.name, template.subject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraftSnapshot();
    }, 900);

    return () => clearTimeout(timer);
  }, [mode, sourceJson, template, rawTemplate]);

  const saveTemplate = async (event, statusOverride = saveIntent) => {
    event?.preventDefault?.();

    try {
      setLoading(true);

      const validation = mode === "builder"
        ? validateStudioDocument(builderPayload().sourceJson)
        : await validateCurrentTemplate({ silent: true });
      const nextStatus = mode === "builder"
        ? statusOverride || template.status || "draft"
        : statusOverride || rawTemplate.status || "draft";

      if (nextStatus === "published" && validation && !validation.valid) {
        alert("Fix validation errors before publishing this template.");
        return;
      }

      if (mode === "builder") {
        const nextBuilderPayload = {
          ...builderPayload(nextStatus),
          ...pickThankYouThemeFields(sourceJson.theme),
          isActive: true
        };
        const response = activeTemplateId
          ? await axios.put(apiUrl(`/api/templates/${encodeURIComponent(activeTemplateId)}`), nextBuilderPayload)
          : await axios.post(apiUrl("/api/templates"), nextBuilderPayload);

        setActiveTemplateId(templateIdentifier(response.data.template) || activeTemplateId || "");
        setPreviewValidation(response.data.validation || validation || null);
        const rendered = response.data.template || renderStudioDocument(nextBuilderPayload.sourceJson);
        setPreview({
          html: rendered.html || "",
          amp: rendered.amp || "",
          formHtml: rendered.formHtml || "",
          text: rendered.text || ""
        });
        await fetchVersions(templateIdentifier(response.data.template) || activeTemplateId);
      } else {
        const response = await axios.post(apiUrl("/api/templates"), rawPayload(nextStatus));
        setPreviewValidation(response.data.validation || validation || null);
        setPreview({
          html: response.data.template?.html || "",
          amp: response.data.template?.amp || "",
          formHtml: response.data.template?.formHtml || "",
          text: response.data.template?.text || ""
        });
      }

      if (mode === "builder") {
        setTemplate((current) => ({ ...current, status: nextStatus }));
      } else {
        setRawTemplate((current) => ({ ...current, status: nextStatus }));
      }
      setSaveDialogOpen(false);
      alert(nextStatus === "draft" ? "Draft saved successfully" : "Template saved successfully");
      await fetchTemplates();
      window.dispatchEvent(new Event("templates:changed"));
    } catch (error) {
      console.log("Template save failed:", {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        response: error.response?.data,
        error
      });
      setPreviewValidation(error.response?.data?.validation || previewValidation);
      alert(templateSaveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadStarter = () => {
    setTemplate(initialTemplate);
    syncJson(emptyBuilderSource);
    setSelectedBlockId("");
    setPreview(null);
    setMode("builder");
    setTemplateWorkspace("builder");
    setActiveTemplateId("");
    setVersions([]);
  };

  const loadPredefinedTemplate = (item) => {
    if (!item?.sourceJson) {
      return;
    }

    setTemplate({
      name: templateText(item, "name"),
      slug: templateText(item, "slug"),
      subject: templateText(item, "subject"),
      status: "draft"
    });
    syncJson(item.sourceJson);
    selectBlockForEditing(item.sourceJson.blocks?.[0]?.id || "");
    setActiveTemplateId("");
    setVersions([]);
    setPreview(null);
    setMode("builder");
    setTemplateWorkspace("builder");
    setWorkspaceTab("canvas");
  };

  const loadPresetTemplate = (type) => {
    const preset = dynamicBlockPresets[type];

    if (!preset) {
      return;
    }

    const block = cloneBlock(preset, type);
    const label = dynamicComponentLabels[type] || type;
    const nextSourceJson = {
      ...emptyBuilderSource,
      blocks: [block]
    };

    setTemplate({
      name: `${label} Template`,
      slug: `${type}-template`,
      subject: `New ${label} email`,
      status: "draft"
    });
    syncJson(nextSourceJson);
    selectBlockForEditing(block.id);
    setActiveTemplateId("");
    setVersions([]);
    setPreview(null);
    setMode("builder");
    setTemplateWorkspace("builder");
    setWorkspaceTab("canvas");
  };

  const loadSavedTemplate = async (templateId) => {
    const resolvedTemplateId = typeof templateId === "object" ? templateIdentifier(templateId) : templateId;

    if (!resolvedTemplateId) {
      alert("Template id or slug is missing.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(apiUrl(`/api/templates/${encodeURIComponent(resolvedTemplateId)}`));
      const savedTemplate = response.data.template;

      if (!savedTemplate?.sourceJson) {
        alert("This saved template was created from raw HTML, so it cannot be loaded into the visual builder.");
        return;
      }

      setTemplate({
        name: templateText(savedTemplate, "name"),
        slug: templateText(savedTemplate, "slug"),
        subject: templateText(savedTemplate, "subject"),
        status: templateText(savedTemplate, "status", "draft")
      });
      const hydratedSourceJson = hydrateThankYouThemeFields(savedTemplate);
      syncJson(hydratedSourceJson);
      setSelectedBlockId(hydratedSourceJson.blocks?.[0]?.id || "");
      const savedIdentifier = templateIdentifier(savedTemplate);
      setActiveTemplateId(savedIdentifier);
      await fetchVersions(savedIdentifier);
      setMode("builder");
      setTemplateWorkspace("builder");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Template load failed");
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (version) => {
    if (!activeTemplateId || !version) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(apiUrl(`/api/templates/${encodeURIComponent(activeTemplateId)}/versions/${version}/restore`));
      const restoredTemplate = response.data.template;

      setTemplate({
        name: templateText(restoredTemplate, "name"),
        slug: templateText(restoredTemplate, "slug"),
        subject: templateText(restoredTemplate, "subject"),
        status: templateText(restoredTemplate, "status", "draft")
      });
      const hydratedSourceJson = hydrateThankYouThemeFields(restoredTemplate);
      syncJson(hydratedSourceJson);
      setSelectedBlockId(hydratedSourceJson.blocks?.[0]?.id || "");
      await fetchVersions(restoredTemplate._id);
      alert("Template version restored");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Version restore failed");
    } finally {
      setLoading(false);
    }
  };

  const addSavedBlock = (savedBlock) => {
    const block = cloneBlock(savedBlock.block, savedBlock.type);

    syncJson({
      ...sourceJson,
      blocks: [...(sourceJson.blocks || []), block]
    });
    setSelectedBlockId(block.id);
  };

  const addImageBlockFromComposer = (imageDataUrl) => {
    const imageBlock = {
      type: "image",
      props: {
        src: imageDataUrl,
        alt: "Composed campaign creative",
        width: sourceJson.theme?.width || 600,
        height: "auto",
        href: "{{formHtmlUrl}}"
      }
    };
    const result = insertBlockInDocument(sourceJson, imageBlock);

    syncJson(result.document);
    selectBlockForEditing(result.block.id);
    setWorkspaceTab("canvas");
  };

  const saveSelectedBlock = async () => {
    if (!selectedBlock) {
      return;
    }

    const name = window.prompt("Saved block name", selectedBlock.type);

    if (!name) {
      return;
    }

    try {
      const response = await axios.post(apiUrl("/api/templates/builder/blocks"), {
        name,
        type: selectedBlock.type,
        category: "custom",
        block: selectedBlock
      });

      setSavedBlocks((items) => [response.data.savedBlock, ...items]);
      alert("Block saved");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Saved block failed");
    }
  };

  const loadRawExample = () => {
    setRawTemplate({
      name: "Raw Demo Template",
      slug: "raw-demo",
      subject: "Hello {{email}}",
      status: "draft",
      html: `<html><body><h1>{{campaignName}}</h1><p>Hi {{email}}, this is your campaign email.</p><p><a href="{{formHtmlUrl}}">Open form</a></p></body></html>`,
      amp: "",
      formHtml: `<html><body><form method="post"><label>Company</label><input name="company" required><button type="submit">Submit</button></form></body></html>`,
      text: "Please view this email in HTML."
    });
    setMode("raw");
  };

  if (fullPreviewOpen) {
    return (
      <TemplatePreviewWorkspace
        mode={fullPreviewMode}
        setMode={setFullPreviewMode}
        preview={liveCanvasPreview}
        onBack={() => setFullPreviewOpen(false)}
      />
    );
  }

  if (templateWorkspace === "gallery") {
    return (
      <TemplatesHomePage
        templates={templates}
        loading={listLoading}
        error={listError}
        onNewTemplate={loadStarter}
        onLoadSavedTemplate={loadSavedTemplate}
      />
    );
  }

  return (
    <section className="w-full max-w-full overflow-hidden border border-[#dde5f0] bg-white shadow-sm">
      <div className="grid min-h-14 grid-cols-[minmax(260px,320px)_1fr_minmax(360px,auto)] border-b border-[#dde5f0] bg-white">
        <div className="flex min-w-0 items-center gap-3 border-r border-[#dde5f0] px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6c4cff] to-[#20c997] text-sm font-black text-white">A</span>
          <span className="min-w-0 truncate text-sm font-medium text-slate-600">{templateText(template, "name", "Template")} - 25-05-2026 ...</span>
          <Edit3 size={15} className="shrink-0 text-slate-700" />
        </div>
        <div className="flex items-center justify-center gap-2 border-r border-[#dde5f0] px-3">
          <button
            type="button"
            onClick={() => setPreviewViewport(previewViewport === "desktop" ? "mobile" : "desktop")}
            className="inline-flex items-center gap-2 rounded-md border border-[#dde5f0] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Monitor size={16} />
            {previewViewport === "mobile" ? "Mobile" : "Desktop"}
            <ChevronDown size={16} />
          </button>
          <TemplateStatusMenu
            openStatus={templateStatusMenu}
            setOpenStatus={setTemplateStatusMenu}
            groups={templateStatusGroups}
            activeTemplateId={activeTemplateId}
            loadSavedTemplate={loadSavedTemplate}
          />
          <CanvasViewSwitch value={canvasPreviewMode} onChange={setCanvasPreviewMode} />
        </div>
        <div className="flex items-center justify-end gap-2 px-3">
          <button type="button" onClick={loadStarter} className="rounded-md p-2 text-slate-600 hover:bg-slate-50" title="New blank template">
            <FilePlus2 size={19} />
          </button>
          <button type="button" onClick={() => setTemplateWorkspace("gallery")} className="rounded-md border border-[#dde5f0] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Templates
          </button>
          <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-slate-50" title="Share">
            <Share2 size={18} />
          </button>
          <button type="button" onClick={() => setFullPreviewOpen(true)} className="rounded-md border border-[#dde5f0] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Preview
          </button>
          <button type="button" onClick={saveDraftNow} className="rounded-md border border-[#dde5f0] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Draft
          </button>
          {draftSavedAt && (
            <span className="hidden text-xs font-medium text-slate-500 xl:inline">
              Auto saved {draftSavedAt}
            </span>
          )}
          <button type="button" onClick={() => openSaveDialog("published")} disabled={loading} className="rounded-md bg-[#f2efff] px-5 py-2 text-sm font-semibold text-[#6c4cff] hover:bg-[#e8e2ff] disabled:opacity-50">
            Save
          </button>
        </div>
      </div>

      {saveDialogOpen && (
        <SaveTemplateDialog
          mode={mode}
          loading={loading}
          status={saveIntent}
          template={mode === "builder" ? template : rawTemplate}
          updateTemplateField={mode === "builder" ? updateTemplateField : updateRawField}
          setStatus={(status) => {
            setSaveIntent(status);
            if (mode === "builder") {
              setTemplate((current) => ({ ...current, status }));
            } else {
              setRawTemplate((current) => ({ ...current, status }));
            }
          }}
          onClose={() => setSaveDialogOpen(false)}
          onSubmit={(event) => saveTemplate(event, saveIntent)}
        />
      )}

      <form onSubmit={(event) => {
        event.preventDefault();
        openSaveDialog("published");
      }} className="min-w-0">
        {mode === "builder" ? (
          <>
            <div className="grid min-w-0 overflow-hidden bg-white xl:h-[calc(100vh-57px)] xl:grid-cols-[390px_minmax(0,1fr)] 2xl:grid-cols-[430px_minmax(0,1fr)]">
              <aside className="sticky top-0 z-20 grid min-w-0 grid-cols-[80px_minmax(0,1fr)] self-start border-b border-slate-200 bg-white xl:h-[calc(100vh-57px)] xl:border-b-0 xl:border-r">
                <BuilderRail
                  sections={builderSections}
                  activeSection={builderSection}
                  setActiveSection={setBuilderSection}
                  collapse={() => setBuilderSection("components")}
                />
                <BuilderSidePanel
                  activeSection={builderSection}
                  template={template}
                  updateTemplateField={updateTemplateField}
                  setTemplate={setTemplate}
                  sourceJson={sourceJson}
                  updateTheme={updateTheme}
                  addBlock={addBlock}
                  componentGroups={dynamicComponentGroups}
                  componentLabels={dynamicComponentLabels}
                  savedBlocks={savedBlocks}
                  addSavedBlock={addSavedBlock}
                  listLoading={listLoading}
                  templates={templates}
                  activeTemplateId={activeTemplateId}
                  loadSavedTemplate={loadSavedTemplate}
                  versions={versions}
                  restoreVersion={restoreVersion}
                  blocks={sourceJson.blocks}
                  selectedBlockId={selectedBlockId}
                  setSelectedBlockId={selectBlockForEditing}
                  handleBuilderDrop={handleBuilderDrop}
                  selectedBlock={selectedBlock}
                  moveBlock={moveBlock}
                  removeBlock={removeBlock}
                  duplicateBlock={duplicateBlock}
                  copyBlock={copyBlock}
                  pasteBlock={pasteBlock}
                  canPaste={Boolean(clipboardBlock)}
                  undo={undo}
                  redo={redo}
                  canUndo={history.length > 0}
                  canRedo={future.length > 0}
                  updateBlockProps={updateBlockProps}
                  updateFormField={updateFormField}
                  addFormField={addFormField}
                  removeFormField={removeFormField}
                  saveSelectedBlock={saveSelectedBlock}
                  editorConfig={editorConfig}
                  loadTemplate={loadPredefinedTemplate}
                />
              </aside>

              <main className="min-w-0 bg-[#e9eef5]">
                <div className="min-w-0 min-h-[calc(100vh-57px)] overflow-y-auto p-3 sm:p-5 xl:h-[calc(100vh-57px)]">
                  {canvasPreviewMode === "design" && (
                    <EmailCanvas
                      sourceJson={sourceJson}
                      selectedBlockId={selectedBlockId}
                      setSelectedBlockId={selectBlockForEditing}
                      handleBuilderDrop={handleBuilderDrop}
                      reorderBlock={moveBlockToIndex}
                      updateBlockProps={updateBlockProps}
                      removeBlock={removeBlock}
                      editorConfig={editorConfig}
                    />
                  )}

                  {canvasPreviewMode !== "design" && (
                    <LiveCanvasPreview
                      markup={renderedLiveCanvasMarkup}
                      rawMarkup={liveCanvasMarkup}
                      mode={canvasPreviewMode}
                      viewport={previewViewport}
                    />
                  )}

                  {workspaceTab === "engines" && (
                    <AdvancedEditorSuite
                      sourceJson={sourceJson}
                      template={template}
                      addImageBlockFromComposer={addImageBlockFromComposer}
                    />
                  )}
                </div>
              </main>
            </div>
          </>
        ) : (
          <>
            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]">
              <div className="min-w-0 space-y-4">
                <CompactStatusField
                  value={rawTemplate.status || "draft"}
                  onChange={(event) => setRawTemplate({
                    ...rawTemplate,
                    status: event.target.value
                  })}
                />
                <RawTemplateForm rawTemplate={rawTemplate} updateRawField={updateRawField} />
                <div className="flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => previewRawTemplate()}
                    disabled={loading}
                    className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {loading ? "Generating..." : "Preview Outputs"}
                  </button>
                  <button
                    type="button"
                    onClick={() => validateCurrentTemplate()}
                    disabled={previewLoading}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {previewLoading ? "Checking..." : "Validate Raw Template"}
                  </button>
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <OutputPreview
                  previewMarkup={previewMarkup}
                  renderedPreviewMarkup={renderedPreviewMarkup}
                  previewTab={previewTab}
                  setPreviewTab={setPreviewTab}
                  preview={preview}
                  previewViewport={previewViewport}
                  setPreviewViewport={setPreviewViewport}
                  sideBySidePreview={sideBySidePreview}
                  setSideBySidePreview={setSideBySidePreview}
                  previewLoading={previewLoading}
                  previewError={previewError}
                  previewValidation={previewValidation}
                />
              </div>
            </div>
          </>
        )}

        <div className="hidden min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <VariableChips compact />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Template"}
          </button>
        </div>
      </form>
    </section>
  );
};

const SaveTemplateDialog = ({
  mode,
  loading,
  status,
  template,
  updateTemplateField,
  setStatus,
  onClose,
  onSubmit
}) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 px-4 pt-20">
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black text-slate-950">
            {status === "draft" ? "Save Draft" : "Save Template"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Confirm template details before saving it to your library.
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">
          x
        </button>
      </div>

      <div className="grid gap-3">
        <InputField
          name="name"
          label="Template Name"
          value={templateText(template, "name")}
          onChange={updateTemplateField}
          placeholder="Eligibility campaign"
          required
        />
        <InputField
          name="subject"
          label="Email Subject"
          value={templateText(template, "subject")}
          onChange={updateTemplateField}
          placeholder="Check your eligibility"
        />
        <InputField
          name="slug"
          label="Slug"
          value={templateText(template, "slug")}
          onChange={updateTemplateField}
          placeholder="eligibility-campaign"
        />
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="rounded-md bg-[#6c4cff] px-4 py-2 text-sm font-bold text-white hover:bg-[#5b3ded] disabled:opacity-50">
          {loading ? "Saving..." : status === "draft" ? "Save Draft" : "Save Template"}
        </button>
      </div>

      {mode === "builder" && (
        <p className="mt-3 text-[11px] leading-4 text-slate-400">
          Drafts stay editable and appear under the Draft templates menu.
        </p>
      )}
    </form>
  </div>
);

const InputField = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <input className={inputClass} {...props} />
  </label>
);

const StudioStat = ({ label, value, tone = "default" }) => {
  const toneClass = tone === "danger"
    ? "border-red-400/40 bg-red-500/10 text-red-100"
    : tone === "warn"
      ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
      : "border-white/10 bg-white/10 text-white";

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
};

const StudioPill = ({ label, value, tone = "default" }) => {
  const toneClass = tone === "danger"
    ? "border-red-200 bg-red-50 text-red-700"
    : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-md border px-3 py-2 text-xs font-bold ${toneClass}`}>
      {label}: {value}
    </div>
  );
};

const ValidationSummary = ({ validation }) => {
  if (!validation) {
    return (
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Run validation to check send readiness.
      </div>
    );
  }

  const toneClass = validation.valid
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`mt-3 rounded-md border px-3 py-2 text-xs ${toneClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold">
          {validation.valid ? "Ready for sending" : "Fix errors before publishing"}
        </span>
        <span>
          {validation.errors?.length || 0} errors · {validation.warnings?.length || 0} warnings
        </span>
      </div>
    </div>
  );
};

const VariableChips = ({ compact = false }) => {
  const variables = [
    "{{email}}",
    "{{firstName | default:'there'}}",
    "{{campaignName}}",
    "{{subject}}",
    "{{unsubscribeUrl}}",
    "{{formHtmlUrl}}",
    "{{formAmpUrl}}"
  ];

  return (
    <div className={compact ? "min-w-0 flex-1" : "rounded-lg border border-slate-200 bg-white p-4"}>
      {!compact && <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Common Variables</p>}
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <code key={variable} className="max-w-full break-all rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
            {variable}
          </code>
        ))}
      </div>
    </div>
  );
};

const CompactStatusField = ({ value, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
    <select value={value} onChange={onChange} className={inputClass}>
      <option value="draft">Draft</option>
      <option value="published">Published</option>
      <option value="archived">Archived</option>
    </select>
  </label>
);

const EmailBodyStylePanel = ({
  template,
  updateTemplateField,
  setTemplate,
  sourceJson,
  updateTheme,
  editorConfig
}) => {
  const theme = sourceJson.theme || {};
  const [activeDevice, setActiveDevice] = useState("desktop");
  const fontOptions = [
    "Arial, sans-serif",
    "Verdana, sans-serif",
    "Helvetica, Arial, sans-serif",
    "Georgia, serif",
    "Tahoma, sans-serif",
    "Trebuchet MS, sans-serif"
  ];

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-950">Email Body</h3>
        <div className="mt-7 flex gap-7 border-b border-[#d8e0ea]">
          {["desktop", "mobile"].map((device) => (
            <button
              key={device}
              type="button"
              onClick={() => setActiveDevice(device)}
              className={`pb-3 text-sm capitalize ${
                activeDevice === device
                  ? "-mb-px border-b-2 border-[#6c4cff] font-semibold text-[#6c4cff]"
                  : "font-medium text-[#64748b]"
              }`}
            >
              {device}
            </button>
          ))}
        </div>
      </div>
      {activeDevice === "desktop" ? (
        <DesktopEmailBodyStyle theme={theme} updateTheme={updateTheme} fontOptions={fontOptions} editorConfig={editorConfig} />
      ) : (
        <MobileEmailBodyStyle theme={theme} updateTheme={updateTheme} />
      )}
    </div>
  );
};

const DesktopEmailBodyStyle = ({ theme, updateTheme, fontOptions, editorConfig }) => {
  const [backgroundUploadStatus, setBackgroundUploadStatus] = useState("");

  const uploadBackgroundImage = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setBackgroundUploadStatus(`Compressing ${formatFileSize(file.size)} image...`);
      const resizedImage = await resizeImageFile(file);

      setBackgroundUploadStatus(`Uploading compressed image (${formatFileSize(resizedImage.outputSize)})...`);
      const response = await axios.post(getAssetUploadUrl(editorConfig), {
        image: resizedImage.dataUrl,
        fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
        category: "backgrounds"
      });
      const assetUrl = response.data?.asset?.url || response.data?.url;

      if (!assetUrl || /^data:image\//i.test(assetUrl)) {
        throw new Error("Upload response did not include a hosted asset URL.");
      }

      updateTheme("backgroundImageUrl", assetUrl);
      setBackgroundUploadStatus(`Shell background image uploaded (${formatFileSize(resizedImage.outputSize)}).`);
    } catch (error) {
      console.log(error);
      setBackgroundUploadStatus(error.response?.status === 413
        ? "Shell background image is still too large after compression. Try a smaller image."
        : "Shell background image upload failed. Check the asset endpoint and try again.");
    } finally {
      event.target.value = "";
    }
  };

  return (
  <div>
    <BodyStyleAccordion title="Font">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Family</span>
        <select value={theme.fontFamily || "Arial, sans-serif"} onChange={(event) => updateTheme("fontFamily", event.target.value)} className={inputClass}>
          {fontOptions.map((font) => <option key={font} value={font}>{font.split(",")[0]}</option>)}
        </select>
      </label>
    </BodyStyleAccordion>

    <BodyStyleAccordion title="Color">
      <div className="grid gap-3">
        <ColorLine label="Email text color" value={theme.textColor || "#111827"} onChange={(value) => updateTheme("textColor", value)} />
        <ColorLine label="Page background" value={theme.backgroundColor || "#f8fafc"} onChange={(value) => updateTheme("backgroundColor", value)} />
        <ColorLine label="Email body color" value={theme.contentColor || "#ffffff"} onChange={(value) => updateTheme("contentColor", value)} />
        <ColorLine label="Accent color" value={theme.primaryColor || "#0f766e"} onChange={(value) => updateTheme("primaryColor", value)} />
        <ColorLine label="Muted text color" value={theme.mutedColor || "#64748b"} onChange={(value) => updateTheme("mutedColor", value)} />
      </div>
    </BodyStyleAccordion>

    <BodyStyleAccordion title="Thank You">
      <div className="grid gap-3">
        <InputField label="Title" value={theme.thankYouTitle || "Thank you"} onChange={(event) => updateTheme("thankYouTitle", event.target.value)} />
        <InputField label="Message" value={theme.thankYouText || "Your response was submitted."} onChange={(event) => updateTheme("thankYouText", event.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <ColorLine label="Background" value={theme.thankYouBackgroundColor || "#ecfdf5"} onChange={(value) => updateTheme("thankYouBackgroundColor", value)} />
          <ColorLine label="Border" value={theme.thankYouBorderColor || "#34d399"} onChange={(value) => updateTheme("thankYouBorderColor", value)} />
          <ColorLine label="Title color" value={theme.thankYouTitleColor || "#047857"} onChange={(value) => updateTheme("thankYouTitleColor", value)} />
          <ColorLine label="Message color" value={theme.thankYouTextColor || "#064e3b"} onChange={(value) => updateTheme("thankYouTextColor", value)} />
        </div>
        <div
          className="rounded-md border p-4 text-center"
          style={{
            backgroundColor: theme.thankYouBackgroundColor || "#ecfdf5",
            borderColor: theme.thankYouBorderColor || "#34d399"
          }}
        >
          <div className="text-sm font-extrabold" style={{ color: theme.thankYouTitleColor || "#047857" }}>
            {theme.thankYouTitle || "Thank you"}
          </div>
          <div className="mt-1 text-xs font-semibold" style={{ color: theme.thankYouTextColor || "#064e3b" }}>
            {theme.thankYouText || "Your response was submitted."}
          </div>
        </div>
      </div>
    </BodyStyleAccordion>

    <BodyStyleAccordion title="Shell Background Image">
      <div className="grid gap-3">
        <InputField label="Shell Image URL" value={theme.backgroundImageUrl || ""} onChange={(event) => updateTheme("backgroundImageUrl", event.target.value)} placeholder="https://example.com/background.jpg" />
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Upload Shell Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={uploadBackgroundImage}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#f2efff] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#6c4cff]"
          />
          {backgroundUploadStatus && <span className="mt-2 block text-xs font-semibold text-slate-500">{backgroundUploadStatus}</span>}
        </label>
        {theme.backgroundImageUrl && (
          <button
            type="button"
            onClick={() => updateTheme("backgroundImageUrl", "")}
            className="justify-self-start rounded-md border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
          >
            Remove shell background image
          </button>
        )}
        <InputField label="Overlay" value={theme.backgroundOverlayColor || ""} onChange={(event) => updateTheme("backgroundOverlayColor", event.target.value)} placeholder="rgba(0,0,0,0.25)" />
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700">
            Size
            <select value={theme.backgroundImageSize || "cover"} onChange={(event) => updateTheme("backgroundImageSize", event.target.value)} className={`mt-2 ${inputClass}`}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="auto">Original</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Position
            <select value={theme.backgroundImagePosition || "center"} onChange={(event) => updateTheme("backgroundImagePosition", event.target.value)} className={`mt-2 ${inputClass}`}>
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Repeat
            <select value={theme.backgroundImageRepeat || "no-repeat"} onChange={(event) => updateTheme("backgroundImageRepeat", event.target.value)} className={`mt-2 ${inputClass}`}>
              <option value="no-repeat">No repeat</option>
              <option value="repeat">Repeat</option>
              <option value="repeat-x">Repeat X</option>
              <option value="repeat-y">Repeat Y</option>
            </select>
          </label>
        </div>
      </div>
    </BodyStyleAccordion>

    <BodyStyleAccordion title="Text">
      <div className="grid gap-4">
        <Stepper label="Paragraph" value={theme.bodyFontSize || 16} onChange={(value) => updateTheme("bodyFontSize", value)} />
        <Stepper label="Heading" value={theme.headingFontSize || 28} onChange={(value) => updateTheme("headingFontSize", value)} />
        <InputField label="Line height" value={theme.lineHeight || "1.45"} onChange={(event) => updateTheme("lineHeight", event.target.value)} />
        <InputField label="Weight" value={theme.fontWeight || "400"} onChange={(event) => updateTheme("fontWeight", event.target.value)} />
      </div>
    </BodyStyleAccordion>

    <BodyStyleAccordion title="Button">
      <div className="grid gap-3">
        <ButtonPreview label="Primary" color={theme.buttonColor || theme.primaryColor || "#0f766e"} variant="primary" />
        <ColorLine label="Button color" value={theme.buttonColor || theme.primaryColor || "#0f766e"} onChange={(value) => updateTheme("buttonColor", value)} />
        <ColorLine label="Button text color" value={theme.buttonTextColor || "#ffffff"} onChange={(value) => updateTheme("buttonTextColor", value)} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Radius" type="number" value={theme.buttonRadius || 8} onChange={(event) => updateTheme("buttonRadius", Number(event.target.value))} />
          <InputField label="Font size" type="number" value={theme.buttonFontSize || 16} onChange={(event) => updateTheme("buttonFontSize", Number(event.target.value))} />
        </div>
        <InputField label="Padding" value={theme.buttonPadding || "13px 22px"} onChange={(event) => updateTheme("buttonPadding", event.target.value)} />
      </div>
    </BodyStyleAccordion>

    <BodyStyleAccordion title="Border">
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Radius" type="number" value={theme.radius || 0} onChange={(event) => updateTheme("radius", Number(event.target.value))} />
          <InputField label="Width" type="number" value={theme.borderWidth || 0} onChange={(event) => updateTheme("borderWidth", Number(event.target.value))} />
        </div>
        <ColorLine label="Border color" value={theme.borderColor || "#e2e8f0"} onChange={(value) => updateTheme("borderColor", value)} />
      </div>
    </BodyStyleAccordion>

    <BodyStyleAccordion title="Padding & Dimension">
      <div className="grid gap-4">
        <InputField label="Dimension" type="number" value={theme.width || 600} onChange={(event) => updateTheme("width", Number(event.target.value))} />
        <InputField label="Desktop image width" type="number" value={theme.desktopImageWidth || theme.bannerWidth || 240} onChange={(event) => {
          const value = Number(event.target.value);
          updateTheme("desktopImageWidth", value);
          updateTheme("bannerWidth", value);
          updateTheme("imageWidth", value);
        }} />
        <InputField label="Block padding" value={theme.blockPadding ?? "0"} onChange={(event) => updateTheme("blockPadding", event.target.value)} />
        <InputField label="Page padding" value={theme.pagePadding ?? "0"} onChange={(event) => updateTheme("pagePadding", event.target.value)} />
        <InputField label="Body padding" value={theme.padding ?? "0"} onChange={(event) => updateTheme("padding", event.target.value)} />
        <PaddingControl theme={theme} updateTheme={updateTheme} />
      </div>
    </BodyStyleAccordion>
  </div>
  );
};

const MobileEmailBodyStyle = ({ theme, updateTheme }) => (
  <div>
    <div className="rounded-md border border-[#d5deea] bg-[#f1f5fa] px-4 py-3 text-sm leading-5 text-slate-800">
      Setup default text formatting for mobile view.
    </div>
    <BodyStyleAccordion title="Text" defaultOpen>
      <div className="grid gap-4">
        <Stepper label="Paragraph" value={theme.mobileParagraphFontSize || theme.bodyFontSize || 16} onChange={(value) => updateTheme("mobileParagraphFontSize", value)} />
        <Stepper label="Heading 1" value={theme.mobileHeading1FontSize || 28} onChange={(value) => updateTheme("mobileHeading1FontSize", value)} />
        <Stepper label="Heading 2" value={theme.mobileHeading2FontSize || 24} onChange={(value) => updateTheme("mobileHeading2FontSize", value)} />
        <Stepper label="Heading 3" value={theme.mobileHeading3FontSize || 20} onChange={(value) => updateTheme("mobileHeading3FontSize", value)} />
        <Stepper label="Heading 4" value={theme.mobileHeading4FontSize || 18} onChange={(value) => updateTheme("mobileHeading4FontSize", value)} />
      </div>
    </BodyStyleAccordion>
    <BodyStyleAccordion title="Padding & Dimension">
      <div className="grid gap-3">
        <InputField label="Mobile width" type="number" value={theme.mobileWidth || 390} onChange={(event) => updateTheme("mobileWidth", Number(event.target.value))} />
        <InputField label="Mobile page padding" value={theme.mobilePadding || "16px 8px"} onChange={(event) => updateTheme("mobilePadding", event.target.value)} />
      </div>
    </BodyStyleAccordion>
  </div>
);

const BodyStyleAccordion = ({ title, defaultOpen = false, children }) => (
  <details open={defaultOpen} className="border-b border-[#d8e0ea] py-5">
    <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
      {title}
      <ChevronDown size={18} className="text-slate-900" />
    </summary>
    <div className="mt-5">{children}</div>
  </details>
);

const Stepper = ({ label, value, onChange }) => {
  const numericValue = Number(value) || 0;
  const setValue = (nextValue) => onChange(Math.max(1, Number(nextValue) || 1));

  return (
    <label className="block">
      {label && <span className="mb-3 block text-sm font-medium text-slate-800">{label}</span>}
      <span className="inline-grid h-9 grid-cols-[30px_84px_30px] overflow-hidden rounded border border-[#d5deea] bg-white text-sm text-black">
        <button type="button" onClick={() => setValue(numericValue - 1)} className="border-r border-[#d5deea] text-lg leading-none">-</button>
        <input type="number" value={numericValue} onChange={(event) => setValue(event.target.value)} className="w-full text-center outline-none" />
        <button type="button" onClick={() => setValue(numericValue + 1)} className="border-l border-[#d5deea] text-lg leading-none">+</button>
      </span>
    </label>
  );
};

const LegacyStepper = ({ value }) => (
  <div className="inline-grid h-9 grid-cols-[30px_84px_30px] overflow-hidden rounded border border-[#d5deea] bg-white text-sm text-black">
    <button type="button" className="border-r border-[#d5deea] text-lg leading-none">-</button>
    <input readOnly value={value} className="w-full text-center outline-none" />
    <button type="button" className="border-l border-[#d5deea] text-lg leading-none">+</button>
  </div>
);

const ColorSwatch = ({ value, onChange }) => (
  <label className="flex h-8 min-w-28 items-center gap-2 rounded border border-[#d5deea] bg-white px-2">
    <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-4 w-4 border-0 bg-transparent p-0" />
    <span className="font-mono text-xs text-slate-700">{value}</span>
  </label>
);

const ColorLine = ({ label, value, onChange }) => (
  <label className="block">
    <span className="text-xs font-semibold text-[#6c4cff]">{label}</span>
    <span className="mt-2 flex h-9 items-center gap-2 rounded border border-[#d5deea] bg-white px-2">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-4 w-4 border-0 bg-transparent p-0" />
      <span className="font-mono text-xs text-slate-700">{value}</span>
    </span>
  </label>
);

const ButtonPreview = ({ label, color, variant }) => (
  <div>
    <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
    <button
      type="button"
      className="flex h-12 w-full items-center justify-between rounded border border-[#d5deea] bg-white px-4 text-left"
    >
      <span
        className={`rounded-full px-4 py-2 text-xs font-bold ${
          variant === "tertiary" ? "border bg-white" : "text-white"
        }`}
        style={{
          backgroundColor: variant === "tertiary" ? "#ffffff" : color,
          borderColor: color,
          color: variant === "tertiary" ? color : "#ffffff"
        }}
      >
        Button text
      </span>
      <ChevronDown size={16} className="-rotate-90 text-slate-400" />
    </button>
  </div>
);

const PaddingControl = ({ theme, updateTheme }) => (
  <div className="mx-auto grid w-32 grid-cols-3 grid-rows-3 items-center justify-items-center text-xs text-slate-500">
    <div />
    <input type="number" value={theme.paddingTop ?? 0} onChange={(event) => updateTheme("paddingTop", Number(event.target.value))} className="h-8 w-10 rounded border border-[#d5deea] text-center" />
    <div />
    <input type="number" value={theme.paddingLeft ?? 0} onChange={(event) => updateTheme("paddingLeft", Number(event.target.value))} className="h-8 w-10 rounded border border-[#d5deea] text-center" />
    <input type="number" value={theme.contentPadding ?? 0} onChange={(event) => updateTheme("contentPadding", Number(event.target.value))} className="h-8 w-10 rounded border border-[#d5deea] text-center" />
    <input type="number" value={theme.paddingRight ?? 0} onChange={(event) => updateTheme("paddingRight", Number(event.target.value))} className="h-8 w-10 rounded border border-[#d5deea] text-center" />
    <div />
    <input type="number" value={theme.paddingBottom ?? 0} onChange={(event) => updateTheme("paddingBottom", Number(event.target.value))} className="h-8 w-10 rounded border border-[#d5deea] text-center" />
    <div />
  </div>
);

const ColorInput = ({ label, value, onChange }) => (
  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
    {label}
    <span className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-7 w-8 rounded border border-slate-200" />
      <span className="font-mono text-xs normal-case text-slate-600">{value}</span>
    </span>
  </label>
);

const FloatingBlockLibrary = ({
  builderSection,
  setBuilderSection,
  componentGroups,
  componentLabels,
  addBlock,
  templates,
  loadSavedTemplate,
  predefinedTemplates,
  loadTemplate
}) => {
  const activeGroup = componentGroups.find((group) => group.title.toLowerCase() === builderSection) || componentGroups[0];

  return (
    <div className="absolute left-0 top-12 z-50 w-[min(92vw,520px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
      <div className="border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Block Library</p>
        <p className="mt-1 text-sm font-bold text-slate-200">Add content without shrinking the canvas.</p>
      </div>

      <div className="grid max-h-[620px] min-h-[420px] grid-cols-[132px_minmax(0,1fr)] overflow-hidden">
        <nav className="premium-scrollbar overflow-y-auto border-r border-slate-100 bg-slate-50 p-2">
          {componentGroups.map((group) => {
            const id = group.title.toLowerCase();
            return (
              <button
                key={group.title}
                type="button"
                onClick={() => setBuilderSection(id)}
                className={`mb-1 w-full rounded-md px-3 py-2 text-left text-xs font-black transition ${
                  (activeGroup?.title || "").toLowerCase() === id
                    ? "bg-white text-[#0f766e] shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                {group.title}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setBuilderSection("templates")}
            className={`mb-1 w-full rounded-md px-3 py-2 text-left text-xs font-black transition ${
              builderSection === "templates"
                ? "bg-white text-[#0f766e] shadow-sm"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            Templates
          </button>
        </nav>

        <div className="premium-scrollbar overflow-y-auto p-3">
          {builderSection !== "templates" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {(activeGroup?.items || []).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("component/type", type);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  className="group rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:shadow-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-xs font-black text-[#0f766e]">
                    {(componentLabels[type] || type).slice(0, 2)}
                  </span>
                  <span className="mt-3 block text-sm font-black text-slate-950">{componentLabels[type] || type}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">Click or drag to canvas</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Prebuilt</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {predefinedTemplates.map((item) => (
                    <button
                      key={templateText(item, "slug", templateText(item, "name", "template"))}
                      type="button"
                      onClick={() => loadTemplate(item)}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-[#0f766e]"
                    >
                      <p className="text-sm font-black text-slate-950">{templateText(item, "name")}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{templateText(item, "category")}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Saved</p>
                <div className="grid gap-2">
                  {!templates.length && <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-500">No saved templates yet.</p>}
                  {templates.slice(0, 8).map((item) => (
                    <button
                      key={templateIdentifier(item) || templateText(item, "name", "saved-template")}
                      type="button"
                      onClick={() => loadSavedTemplate(item)}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-[#0f766e]"
                    >
                      <p className="text-sm font-black text-slate-950">{templateText(item, "name", "Untitled template")}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{templateText(item, "slug")}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusField = ({ value, onChange, validation }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
      <label className="block text-sm font-semibold text-slate-700">
        Template Status
        <select value={value} onChange={onChange} className={`mt-2 ${inputClass}`}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <div className="text-sm text-slate-600">
        {value === "published" ? (
          validation?.valid ? (
            <span className="font-semibold text-emerald-700">Ready to publish and send.</span>
          ) : (
            <span className="font-semibold text-red-700">Published templates must pass validation before saving.</span>
          )
        ) : (
          <span>Drafts can be saved with warnings while you keep editing.</span>
        )}
      </div>
    </div>
  </div>
);

const BuilderSidePanel = ({
  activeSection,
  template,
  updateTemplateField,
  setTemplate,
  sourceJson,
  updateTheme,
  addBlock,
  componentGroups,
  componentLabels,
  savedBlocks,
  addSavedBlock,
  listLoading,
  templates,
  activeTemplateId,
  loadSavedTemplate,
  versions,
  restoreVersion,
  blocks,
  selectedBlockId,
  setSelectedBlockId,
  handleBuilderDrop,
  selectedBlock,
  moveBlock,
  removeBlock,
  duplicateBlock,
  copyBlock,
  pasteBlock,
  canPaste,
  undo,
  redo,
  canUndo,
  canRedo,
  updateBlockProps,
  updateFormField,
  addFormField,
  removeFormField,
  saveSelectedBlock,
  editorConfig,
  loadTemplate
}) => {
  const titleMap = {
    style: "Style",
    layouts: "Elements & layouts",
    designs: "Designs",
    widgets: "Widgets",
    forms: "Forms",
    saved: "Saved library"
  };

  return (
    <div className="min-w-0 overflow-y-auto p-4 xl:h-[calc(100vh-57px)]">
      {activeSection === "edit" && (
        <SelectedBlockPanel
          selectedBlock={selectedBlock}
          moveBlock={moveBlock}
          removeBlock={removeBlock}
          duplicateBlock={duplicateBlock}
          copyBlock={copyBlock}
          pasteBlock={pasteBlock}
          canPaste={canPaste}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          updateBlockProps={updateBlockProps}
          updateFormField={updateFormField}
          addFormField={addFormField}
          removeFormField={removeFormField}
          saveSelectedBlock={saveSelectedBlock}
          editorConfig={editorConfig}
        />
      )}

      {activeSection === "style" && (
        <EmailBodyStylePanel
          template={template}
          updateTemplateField={updateTemplateField}
          setTemplate={setTemplate}
          sourceJson={sourceJson}
          updateTheme={updateTheme}
          editorConfig={editorConfig}
        />
      )}

      {activeSection === "layouts" && (
        <div className="space-y-5">
          <SectionNotice text="Layout will be added to mobile and desktop" />
          <ComponentLibrary
            addBlock={addBlock}
            componentGroups={componentGroups}
            componentLabels={componentLabels}
          />
        </div>
      )}

      {activeSection === "designs" && (
        <div className="space-y-4">
          <SectionNotice text="Blocks will be added to mobile and desktop." />
          <DesignSearchChips />
          <DesignGallery loadTemplate={loadTemplate} />
        </div>
      )}

      {activeSection === "widgets" && (
        <WidgetGallery labels={componentLabels} addBlock={addBlock} />
      )}

      {activeSection === "forms" && (
        <FormsGallery labels={componentLabels} addBlock={addBlock} />
      )}

      {activeSection === "saved" && (
        <div className="space-y-4">
          <SavedBlockLibrary savedBlocks={savedBlocks} addSavedBlock={addSavedBlock} />
          <SavedTemplates
            listLoading={listLoading}
            templates={templates}
            activeTemplateId={activeTemplateId}
            loadSavedTemplate={loadSavedTemplate}
            versions={versions}
            restoreVersion={restoreVersion}
            compact
          />
          <BlockOutline
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            setSelectedBlockId={setSelectedBlockId}
            handleBuilderDrop={handleBuilderDrop}
          />
        </div>
      )}
    </div>
  );
};

const PanelCard = ({ title, children }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
    {children}
  </div>
);

const SectionNotice = ({ text }) => (
  <div className="rounded-md border border-[#d5deea] bg-[#f1f5fa] px-4 py-3 text-center text-sm font-medium leading-5 text-slate-800">
    {text}
  </div>
);

const TemplateStatusMenu = ({
  openStatus,
  setOpenStatus,
  groups,
  activeTemplateId,
  loadSavedTemplate
}) => {
  const statusLabels = {
    draft: "Drafts",
    published: "Published"
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenStatus(openStatus ? "" : "draft")}
        className="inline-flex items-center gap-2 rounded-md border border-[#dde5f0] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Templates
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          {(groups.draft?.length || 0) + (groups.published?.length || 0)}
        </span>
        <ChevronDown size={16} />
      </button>

      {openStatus && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
          <div className="flex border-b border-slate-100 bg-slate-50 p-1">
            {["draft", "published"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setOpenStatus(status)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-black ${
                  openStatus === status
                    ? "bg-white text-[#6c4cff] shadow-sm"
                    : "text-slate-500 hover:bg-white"
                }`}
              >
                {statusLabels[status]} ({groups[status]?.length || 0})
              </button>
            ))}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto p-3">
            {!groups[openStatus]?.length && (
              <p className="rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-500">
                No {statusLabels[openStatus].toLowerCase()} templates.
              </p>
            )}
            {(groups[openStatus] || []).map((item) => (
              <button
                key={templateIdentifier(item) || templateText(item, "name", "saved-template")}
                type="button"
                onClick={() => {
                  loadSavedTemplate(item);
                  setOpenStatus("");
                }}
                className={`w-full rounded-md border p-3 text-left hover:border-[#6c4cff] hover:bg-[#f6f3ff] ${
                  activeTemplateId === templateIdentifier(item)
                    ? "border-[#6c4cff] bg-[#f6f3ff]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <span className="block truncate text-sm font-black text-slate-900">{templateText(item, "name", "Untitled template")}</span>
                <span className="mt-1 block truncate text-xs font-medium text-slate-500">{templateText(item, "slug") || templateText(item, "subject") || item._id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CanvasViewSwitch = ({ value, onChange }) => {
  const items = [
    ["design", "Design"],
    ["html", "HTML"],
    ["amp", "AMP"],
    ["formHtml", "Form"]
  ];

  return (
    <div className="flex max-w-full overflow-x-auto rounded-md border border-[#dde5f0] bg-slate-50 p-1">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded px-3 py-1.5 text-xs font-black ${
            value === id
              ? "bg-white text-[#6c4cff] shadow-sm"
              : "text-slate-500 hover:bg-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

const TemplatePreviewWorkspace = ({ mode, setMode, preview, onBack }) => {
  const [device, setDevice] = useState("mobile");
  const previewMarkup = replaceSampleValues(preview?.[mode] || preview?.html || "");
  const labels = {
    html: "HTML",
    amp: "AMP"
  };

  return (
    <section className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <header className="grid min-h-14 grid-cols-[minmax(160px,1fr)_auto_minmax(160px,1fr)] items-center border-b border-[#dde5f0] bg-white px-4">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <span className="text-lg leading-none">&larr;</span>
            Back to Editor
          </button>
        </div>

        <div className="flex overflow-hidden rounded-md border border-[#d8e0ea] bg-white">
          {["html", "amp"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`px-5 py-2 text-sm font-semibold ${
                mode === item ? "bg-slate-50 text-[#6c4cff]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {labels[item]}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => alert("Test email sending can be connected to your backend endpoint.")}
            className="rounded-md bg-[#6c4cff] px-5 py-2 text-sm font-bold text-white hover:bg-[#5b3ded]"
          >
            Send Test Email
          </button>
        </div>
      </header>

      <div className="border-b border-[#dde5f0] bg-white/80 px-4 py-3 text-center text-sm text-slate-700">
        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 text-[10px] font-black">i</span>
        This is a tentative preview and it may vary in certain email clients like Outlook and Yahoo.
      </div>

      <main className="mx-auto max-w-[1180px] px-4 py-6">
        <RealMailPreviewSection
          device={device}
          setDevice={setDevice}
          markup={previewMarkup}
        />
      </main>
    </section>
  );
};

const RealMailPreviewSection = ({ device, setDevice, markup }) => {
  const isMobile = device === "mobile";

  return (
    <section className="rounded-lg border border-[#d8e0ea] bg-white shadow-[0_16px_44px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 border-b border-[#d8e0ea] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-950">Real Mail View</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Preview the email inside a desktop or mobile mail reader.
          </p>
        </div>

        <div className="inline-flex w-full rounded-md border border-[#d8e0ea] bg-slate-50 p-1 sm:w-auto">
          {["desktop", "mobile"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDevice(item)}
              className={`flex-1 rounded px-4 py-2 text-xs font-black capitalize sm:flex-none ${
                device === item
                  ? "bg-white text-[#6c4cff] shadow-sm"
                  : "text-slate-500 hover:bg-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#edf1f7] p-3 sm:p-6">
        <div
          className={`mx-auto overflow-hidden bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] ${
            isMobile
              ? "max-w-[390px] rounded-[28px] border-[10px] border-slate-950"
              : "max-w-[960px] rounded-lg border border-slate-200"
          }`}
        >
          <MailChrome device={device} />
          <iframe
            title={`${device} real mail preview`}
            srcDoc={markup}
            className="block w-full border-0 bg-white"
            style={{
              height: isMobile ? "680px" : "640px"
            }}
          />
          {isMobile && (
            <div className="flex items-center justify-center gap-3 border-t border-slate-200 bg-[#f8eef5] px-4 py-4">
              <button type="button" className="min-h-10 flex-1 rounded-full bg-[#76586d] px-4 text-sm font-black text-white">
                Reply
              </button>
              <button type="button" className="min-h-10 flex-1 rounded-full bg-[#76586d] px-4 text-sm font-black text-white">
                Forward
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const MailChrome = ({ device }) => {
  const isMobile = device === "mobile";

  return (
    <div className={isMobile ? "bg-[#f8eef5]" : "bg-white"}>
      {isMobile ? (
        <>
          <div className="flex h-9 items-center justify-between px-4 text-xs font-bold text-slate-700">
            <span>10:42</span>
            <span>5G+ 55%</span>
          </div>
          <div className="flex h-14 items-center justify-between border-b border-[#eadce6] px-4 text-slate-800">
            <span className="text-2xl leading-none">&larr;</span>
            <div className="flex items-center gap-5 text-lg">
              <span>□</span>
              <span>⌫</span>
              <span>✉</span>
              <span>⋮</span>
            </div>
          </div>
        </>
      ) : (
        <div className="border-b border-slate-200">
          <div className="flex h-12 items-center gap-3 bg-slate-50 px-4">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <div className="ml-3 h-7 flex-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold leading-7 text-slate-500">
              Mail preview
            </div>
          </div>
          <div className="flex min-h-14 items-center justify-between px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">Preview subject</p>
              <p className="truncate text-xs font-medium text-slate-500">demo@example.com</p>
            </div>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LiveCanvasPreview = ({ markup, rawMarkup, mode, viewport }) => {
  const labels = {
    html: "HTML Email",
    amp: "AMP Email",
    formHtml: "AMP Web Form"
  };
  const isMobile = viewport === "mobile";

  return (
    <section className="min-h-[calc(100vh-97px)] bg-[#f4f6f9] p-4">
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Live canvas output: {labels[mode] || "Preview"}
        </p>
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([rawMarkup || ""], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${mode}-template.html`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
        >
          Export
        </button>
      </div>
      <div className={isMobile ? "preview-mobile mx-auto max-w-[410px] rounded bg-white p-3 shadow-sm" : "preview-desktop rounded bg-white shadow-sm"}>
        <iframe
          title={`${labels[mode] || "Live"} canvas output`}
          srcDoc={markup}
          className={`block w-full bg-white ${isMobile ? "h-[680px]" : "h-[calc(100vh-170px)]"}`}
        />
      </div>
    </section>
  );
};

const DesignSearchChips = () => (
  <div>
    <input
      readOnly
      value=""
      placeholder="Search by keywords or use cases"
      className="h-9 w-full rounded border border-[#d5deea] bg-white px-3 text-xs text-slate-500 outline-none"
    />
    <div className="mt-6 flex flex-wrap gap-2">
      {["All", "Header", "Hero", "Editorial", "Highlights", "E-commerce", "Gallery", "Footer"].map((chip) => (
        <span key={chip} className={`rounded-full border px-4 py-2 text-sm font-medium ${
          chip === "All"
            ? "border-[#6c4cff] text-[#6c4cff]"
            : "border-[#d5deea] text-slate-700"
        }`}>
          {chip}
        </span>
      ))}
    </div>
  </div>
);

const designSections = [
  {
    title: "Header",
    items: [
      { type: "navbar", label: "Simple nav" },
      { type: "logoHeader", label: "Logo header" }
    ]
  },
  {
    title: "Hero",
    items: [
      { type: "hero", label: "Fashion hero", media: "warm" },
      { type: "card", label: "Influencer card", media: "blue" }
    ]
  },
  {
    title: "Editorial",
    items: [
      { type: "card", label: "Travel story", media: "travel" },
      { type: "twoColumn", label: "Article grid", media: "cards" }
    ]
  },
  {
    title: "Highlights",
    items: [
      { type: "productList", label: "Must-read picks", media: "list" },
      { type: "testimonial", label: "Customer quote", media: "quote" },
      { type: "form", label: "Acolyte Living", media: "list", slug: "acolyte-living" }
    ]
  }
];

const DesignGallery = ({ loadTemplate }) => (
  <div className="space-y-6">
    {designSections.map((section) => (
      <div key={section.title}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">{section.title}</p>
          <button type="button" className="text-xs font-medium text-[#6c4cff]">See all</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {section.items.map((item) => (
            <button
              key={`${section.title}-${item.label}`}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("component/type", item.type);
                event.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => {
                let template;
                if (item.slug) {
                  template = predefinedTemplates.find((entry) => entry.slug === item.slug);
                }

                if (!template) {
                  template = predefinedTemplates.find((entry) => entry.sourceJson.blocks?.some((block) => block.type === item.type)) || predefinedTemplates[0];
                }

                loadTemplate(template);
              }}
              className="cursor-grab overflow-hidden rounded border border-[#d5deea] bg-white p-2 text-left hover:border-[#6c4cff] hover:bg-[#f6f3ff] active:cursor-grabbing"
            >
              <DesignPreview media={item.media} />
              <span className="sr-only">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const DesignPreview = ({ media }) => {
  if (media === "warm") {
    return (
      <div className="h-36 rounded bg-[#f2dfcf] p-3">
        <div className="mx-auto h-20 w-20 rounded-full bg-[#c25236]" />
        <div className="mt-3 rounded bg-white p-2 text-center shadow-sm">
          <div className="mx-auto h-2 w-16 rounded bg-slate-800" />
          <div className="mx-auto mt-2 h-2 w-20 rounded bg-slate-300" />
        </div>
      </div>
    );
  }

  if (media === "blue") {
    return (
      <div className="h-36 rounded bg-[#f6f0df] p-3">
        <div className="mb-2 h-3 w-20 rounded bg-slate-800" />
        <div className="h-20 rounded bg-gradient-to-br from-cyan-200 to-sky-500" />
        <div className="mt-2 h-3 rounded bg-indigo-500" />
      </div>
    );
  }

  if (media === "travel") {
    return (
      <div className="h-36 rounded bg-sky-100 p-3">
        <div className="h-20 rounded bg-gradient-to-br from-orange-200 via-rose-200 to-sky-200" />
        <div className="-mt-4 mx-auto rounded bg-white p-2 shadow-sm">
          <div className="h-2 w-20 rounded bg-slate-800" />
          <div className="mt-2 h-2 rounded bg-slate-300" />
        </div>
      </div>
    );
  }

  if (media === "cards") {
    return (
      <div className="grid h-36 grid-cols-2 gap-2 rounded bg-slate-100 p-3">
        {[1, 2].map((item) => (
          <div key={item} className="rounded bg-white p-2">
            <div className="h-8 rounded bg-slate-200" />
            <div className="mt-2 h-2 rounded bg-slate-700" />
            <div className="mt-2 h-2 rounded bg-slate-300" />
          </div>
        ))}
      </div>
    );
  }

  if (media === "list") {
    return (
      <div className="h-36 rounded bg-white p-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="mb-2 flex gap-2">
            <div className="h-6 w-6 rounded bg-amber-100" />
            <div className="flex-1">
              <div className="h-2 rounded bg-slate-700" />
              <div className="mt-1 h-2 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <ComponentGraphic type="card" large />;
};

const WidgetGallery = ({ labels, addBlock }) => {
  const sections = [
    {
      title: "Ratings",
      items: [
        { type: "poll", label: "Poll", preview: "poll" },
        { type: "rating", label: "Thumbs up or down", preview: "thumbs" }
      ]
    },
    {
      title: "Gamification",
      items: [
        { type: "quiz", label: "Quiz", preview: "quiz" },
        { type: "nps", label: "Spin the wheel", preview: "wheel" }
      ]
    },
    {
      title: "Media",
      items: [
        { type: "carousel", label: "Image carousel", preview: "carousel" }
      ]
    },
    {
      title: "E-commerce",
      items: [
        { type: "productList", label: "Shopify Product Catalog", preview: "catalog" },
        { type: "productCard", label: "Abandoned checkout", preview: "checkout" }
      ]
    }
  ];

  return (
    <div className="space-y-5">
      <SectionNotice text="Widgets will be added to mobile and desktop." />
      <input readOnly value="" placeholder="Search by widget name" className="h-9 w-full rounded border border-[#d5deea] bg-white px-3 text-xs text-slate-500 outline-none" />
      <div className="flex flex-wrap gap-2">
        {["All", "Ratings", "Gamification", "Media", "Real time updates", "Scheduling", "E-commerce"].map((chip) => (
          <span key={chip} className="rounded-full border border-[#d5deea] px-3 py-1.5 text-sm font-medium text-slate-700 first:border-[#6c4cff] first:text-[#6c4cff]">
            {chip}
          </span>
        ))}
      </div>
      {sections.map((section) => (
        <div key={section.title}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{section.title}</p>
            <button type="button" className="text-xs font-bold text-indigo-600">See all</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {section.items.map((item) => (
            <button
              key={item.label}
              type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("component/type", item.type);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => addBlock(item.type)}
              className="cursor-grab overflow-hidden rounded border border-[#d5deea] bg-white text-left hover:border-[#6c4cff] hover:bg-[#f6f3ff] active:cursor-grabbing"
            >
                <div className="border-b border-[#d5deea] bg-[#f8fbff] p-3">
                  <WidgetPreview kind={item.preview} />
                </div>
                <span className="block truncate px-3 py-2 text-xs font-medium text-slate-700">
                  {item.label || labels[item.type] || item.type}
                </span>
            </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const FormsGallery = ({ labels, addBlock }) => {
  const [mode, setMode] = useState("simple");
  const forms = [
    { type: "eligibilityForm", title: "Eligibility Check" },
    { type: "form", title: "Event Registration" },
    { type: "productFeedback", title: "Referral" },
    { type: "survey", title: "Feedback Survey" },
    { type: "appointment", title: "Appointment Booking" }
  ];

  return (
    <div className="space-y-5">
      <SectionNotice text="Forms will be added to mobile and desktop." />
      <div className="flex gap-2">
        {["simple", "advanced"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-full border px-4 py-2 text-sm font-medium capitalize ${
              mode === item
                ? "border-[#6c4cff] text-[#6c4cff]"
                : "border-[#d5deea] text-slate-700"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-slate-700">
        Designed for straightforward use cases like lead generation, NPS survey, feedback collection, etc.
        <span className="block font-semibold text-[#6c4cff]">Learn more</span>
      </p>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">Start from scratch</p>
        <button
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("component/type", "form");
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => addBlock("form")}
          className="w-full cursor-grab rounded border border-[#d5deea] bg-white p-2 text-left hover:border-[#6c4cff] hover:bg-[#f6f3ff] active:cursor-grabbing"
        >
          <StartFormPreview />
        </button>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">Prebuilt Forms</p>
        <div className="space-y-3">
          {forms.map((form) => (
            <button
              key={form.title}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("component/type", form.type);
                event.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => addBlock(form.type)}
              className="w-full cursor-grab rounded border border-[#d5deea] bg-white p-5 text-left hover:border-[#6c4cff] hover:bg-[#f6f3ff] active:cursor-grabbing"
            >
              <p className="mb-4 text-lg font-black text-slate-700">{form.title}</p>
              <FormPreview variant={form.type} />
              <span className="sr-only">{labels[form.type] || form.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StartFormPreview = () => (
  <div className="rounded bg-[#f8fbff] p-4">
    <div className="mx-auto h-2 w-32 rounded bg-slate-300" />
    <div className="mx-auto mt-4 h-2 w-48 rounded bg-slate-300" />
    <div className="mt-5 rounded bg-[#edf2f8] p-3">
      <div className="flex justify-center gap-3 text-[9px] text-slate-500">
        {["Input", "Select", "Radio", "Checkbox", "Email"].map((item) => (
          <span key={item} className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
            {item}
          </span>
        ))}
      </div>
    </div>
    <div className="mt-4 h-3 w-14 rounded bg-slate-300" />
  </div>
);

const FormPreview = ({ variant }) => {
  if (variant === "eligibilityForm") {
    return (
      <div className="rounded-lg border border-slate-400 bg-[#292b28] p-4">
        <div className="mx-auto mb-3 flex w-14 items-center justify-center gap-1">
          <span className="h-1.5 w-5 rounded-full bg-[#b84cff]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#b7c4c8]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#b7c4c8]" />
        </div>
        <div className="mx-auto h-3 w-32 rounded bg-[#b84cff]" />
        <div className="mx-auto mt-2 h-2 w-40 rounded bg-[#d8d2bf]" />
        <div className="mt-5 space-y-3">
          <div>
            <div className="mb-1 h-2 w-24 rounded bg-[#d8d2bf]" />
            <div className="h-9 rounded border border-[#4b4f4d] bg-transparent" />
            <div className="mt-1 h-2 w-32 rounded bg-[#8c9497]" />
          </div>
          <div>
            <div className="mb-1 h-2 w-24 rounded bg-[#d8d2bf]" />
            <div className="h-9 rounded border border-[#4b4f4d] bg-transparent" />
            <div className="mt-1 h-2 w-36 rounded bg-[#8c9497]" />
          </div>
        </div>
        <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span className="h-px bg-[#525654]" />
          <span className="text-[9px] font-bold text-[#b8b0a1]">Instant results</span>
          <span className="h-px bg-[#525654]" />
        </div>
        <div className="h-9 rounded border border-[#626866] bg-transparent" />
      </div>
    );
  }

  if (variant === "productFeedback") {
    return (
      <div className="space-y-3">
        <div className="h-9 rounded border border-slate-300 bg-white" />
        <div className="h-9 rounded border border-slate-300 bg-white" />
        <div className="h-24 rounded border border-slate-300 bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-9 rounded border border-slate-300 bg-white" />
      <div className="grid grid-cols-[0.55fr_1fr] gap-2">
        <div className="h-8 rounded-full bg-emerald-400" />
        <div className="h-8 rounded-full border border-slate-300 bg-slate-50" />
      </div>
      <div className="grid grid-cols-[1fr_0.72fr] gap-2">
        <div className="h-8 rounded-full border border-slate-300 bg-slate-50" />
        <div className="h-8 rounded-full border border-slate-300 bg-slate-50" />
      </div>
      <div className="h-10 rounded border border-slate-300 bg-white" />
      <div className="h-10 w-24 rounded bg-emerald-500" />
    </div>
  );
};

const WidgetPreview = ({ kind }) => {
  if (kind === "poll") {
    return <div className="space-y-2"><div className="h-2 w-20 rounded bg-slate-300" /><BarMock w="80%" c="bg-violet-200" /><BarMock w="55%" c="bg-slate-200" /><BarMock w="70%" c="bg-slate-200" /></div>;
  }
  if (kind === "thumbs") {
    return <div className="space-y-5"><div className="h-2 w-24 rounded bg-slate-300" /><div className="flex justify-center gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 text-emerald-500">♡</span><span className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-300 text-rose-500">♡</span></div></div>;
  }
  if (kind === "quiz") {
    return <div className="space-y-2"><div className="h-2 w-24 rounded bg-slate-300" /><div className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[9px] text-emerald-600">✓ Correct answer!</div><div className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-[9px] text-rose-500">× Option 2</div></div>;
  }
  if (kind === "wheel") {
    return <div className="flex justify-center"><div className="h-20 w-20 rounded-full border-[14px] border-slate-300 border-l-blue-600 border-t-amber-400 bg-white" /></div>;
  }
  if (kind === "carousel") {
    return <div className="flex flex-col items-center"><div className="relative h-20 w-28 rounded border border-slate-300 bg-white"><span className="absolute -left-2 top-8 h-3 w-3 rounded-full bg-violet-300" /><span className="absolute -right-2 top-8 h-3 w-3 rounded-full bg-violet-300" /><Image size={18} className="mx-auto mt-7 text-violet-400" /></div><div className="mt-2 h-5 w-10 rounded bg-slate-300" /></div>;
  }
  if (kind === "catalog" || kind === "checkout") {
    return <div className="space-y-2"><div className="h-2 w-16 rounded bg-slate-300" />{[1, 2].map((item) => <div key={item} className="flex items-center gap-2 rounded bg-white p-1"><div className="h-5 w-5 rounded bg-slate-200" /><div className="h-2 flex-1 rounded bg-slate-300" /><div className="h-4 w-4 rounded border border-slate-300" /></div>)}</div>;
  }
  return <ComponentGraphic type="card" large />;
};

const BarMock = ({ w, c }) => <div className="h-4 rounded border border-slate-300 bg-white p-0.5"><div className={`h-full rounded ${c}`} style={{ width: w }} /></div>;

const QuickBlockGrid = ({ title, description, items, labels, addBlock }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <div className="mb-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {items.map((type) => (
        <button
          key={type}
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("component/type", type);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => addBlock(type)}
          className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-indigo-300 hover:bg-indigo-50"
        >
          <ComponentGraphic type={type} />
          <span className="mt-2 block truncate text-xs font-bold text-slate-800">
            {labels[type] || type}
          </span>
        </button>
      ))}
    </div>
  </div>
);

const ComponentLibrary = ({
  addBlock,
  componentGroups: groups = componentGroups,
  componentLabels: labels = componentLabels
}) => {
  const textTypes = ["heading", "text", "textSection"];
  const elementTypes = ["button", "image", "divider", "spacer", "social", "bullet", "number", "table", "card"];
  const layoutTypes = ["hero", "card", "twoColumn", "productCard", "testimonial", "offer", "footer", "productList"];

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xl font-black text-slate-900">Elements & layouts</h4>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Drag and drop elements & layouts to design your email from scratch
        </p>
      </div>

      <ElementGrid
        title="Text"
        items={textTypes}
        labels={labels}
        addBlock={addBlock}
      />

      <ElementGrid
        title="Elements"
        items={elementTypes}
        labels={labels}
        addBlock={addBlock}
      />

      <ElementGrid
        title="Pre-made layouts"
        items={layoutTypes}
        labels={labels}
        addBlock={addBlock}
        large
      />
    </div>
  );
};

const ElementGrid = ({ title, items, labels, addBlock, large = false }) => (
  <div>
    <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
    <div className="grid grid-cols-3 gap-3">
      {items.map((type) => (
        <button
          key={type}
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("component/type", type);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => addBlock(type)}
          className="flex h-[74px] cursor-grab flex-col items-center justify-center rounded border border-[#d5deea] bg-white p-2 text-center hover:border-[#6c4cff] hover:bg-[#f6f3ff] active:cursor-grabbing"
        >
          <ElementIcon type={type} />
          <span className="mt-2 block truncate text-[11px] font-semibold text-slate-700">
            {elementLabel(type, labels)}
          </span>
        </button>
      ))}
      {!items.length && (
        <p className="col-span-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-500">
          No items match your search.
        </p>
      )}
    </div>
  </div>
);

const elementLabel = (type, labels) => {
  const map = {
    heading: "Heading",
    text: "Paragraph",
    button: "Button",
    image: "Image",
    divider: "Divider",
    spacer: "Spacer",
    social: "Social",
    bullet: "Bullet",
    number: "Number",
    table: "Table",
    card: "Element set",
    textSection: "Text"
  };

  return map[type] || labels[type] || type;
};

const ElementIcon = ({ type }) => {
  const iconClass = "text-slate-500";
  const map = {
    heading: Type,
    text: AlignJustify,
    button: MousePointer2,
    image: Image,
    divider: Minus,
    spacer: Space,
    social: Grid2X2,
    bullet: List,
    number: ListOrdered,
    table: Table2,
    card: Library,
    textSection: Type,
    hero: AlignJustify,
    twoColumn: Grid2X2,
    productCard: Image,
    testimonial: AlignJustify,
    offer: MousePointer2,
    footer: MousePointer2,
    productList: Table2
  };
  const Icon = map[type] || Grid2X2;

  return <Icon size={22} strokeWidth={1.8} className={iconClass} />;
};

const SavedBlockLibrary = ({ savedBlocks, addSavedBlock }) => (
  <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <div className="mb-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Saved Blocks</p>
      <p className="text-xs text-slate-500">Reusable blocks saved from the editor.</p>
    </div>
    <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
      {savedBlocks.length === 0 && (
        <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">No saved blocks yet.</p>
      )}
      {savedBlocks.map((savedBlock) => (
        <button
          key={savedBlock._id}
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("saved-block/id", savedBlock._id);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => addSavedBlock(savedBlock)}
          className="w-full cursor-grab rounded-md border border-slate-200 px-3 py-2 text-left hover:border-emerald-400 hover:bg-emerald-50 active:cursor-grabbing"
        >
          <span className="block text-sm font-semibold text-slate-800">{displayText(savedBlock.name, "Saved block")}</span>
          <span className="block text-xs text-slate-500">{displayText(savedBlock.type)}</span>
        </button>
      ))}
    </div>
  </div>
);

const templateCategories = ["All", ...new Set(predefinedTemplates.map((template) => template.category))];

const TemplatesHomePage = ({
  templates,
  loading,
  error,
  onNewTemplate,
  onLoadSavedTemplate
}) => {
  const visibleTemplates = Array.isArray(templates) ? templates : [];

  return (
    <section className="min-h-[calc(100vh-92px)] rounded-lg border border-slate-200 bg-[#f8fafc] shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f766e]">Templates</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
              Your saved templates
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Templates you create and save will appear here as cards. Open one to edit it, or create a new blank template.
            </p>
          </div>

          <button
            type="button"
            onClick={onNewTemplate}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,118,110,0.24)] transition hover:bg-[#115e59]"
          >
            <FilePlus2 size={18} />
            New Template
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Template Library</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading your templates..." : `${visibleTemplates.length} saved template${visibleTemplates.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            Templates could not be fetched: {error}
          </div>
        )}

        {visibleTemplates.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleTemplates.map((item) => (
              <button
                key={templateIdentifier(item) || templateText(item, "name", "saved-template")}
                type="button"
                onClick={() => onLoadSavedTemplate(item)}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:shadow-[0_18px_36px_rgba(15,23,42,0.10)]"
              >
                <SavedTemplateCardImage template={item} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-950">{templateText(item, "name", "Saved template")}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{templateText(item, "subject", "No subject")}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-black uppercase tracking-wide text-slate-500 group-hover:bg-[#e7f7f5] group-hover:text-[#0f766e]">
                      Open
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
                    <span className="capitalize">{templateText(item, "status", "draft")}</span>
                    <span>{templateText(item, "slug", "template")}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
            <div className="max-w-md">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#e7f7f5] text-[#0f766e]">
                <FilePlus2 size={24} />
              </span>
              <h2 className="mt-4 text-xl font-black text-slate-950">No saved templates yet</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create and save your first template, then it will show here as an image card.
              </p>
              <button
                type="button"
                onClick={onNewTemplate}
                className="mt-5 rounded-md bg-[#0f766e] px-5 py-3 text-sm font-black text-white transition hover:bg-[#115e59]"
              >
                Create Template
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const findTemplateImage = (blocks = []) => {
  for (const block of blocks) {
    if (block?.type === "image" && block.props?.src) {
      return block.props.src;
    }

    const nestedBlocks = [
      ...(Array.isArray(block?.blocks) ? block.blocks : []),
      ...(Array.isArray(block?.children) ? block.children : []),
      ...(Array.isArray(block?.props?.blocks) ? block.props.blocks : [])
    ];

    if (nestedBlocks.length) {
      const nestedImage = findTemplateImage(nestedBlocks);

      if (nestedImage) {
        return nestedImage;
      }
    }
  }

  return "";
};

const extractHtmlImage = (html = "") => {
  const match = String(html).match(/<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
  return match?.[1] || match?.[2] || match?.[3] || "";
};

const SavedTemplateCardImage = ({ template }) => {
  const sourceJson = template?.sourceJson;
  const imageSrc = templateText(template, "thumbnail")
    || templateText(template, "previewImage")
    || templateText(template, "image")
    || findTemplateImage(sourceJson?.blocks || [])
    || extractHtmlImage(template?.html);

  if (imageSrc) {
    return (
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={templateText(template, "name", "Template preview")}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  if (sourceJson) {
    return (
      <div className="aspect-[4/3] bg-slate-100 p-3">
        <TemplateMiniPreview sourceJson={sourceJson} />
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,#e7f7f5_0%,#eef2ff_100%)] p-5">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#0f766e] shadow-sm">
          <Library size={22} />
        </span>
        <p className="mt-3 text-sm font-black text-slate-700">Template</p>
      </div>
    </div>
  );
};

const TemplateGallery = ({ loadTemplate }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const filteredTemplates = activeCategory === "All"
    ? predefinedTemplates
    : predefinedTemplates.filter((template) => template.category === activeCategory);
  const [activeTemplate, setActiveTemplate] = useState(predefinedTemplates[0]);

  useEffect(() => {
    setActiveTemplate(filteredTemplates[0] || predefinedTemplates[0]);
  }, [activeCategory]);

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Templates</p>
          <p className="text-xs text-slate-500">Ready layouts you can customize.</p>
        </div>
        <button
          type="button"
          onClick={() => loadTemplate(activeTemplate)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
        >
          Use
        </button>
      </div>

      <div className="mb-3 flex gap-1 overflow-x-auto">
        {templateCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
              activeCategory === category
                ? "bg-emerald-700 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-2">
        <TemplateMiniPreview sourceJson={activeTemplate.sourceJson} />
        <p className="mt-2 text-sm font-bold text-slate-900">{templateText(activeTemplate, "name")}</p>
        <p className="text-xs text-slate-500">{templateText(activeTemplate, "category")}</p>
      </div>

      <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
        {filteredTemplates.map((item) => (
          <button
            key={templateText(item, "slug", templateText(item, "name", "template"))}
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("template/predefined-slug", templateText(item, "slug"));
              event.dataTransfer.effectAllowed = "copy";
            }}
            onMouseEnter={() => setActiveTemplate(item)}
            onFocus={() => setActiveTemplate(item)}
            onClick={() => loadTemplate(item)}
            className={`w-full cursor-grab rounded-md border px-3 py-2 text-left active:cursor-grabbing ${
              templateText(activeTemplate, "slug") === templateText(item, "slug")
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <span className="block text-sm font-semibold text-slate-800">{templateText(item, "name")}</span>
            <span className="block text-xs text-slate-500">{templateText(item, "subject")}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TemplateMiniPreview = ({ sourceJson }) => {
  const theme = sourceJson.theme || {};

  return (
    <div
      className="h-32 overflow-hidden rounded border border-slate-200 p-2"
      style={{ backgroundColor: theme.contentColor || "#ffffff" }}
    >
      {(sourceJson.blocks || []).slice(0, 4).map((block) => {
        if (block.type === "heading") {
          return <div key={block.id} className="mb-2 h-3 w-3/4 rounded bg-slate-800" />;
        }

        if (block.type === "text") {
          return <div key={block.id} className="mb-2 h-2 w-full rounded bg-slate-300" />;
        }

        if (block.type === "form") {
          return (
            <div key={block.id} className="mb-2 rounded border border-slate-200 p-2">
              <div className="mb-1 h-2 w-16 rounded bg-slate-700" />
              <div className="mb-1 h-3 rounded border border-slate-200 bg-white" />
              <div className="h-3 w-14 rounded bg-emerald-600" />
            </div>
          );
        }

        if (block.type === "button") {
          return <div key={block.id} className="mb-2 h-4 w-20 rounded bg-emerald-600" />;
        }

        if (block.type === "card") {
          return (
            <div key={block.id} className="mb-2 rounded bg-slate-100 p-2">
              <div className="mb-1 h-2 w-20 rounded bg-slate-700" />
              <div className="h-2 w-full rounded bg-slate-300" />
            </div>
          );
        }

        return <div key={block.id} className="mb-2 h-2 rounded bg-slate-200" />;
      })}
    </div>
  );
};

const ComponentLibraryCard = ({ type, active, addBlock, setActiveType, label }) => (
  <button
    type="button"
    draggable
    onDragStart={(event) => {
      event.dataTransfer.setData("component/type", type);
      event.dataTransfer.effectAllowed = "copy";
    }}
    onMouseEnter={() => setActiveType(type)}
    onFocus={() => setActiveType(type)}
    onClick={() => addBlock(type)}
    className={`mx-2 mb-2 cursor-grab rounded-md border bg-white p-2 text-left hover:border-emerald-400 hover:bg-emerald-50 active:cursor-grabbing ${
      active ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-300"
    }`}
  >
    <ComponentGraphic type={type} />
    <span className="mt-2 block text-xs font-bold text-slate-800">
      {label || componentLabels[type] || type}
    </span>
    <span className="block truncate text-[11px] text-slate-500">
      {componentDescriptions[type] || "Component"}
    </span>
  </button>
);

const ComponentGraphic = ({ type, large = false }) => {
  const base = `${large ? "h-28" : "h-16"} rounded border border-slate-200 bg-slate-50 p-2`;

  if (type === "heading") {
    return <div className={base}><div className="h-3 w-10 rounded bg-slate-800" /><div className="mt-2 h-2 w-16 rounded bg-slate-300" /></div>;
  }

  if (type === "text") {
    return <div className={base}><div className="h-2 w-full rounded bg-slate-300" /><div className="mt-2 h-2 w-5/6 rounded bg-slate-300" /><div className="mt-2 h-2 w-2/3 rounded bg-slate-300" /></div>;
  }

  if (type === "button") {
    return <div className={`${base} flex items-center justify-center`}><div className={`${large ? "px-8 py-3 text-xs" : "px-5 py-2 text-[10px]"} rounded bg-emerald-600 font-bold text-white`}>CTA</div></div>;
  }

  if (type === "image") {
    return <div className={`${base} overflow-hidden`}><div className="h-full rounded bg-gradient-to-br from-sky-200 to-emerald-200" /><div className="-mt-5 ml-2 h-3 w-3 rounded-full bg-white/80" /></div>;
  }

  if (["form", "leadForm", "contactForm", "registrationForm", "appointmentForm", "survey"].includes(type)) {
    return (
      <div className={base}>
        <div className={`${large ? "h-3 w-20" : "h-2 w-12"} rounded bg-slate-700`} />
        <div className={`${large ? "mt-3 h-5" : "mt-2 h-3"} rounded border border-slate-300 bg-white`} />
        <div className={`${large ? "mt-2 h-5" : "mt-1 h-3"} rounded border border-slate-300 bg-white`} />
        <div className={`${large ? "mt-3 h-5 w-24" : "mt-2 h-3 w-14"} rounded bg-emerald-600`} />
      </div>
    );
  }

  if (["card", "hero", "offer", "coupon", "twoColumn"].includes(type)) {
    return (
      <div className={`${base} bg-white`}>
        <div className="h-full rounded border border-slate-200 bg-slate-50 p-2">
          <div className={`${large ? "h-3 w-28" : "h-2 w-14"} rounded bg-slate-800`} />
          <div className={`${large ? "mt-3 h-2" : "mt-2 h-2"} w-full rounded bg-slate-300`} />
          <div className={`${large ? "mt-3 h-2" : "mt-2 h-2"} w-2/3 rounded bg-slate-300`} />
          {large && <div className="mt-4 h-6 w-24 rounded bg-emerald-600" />}
        </div>
      </div>
    );
  }

  if (type === "social") {
    return <div className={`${base} flex items-center justify-center gap-2`}><span className="h-5 w-5 rounded-full bg-blue-500" /><span className="h-5 w-5 rounded-full bg-pink-500" /><span className="h-5 w-5 rounded-full bg-sky-600" /></div>;
  }

  if (type === "footer") {
    return <div className={`${base} flex items-center justify-center`}><div className="text-[10px] font-semibold text-emerald-700 underline">Unsubscribe</div></div>;
  }

  if (type === "rawHtml") {
    return <div className={`${base} font-mono text-[11px] text-slate-600`}>&lt;html&gt;<br />&nbsp;...<br />&lt;/html&gt;</div>;
  }

  if (type === "circle") {
    return <div className={`${base} flex items-center justify-center`}><div className={`${large ? "h-16 w-16" : "h-9 w-9"} rounded-full bg-emerald-600`} /></div>;
  }

  if (type === "pill") {
    return <div className={`${base} flex items-center justify-center`}><div className={`${large ? "h-10 w-28" : "h-7 w-16"} rounded-full bg-emerald-600`} /></div>;
  }

  if (type === "line" || type === "divider") {
    return <div className={`${base} flex items-center`}><div className="h-0.5 w-full bg-slate-400" /></div>;
  }

  if (type === "spacer") {
    return <div className={`${base} flex items-center justify-center`}><div className="h-10 w-full rounded border border-dashed border-slate-300" /></div>;
  }

  return <div className={`${base} flex items-center justify-center`}><div className="h-9 w-12 rounded bg-emerald-600" /></div>;
};

const LegacyBlockOutline = ({
  blocks,
  selectedBlockId,
  setSelectedBlockId,
  handleBuilderDrop
}) => (
  <div className="mt-5">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Outline</p>
      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">{blocks.length}</span>
    </div>
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <DropZone index={0} handleBuilderDrop={handleBuilderDrop} compact />
      {blocks.map((block, index) => (
        <React.Fragment key={block.id}>
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("block/id", block.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => setSelectedBlockId(block.id)}
            className={`w-full cursor-grab rounded-md border px-3 py-2 text-left text-sm active:cursor-grabbing ${
              selectedBlockId === block.id
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="font-semibold">{index + 1}. {block.type}</span>
            <span className="block truncate text-xs text-slate-500">
              {block.props?.text || block.props?.title || block.props?.src || block.id}
            </span>
          </button>
          <DropZone index={index + 1} handleBuilderDrop={handleBuilderDrop} compact />
        </React.Fragment>
      ))}
    </div>
  </div>
);

const SelectedBlockPanel = ({
  selectedBlock,
  moveBlock,
  removeBlock,
  duplicateBlock,
  copyBlock,
  pasteBlock,
  canPaste,
  undo,
  redo,
  canUndo,
  canRedo,
  updateBlockProps,
  updateFormField,
  addFormField,
  removeFormField,
  saveSelectedBlock,
  editorConfig
}) => (
  <div className="rounded-lg border border-slate-200 p-4 shadow-sm">
    <div className="mb-3 grid grid-cols-4 gap-2">
      <button type="button" disabled={!canUndo} onClick={undo} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-40">Undo</button>
      <button type="button" disabled={!canRedo} onClick={redo} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-40">Redo</button>
      <button type="button" disabled={!selectedBlock} onClick={() => selectedBlock && copyBlock(selectedBlock.id)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-40">Copy</button>
      <button type="button" disabled={!canPaste} onClick={pasteBlock} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-40">Paste</button>
    </div>
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Selected Block</p>
        <h3 className="mt-1 text-lg font-bold capitalize text-slate-900">
          {selectedBlock?.type || "No block"}
        </h3>
      </div>
      {selectedBlock && (
        <div className="flex gap-2">
          <button type="button" onClick={() => moveBlock(selectedBlock.id, -1)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">Up</button>
          <button type="button" onClick={() => moveBlock(selectedBlock.id, 1)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">Down</button>
          <button type="button" onClick={() => duplicateBlock(selectedBlock.id)} className="rounded-md border border-slate-300 px-2 py-1 text-sm">Duplicate</button>
          <button type="button" onClick={saveSelectedBlock} className="rounded-md border border-emerald-300 px-2 py-1 text-sm text-emerald-700">Save</button>
          <button type="button" onClick={() => removeBlock(selectedBlock.id)} className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-600">Delete</button>
        </div>
      )}
    </div>
    {selectedBlock && (
      <div className="space-y-4">
        <VisibilityEditor
          block={selectedBlock}
          updateBlockProps={updateBlockProps}
          editorConfig={editorConfig}
        />
        <BlockEditor
          block={selectedBlock}
          updateBlockProps={updateBlockProps}
          updateFormField={updateFormField}
          addFormField={addFormField}
          removeFormField={removeFormField}
          editorConfig={editorConfig}
        />
      </div>
    )}
  </div>
);

const VisibilityEditor = ({ block, updateBlockProps, editorConfig }) => {
  const visibility = block.props?.visibility || {};
  const variables = editorConfig?.variableGroups?.flatMap((group) => group.variables) || [
    "email",
    "firstName",
    "company",
    "plan"
  ];
  const operators = editorConfig?.visibilityOperators || [
    { value: "truthy", label: "exists" },
    { value: "equals", label: "equals" },
    { value: "notEquals", label: "does not equal" }
  ];
  const setVisibility = (patch) => {
    updateBlockProps(block.id, {
      visibility: {
        ...visibility,
        ...patch
      }
    });
  };

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-500">
        Visibility
      </summary>
      <div className="mt-3 grid gap-3">
        <label className="block text-sm font-semibold text-slate-700">
          Field
          <input
            list="builder-visibility-fields"
            value={visibility.field || ""}
            onChange={(event) => setVisibility({ field: event.target.value })}
            className={`mt-2 ${inputClass}`}
            placeholder="plan"
          />
          <datalist id="builder-visibility-fields">
            {variables.map((variable) => (
              <option key={variable} value={variable} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Operator
          <select
            value={visibility.operator || "truthy"}
            onChange={(event) => setVisibility({ operator: event.target.value })}
            className={`mt-2 ${inputClass}`}
          >
            {operators.map((operator) => (
              <option key={operator.value} value={operator.value}>
                {operator.label}
              </option>
            ))}
          </select>
        </label>
        {(visibility.operator === "equals" || visibility.operator === "notEquals") && (
          <InputField
            label="Value"
            value={visibility.value || ""}
            onChange={(event) => setVisibility({ value: event.target.value })}
          />
        )}
        {visibility.field && (
          <button
            type="button"
            onClick={() => updateBlockProps(block.id, { visibility: undefined })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
          >
            Clear visibility rule
          </button>
        )}
      </div>
    </details>
  );
};

const LegacyEmailCanvas = ({
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
          onBlur={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
          style={{
            margin: block.type === "heading" ? "0 0 10px" : "0 0 14px",
            color: props.color || theme.textColor || "#111827",
            textAlign: props.align || "left",
            fontSize: `${props.fontSize || (block.type === "heading" ? 24 : 16)}px`,
            fontWeight: block.type === "heading" ? 700 : 400,
            lineHeight: props.lineHeight || 1.45,
            padding: getBoxPadding(props, "0")
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
        <ImageCanvasBlock
          block={block}
          selected={selected}
          updateBlockProps={updateBlockProps}
        />
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
          onBlur={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
          className="inline-block font-bold"
          style={{
            backgroundColor: props.backgroundColor || theme.primaryColor || "#178218",
            color: props.color || "#ffffff",
            borderRadius: `${props.radius || 6}px`,
            padding: props.padding || "13px 20px",
            fontSize: `${props.fontSize || 16}px`,
            width: props.width || props.buttonWidth || "auto",
            maxWidth: "100%",
            minHeight: props.height ? `${Number(props.height)}px` : undefined,
            boxSizing: "border-box"
          }}
        >
          {props.text || "Button"}
        </span>
        {actions}
      </div>
    );
  }

  if (["form", "poll", "survey", "rating", "nps", "appointment", "booking", "quiz", "productFeedback", "rsvp"].includes(block.type)) {
    const formBackgroundColor = props.formBackgroundTransparent ? "transparent" : (props.formBackgroundColor || "#ffffff");
    const inputBackgroundColor = props.inputBackgroundTransparent ? "transparent" : (props.inputBackgroundColor || "#f8fafc");
    const inputBorderStyle = `${Number(props.inputBorderWidth ?? 1)}px solid ${props.inputBorderColor || "#e2e8f0"}`;
    const buttonBackgroundColor = props.buttonBackgroundTransparent ? "transparent" : (props.buttonColor || props.backgroundColor || theme.primaryColor || "#178218");
    const trustBadges = Array.isArray(props.trustBadges) ? props.trustBadges : [];
    const showTitle = props.showTitle !== false;
    const showDescription = props.showDescription !== false;
    const hasHeader = showTitle || (showDescription && props.description);
    const fields = props.fields || props.questions || [];
    const updateInlineFieldLabel = (fieldIndex, value) => {
      if (!props.fields) {
        return;
      }

      updateBlockProps(block.id, {
        fields: props.fields.map((field, index) => (
          index === fieldIndex ? { ...field, label: value } : field
        ))
      });
    };

    return (
      <div {...dragProps} className={commonClass}>
        <div
          className="rounded-lg"
          style={{
            padding: props.padding || "18px",
            backgroundColor: formBackgroundColor,
            backgroundImage: props.backgroundImageUrl
              ? `${props.backgroundOverlayColor ? `linear-gradient(${props.backgroundOverlayColor}, ${props.backgroundOverlayColor}), ` : ""}url("${props.backgroundImageUrl}")`
              : undefined,
            backgroundSize: props.backgroundImageSize || "cover",
            backgroundPosition: props.backgroundImagePosition || "center",
            backgroundRepeat: props.backgroundImageRepeat || "no-repeat",
            border: `${Number(props.borderWidth ?? 1)}px solid ${props.borderColor || "#e2e8f0"}`,
            borderTop: props.topAccentColor ? `${Number(props.topAccentWidth ?? 4)}px solid ${props.topAccentColor}` : undefined,
            borderRadius: `${props.radius || 8}px`
          }}
        >
          {props.progressDots && (
            <div className="mb-4 flex items-center justify-center gap-2">
              <span
                className="h-2 rounded-full"
                style={{ width: 26, backgroundColor: props.progressColor || theme.primaryColor || "#6c4cff" }}
              />
              {[1, 2].map((item) => (
                <span
                  key={item}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: props.progressMutedColor || "#cbd5e1" }}
                />
              ))}
            </div>
          )}
          {showTitle && (
            <h3
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => updateBlockProps(block.id, { title: event.currentTarget.textContent })}
              className="mb-1 text-lg font-bold text-slate-900"
              style={{
                color: props.titleColor || "#020617",
                fontSize: `${props.titleSize || 18}px`,
                fontWeight: props.titleWeight || 800,
                textAlign: props.titleAlign || props.align || "left",
                marginTop: `${Number(props.titleTopGap ?? 0)}px`,
                marginBottom: `${Number(props.titleBottomGap ?? 0)}px`,
                paddingLeft: `${Number(props.titleIndent ?? 0)}px`
              }}
            >
              {props.title || "Form"}
            </h3>
          )}
          {showDescription && props.description && (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => updateBlockProps(block.id, { description: event.currentTarget.textContent })}
              className="mb-3 text-sm text-slate-500"
              style={{
                color: props.descriptionColor || props.textColor || "#64748b",
                fontSize: `${props.descriptionSize || props.textSize || 14}px`,
                fontWeight: props.descriptionWeight || props.textWeight || 400,
                textAlign: props.descriptionAlign || props.titleAlign || props.align || "left"
              }}
            >
              {props.description}
            </p>
          )}
          <div
            className="grid"
            style={{
              gap: `${Number(props.fieldGap ?? 10)}px`,
              marginTop: hasHeader ? `${Number(props.fieldTopGap ?? 14)}px` : 0
            }}
          >
            {fields.map((field, index) => (
              <label key={`${field.name}-${index}`} className="block text-sm font-semibold text-slate-700">
                <div style={{ textAlign: props.inputAlign || "left" }}>
                  <span
                    contentEditable={Boolean(props.fields)}
                    suppressContentEditableWarning
                    onBlur={(event) => updateInlineFieldLabel(index, event.currentTarget.textContent.replace(/\s\*$/, ""))}
                    className="inline-block rounded outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    style={{
                      width: props.inputWidth || "100%",
                      maxWidth: "100%",
                      textAlign: "left",
                      color: props.inputLabelColor || props.inputTextColor || "#64748b",
                      fontSize: `${props.inputFontSize || 14}px`,
                      fontWeight: props.inputFontWeight || 600
                    }}
                  >
                    {field.label || field.question || field.name}{field.required ? " *" : ""}
                  </span>
                </div>
                <div style={{ marginTop: `${Number(props.labelGap ?? 5)}px`, textAlign: props.inputAlign || "left" }}>
                  <div
                    className="border-slate-300"
                    style={{
                      display: "inline-block",
                      backgroundColor: inputBackgroundColor,
                      border: inputBorderStyle,
                      borderRadius: `${Number(props.inputRadius ?? 6)}px`,
                      width: props.inputWidth || "100%",
                      maxWidth: "100%",
                      minHeight: `${Number(props.inputHeight ?? 40)}px`,
                      color: props.inputValueColor || props.inputTextColor || "#64748b",
                      fontSize: `${props.inputFontSize || 14}px`,
                      fontWeight: props.inputFontWeight || 600
                    }}
                  >
                  <span className="block px-3 py-2">{field.placeholder || ""}</span>
                </div>
                {field.helperText && (
                  <p
                    className="mt-2 text-xs font-semibold"
                    style={{ color: props.helperTextColor || props.descriptionColor || props.textColor || "#64748b" }}
                  >
                    {field.helperText}
                  </p>
                )}
              </div>
            </label>
          ))}
            {!props.fields && !props.questions && props.question && (
              <label className="block text-sm font-semibold text-slate-700">
                {props.question}
                <div style={{ marginTop: `${Number(props.labelGap ?? 5)}px`, textAlign: props.inputAlign || "left" }}>
                  <div
                    className="border-slate-300"
                    style={{
                      display: "inline-block",
                      backgroundColor: inputBackgroundColor,
                      border: inputBorderStyle,
                      borderRadius: `${Number(props.inputRadius ?? 6)}px`,
                      width: props.inputWidth || "100%",
                      maxWidth: "100%",
                      minHeight: `${Number(props.inputHeight ?? 40)}px`,
                      color: props.inputValueColor || props.inputTextColor || "#64748b",
                      fontSize: `${props.inputFontSize || 14}px`,
                      fontWeight: props.inputFontWeight || 600
                  }}
                />
                {props.helperText && (
                  <p
                    className="mt-2 text-xs font-semibold"
                    style={{ color: props.helperTextColor || props.descriptionColor || props.textColor || "#64748b" }}
                  >
                    {props.helperText}
                  </p>
                )}
              </div>
            </label>
          )}
          </div>
          {props.dividerText && (
            <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span className="h-px" style={{ backgroundColor: props.dividerColor || "#e2e8f0" }} />
              <span className="text-xs font-semibold" style={{ color: props.dividerTextColor || props.descriptionColor || "#64748b" }}>
                {props.dividerText}
              </span>
              <span className="h-px" style={{ backgroundColor: props.dividerColor || "#e2e8f0" }} />
            </div>
          )}
          <div style={{ marginTop: `${Number(props.buttonTopGap ?? 12)}px`, textAlign: props.buttonAlign || props.align || "left" }}>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => updateBlockProps(block.id, { submitText: event.currentTarget.textContent })}
              className="py-3 text-center text-sm font-bold text-white"
              style={{
                display: "inline-block",
                backgroundColor: buttonBackgroundColor,
                color: props.buttonTextColor || props.color || "#ffffff",
                border: `${Number(props.buttonBorderWidth ?? 0)}px solid ${props.buttonBorderColor || "transparent"}`,
                borderRadius: `${Number(props.buttonRadius ?? 6)}px`,
                width: props.buttonWidth || "100%",
                maxWidth: "100%",
                minHeight: `${Number(props.buttonHeight ?? 44)}px`
              }}
            >
              {props.submitText || "Submit"}
            </div>
          </div>
          {trustBadges.length > 0 && (
            <div
              className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold"
              style={{ color: props.trustTextColor || props.descriptionColor || "#64748b" }}
            >
              {trustBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: props.trustColor || theme.primaryColor || "#0f766e" }} />
                  {badge}
                </span>
              ))}
            </div>
          )}
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
          <h3
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => updateBlockProps(block.id, { title: event.currentTarget.textContent })}
            className="mb-2 text-lg font-bold text-slate-900"
          >
            {props.title || "Card title"}
          </h3>
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => updateBlockProps(block.id, { text: event.currentTarget.textContent })}
            className="text-sm leading-6"
            style={{
              color: props.textColor || "#64748b"
            }}
          >
            {props.text || "Card text"}
          </p>
        </div>
        {actions}
      </div>
    );
  }

  if (block.type === "shape") {
    return (
      <div {...dragProps} className={`${commonClass} flex justify-center`}>
        <div
          style={{
            width: `${props.width || 160}px`,
            height: `${props.height || 80}px`,
            backgroundColor: props.shape === "line" ? "transparent" : (props.backgroundColor || theme.primaryColor || "#178218"),
            border: props.shape === "line"
              ? `${props.lineWidth || 2}px ${props.lineStyle || "solid"} ${props.backgroundColor || theme.primaryColor || "#178218"}`
              : (props.border || "0"),
            borderRadius: props.shape === "circle" || props.shape === "pill" ? "999px" : `${props.radius || 8}px`
          }}
        />
        {actions}
      </div>
    );
  }

  if (block.type === "rawHtml") {
    return (
      <div {...dragProps} className={commonClass}>
        <div dangerouslySetInnerHTML={{ __html: replaceSampleValues(props.html || "") }} />
        {actions}
      </div>
    );
  }

  if (["navbar", "logoHeader", "productCard", "pricingCard", "testimonial", "countdown", "accordion", "carousel"].includes(block.type)) {
    return (
      <div {...dragProps} className={commonClass}>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {block.type === "logoHeader" && (
            <div className="text-center">
              <div className="mx-auto mb-2 h-10 w-28 rounded bg-slate-200" />
              <h3 className="font-bold text-slate-900">{props.title || "Brand Header"}</h3>
            </div>
          )}
          {block.type === "navbar" && (
            <div className="flex justify-center gap-4 text-sm font-bold text-emerald-700">
              {(props.links || []).map((link, index) => <span key={index}>{link.label}</span>)}
            </div>
          )}
          {block.type === "productCard" && (
            <div>
              <div className="mb-3 h-28 rounded bg-gradient-to-br from-sky-100 to-emerald-100" />
              <h3 className="font-bold text-slate-900">{props.title || "Product"}</h3>
              <p className="text-sm text-slate-500">{props.text || "Product description"}</p>
              <p className="mt-2 font-bold">{props.price || "$49"}</p>
            </div>
          )}
          {block.type === "pricingCard" && (
            <div className="text-center">
              <h3 className="font-bold">{props.title || "Pro Plan"}</h3>
              <p className="my-2 text-3xl font-bold text-emerald-700">{props.price || "$29"}</p>
              <div className="text-left text-sm text-slate-500">{(props.features || []).map((item, index) => <p key={index}>✓ {item}</p>)}</div>
            </div>
          )}
          {block.type === "testimonial" && (
            <div>
              <p className="text-slate-700">“{props.quote || "Great experience."}”</p>
              <p className="mt-2 font-bold">{props.name || "Customer"}</p>
            </div>
          )}
          {block.type === "countdown" && (
            <div className="text-center">
              <p className="font-bold">{props.label || "Offer ends on"}</p>
              <p className="text-2xl font-bold text-red-600">{props.date || "2026-12-31"}</p>
            </div>
          )}
          {block.type === "accordion" && (
            <div className="space-y-2">
              {(props.items || []).map((item, index) => <div key={index} className="rounded border border-slate-200 p-2"><p className="font-bold">{item.title}</p><p className="text-sm text-slate-500">{item.text}</p></div>)}
            </div>
          )}
          {block.type === "carousel" && (
            <div className="grid gap-2">
              {(props.slides || []).slice(0, 2).map((slide, index) => <div key={index} className="rounded bg-slate-100 p-3 text-center text-sm font-bold">{slide.title}</div>)}
            </div>
          )}
        </div>
        {actions}
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div {...dragProps} className={commonClass}>
        <div
          className="h-px w-full"
          style={{
            backgroundColor: props.color || "#e5e7eb",
            margin: getBoxMargin(props, "12px 0")
          }}
        />
        {actions}
      </div>
    );
  }

  if (block.type === "card") {
    return (
      <div className="grid gap-3">
        <InputField label="Title" value={props.title || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Text
          <textarea
            value={props.text || ""}
            onChange={(event) => updateBlockProps(block.id, { text: event.target.value })}
            rows={3}
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Background
          <input
            type="color"
            value={props.backgroundColor || "#f8fafc"}
            onChange={(event) => updateBlockProps(block.id, { backgroundColor: event.target.value })}
            className="mt-2 h-10 w-full rounded-md border border-slate-300"
          />
        </label>
        <InputField label="Radius" type="number" value={props.radius || 8} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
        <InputField label="Padding" value={props.padding || "18px"} onChange={(event) => updateBlockProps(block.id, { padding: event.target.value })} />
      </div>
    );
  }

  if (block.type === "shape") {
    return (
      <div className="grid gap-3">
        <label className="block text-sm font-semibold text-slate-700">
          Shape
          <select
            value={props.shape || "rectangle"}
            onChange={(event) => updateBlockProps(block.id, { shape: event.target.value })}
            className={`mt-2 ${inputClass}`}
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Width" type="number" value={props.width || 160} onChange={(event) => updateBlockProps(block.id, { width: Number(event.target.value) })} />
          <InputField label="Height" type="number" value={props.height || 80} onChange={(event) => updateBlockProps(block.id, { height: Number(event.target.value) })} />
        </div>
        <InputField label="Radius" type="number" value={props.radius || 8} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
        <label className="block text-sm font-semibold text-slate-700">
          Fill
          <input
            type="color"
            value={props.backgroundColor || "#178218"}
            onChange={(event) => updateBlockProps(block.id, { backgroundColor: event.target.value })}
            className="mt-2 h-10 w-full rounded-md border border-slate-300"
          />
        </label>
      </div>
    );
  }

  if (block.type === "rawHtml") {
    return (
      <label className="block text-sm font-semibold text-slate-700">
        HTML
        <textarea
          value={props.html || ""}
          onChange={(event) => updateBlockProps(block.id, { html: event.target.value })}
          rows={8}
          className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </label>
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

  return null;
};

const ImageCanvasBlock = ({ block, selected, updateBlockProps }) => {
  const props = block.props || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const fileInputId = `image-upload-${block.id}`;
  const isPlaceholder = !props.src || String(props.src).includes("placeholder.com");

  const applyImage = (image) => {
    if (/^data:image\//i.test(image.src || "") && image.src.length > IMAGE_UPLOAD_MAX_DATA_URL_CHARS) {
      setUrlStatus("This image is still too large. Upload a smaller image or compress it before saving.");
      return;
    }

    updateBlockProps(block.id, {
      src: image.src,
      alt: image.alt || props.alt || image.name || "Email image",
      width: image.width || props.width || 600,
      height: image.height || props.height || 320,
      bannerWidth: image.width || props.bannerWidth || props.width || 600,
      bannerHeight: image.height || props.bannerHeight || props.height || 320,
      imageWidth: image.width || props.imageWidth || props.width || 600,
      imageHeight: image.height || props.imageHeight || props.height || 320
    });
    setMenuOpen(false);
  };

  const handleUrl = () => {
    const url = window.prompt("Paste image URL", props.src || "");

    if (url) {
      applyImage({
        src: url,
        alt: props.alt || "Email image"
      });
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      applyImage({
        src: reader.result,
        alt: file.name.replace(/\.[^.]+$/, "")
      });
    };
    reader.readAsDataURL(file);
  };

  const applyDroppedFile = (file) => {
    if (!file || !file.type?.startsWith("image/")) {
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => {
      applyImage({
        src: reader.result,
        alt: file.name.replace(/\.[^.]+$/, "")
      });
    };
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

    const file = event.dataTransfer.files?.[0];

    if (applyDroppedFile(file)) {
      return;
    }

    const url = event.dataTransfer.getData("text/uri-list") ||
      event.dataTransfer.getData("text/plain");

    if (url && /^https?:\/\//i.test(url.trim())) {
      applyImage({
        src: url.trim(),
        alt: props.alt || "Dropped image"
      });
    }
  };

  const imageActions = [
    ["Upload Image", () => document.getElementById(fileInputId)?.click()],
    ["Add from Gallery", () => applyImage(defaultImageGallery[0])],
    ["Image from URL", handleUrl],
    ["Generate Image", () => applyImage({
      name: "Generated style preview",
      src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
      alt: "Generated workspace preview"
    })],
    ["Get Stock Images", () => applyImage(defaultImageGallery[1])],
    ["Get Icons", () => applyImage({
      src: createPlaceholderImage("Icon Set", 600, 220),
      alt: "Icon set"
    })],
    ["Get GIFs & Stickers", () => applyImage({
      src: createPlaceholderImage("GIF or Sticker", 600, 220),
      alt: "GIF or sticker"
    })],
    ["Get Illustrations", () => applyImage({
      src: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=80",
      alt: "Illustration style image"
    })]
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
        isImageDragOver
          ? "border-indigo-500 bg-indigo-50"
          : "border-slate-400 bg-slate-50"
      }`}
    >
      <input id={fileInputId} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

      {!isPlaceholder ? (
        <img src={props.src} alt={props.alt || ""} className="block h-auto max-h-80 w-full object-contain" />
      ) : (
        <div className="text-center text-slate-400">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-xs font-bold">
            IMG
          </div>
          <p className="text-sm font-semibold">
            {isImageDragOver ? "Drop image here" : "Image goes here"}
          </p>
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
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                >
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

const LegacyOutputPreview = ({
  previewMarkup,
  renderedPreviewMarkup,
  previewTab,
  setPreviewTab,
  preview,
  previewViewport,
  setPreviewViewport,
  sideBySidePreview,
  setSideBySidePreview,
  previewLoading,
  previewError,
  previewValidation
}) => {
  const exportCode = () => {
    const blob = new Blob([previewMarkup || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${previewTab}-template.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const frameClass = previewViewport === "mobile"
    ? "mx-auto h-[520px] w-[375px] max-w-full bg-white"
    : "h-[420px] w-full bg-white xl:h-[520px]";
  const tabs = ["html", "amp", "formHtml"];

  return (
  <>
    <div className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
        <div className="flex min-w-0 flex-1 overflow-x-auto rounded-md bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setPreviewTab(tab)}
            className={`shrink-0 rounded-md px-2 py-2 text-xs font-bold sm:flex-1 ${
              previewTab === tab ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
            }`}
          >
            {tab === "formHtml" ? "Hosted Form" : `${tab.toUpperCase()} Email`}
          </button>
        ))}
        </div>
        <button type="button" onClick={() => setPreviewViewport(previewViewport === "desktop" ? "mobile" : "desktop")} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold">
          {previewViewport === "desktop" ? "Mobile" : "Desktop"}
        </button>
        <button type="button" onClick={() => setSideBySidePreview(!sideBySidePreview)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold">
          {sideBySidePreview ? "Single" : "Side-by-side"}
        </button>
        <button type="button" onClick={exportCode} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold">
          Export
        </button>
      </div>
      {sideBySidePreview ? (
        <div className="grid min-w-0 gap-3 p-3 lg:grid-cols-3">
          {tabs.map((tab) => (
            <div key={tab} className="min-w-0 overflow-hidden rounded border border-slate-200">
              <p className="border-b border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
                {tab === "formHtml" ? "Hosted Form" : `${tab.toUpperCase()} Email`}
              </p>
              <iframe
                title={`${tab} preview`}
                srcDoc={replaceSampleValues(preview?.[tab] || "")}
                className="block h-[360px] w-full max-w-full bg-white"
              />
            </div>
          ))}
        </div>
      ) : (
        <iframe
          title="Generated output preview"
          srcDoc={renderedPreviewMarkup}
          className={`${frameClass} block`}
        />
      )}
      {!previewMarkup && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {previewLoading ? "Generating preview..." : "Preview will appear here automatically. You can also click Generate Outputs."}
        </div>
      )}
    </div>
    {previewLoading && (
      <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
        Updating preview from your latest canvas changes...
      </div>
    )}
    {previewError && (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {previewError}
      </div>
    )}
    {previewValidation && (
      <div className={`rounded-md border px-3 py-2 text-xs ${
        previewValidation.valid
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}>
        <div className="mb-2 font-bold">
          {previewValidation.valid ? "Validation passed" : "Validation needs attention"}
        </div>
        {previewValidation.errors?.map((issue) => (
          <div key={`${issue.code}-${issue.message}`} className="mb-1">
            Error: {issue.message}
          </div>
        ))}
        {previewValidation.warnings?.map((issue) => (
          <div key={`${issue.code}-${issue.message}`} className="mb-1">
            Warning: {issue.message}
            {issue.variables?.length ? ` (${issue.variables.join(", ")})` : ""}
          </div>
        ))}
      </div>
    )}
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      Preview uses sample values. Saved templates still keep real placeholders for each recipient.
    </div>
    <textarea
      readOnly
      value={renderedPreviewMarkup}
      rows={8}
      className="w-full max-w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
    />
    <details className="rounded-md border border-slate-200 bg-white p-3">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-500">
        Raw generated code with placeholders
      </summary>
      <textarea
        readOnly
        value={previewMarkup}
        rows={8}
        className="mt-3 w-full max-w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs"
      />
    </details>
  </>
  );
};

const colorTextToHex = (value = "#000000") => {
  const color = String(value || "").trim();

  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }

  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }

  const rgbMatch = color.match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);

  if (rgbMatch) {
    return `#${rgbMatch.slice(1, 4).map((part) => {
      const channel = Math.min(255, Math.max(0, Number(part)));
      return channel.toString(16).padStart(2, "0");
    }).join("")}`;
  }

  return "#000000";
};

const colorPresets = [
  "#020617",
  "#334155",
  "#64748b",
  "#ffffff",
  "#6c4cff",
  "#178218",
  "#0f766e",
  "#2563eb",
  "#dc2626",
  "#f59e0b"
];

const ColorField = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const displayValue = value || "#000000";
  const pickerValue = colorTextToHex(displayValue);
  const emitColor = (nextValue) => {
    onChange({ target: { value: nextValue } });
  };

  return (
    <div className="relative block text-sm font-semibold text-slate-700">
      <span className="mb-2 block">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center gap-3 rounded-md border border-slate-300 bg-white px-3 text-left text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50"
      >
        <span
          className="h-6 w-6 shrink-0 rounded-md border border-slate-200 shadow-inner"
          style={{ backgroundColor: displayValue }}
        />
        <span className="min-w-0 flex-1 truncate">{displayValue}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-56 rounded-lg border border-white/60 bg-white/80 p-2.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="h-8 w-8 shrink-0 rounded-md border border-white/70 shadow-inner"
              style={{ backgroundColor: displayValue }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Selected</p>
              <p className="truncate text-xs font-bold text-slate-800">{displayValue}</p>
            </div>
          </div>

          <div className="rounded-md border border-white/70 bg-white/55 p-2">
            <input
              type="color"
              value={pickerValue}
              onChange={(event) => emitColor(event.target.value)}
              className="h-14 w-full cursor-pointer rounded border border-white/70 bg-white/70 p-1"
            />
            <label className="mt-2 block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">HEX / RGB</span>
              <input
                value={displayValue}
                onChange={(event) => emitColor(event.target.value)}
                placeholder="#111827 or rgb(17, 24, 39)"
                className="w-full rounded-md border border-white/70 bg-white/80 px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="mt-2">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Quick colors</p>
            <div className="grid grid-cols-5 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => emitColor(preset)}
                  title={preset}
                  className="h-6 rounded border border-white/70 shadow-sm ring-offset-1 hover:ring-2 hover:ring-[#6c4cff]"
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-slate-900/90 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-900"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TextStyleGroup = ({
  title,
  colorLabel,
  sizeLabel,
  weightLabel,
  color,
  size,
  weight,
  onChange,
  keys
}) => (
  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
    <div className="grid gap-3">
      <ColorField
        label={colorLabel}
        value={color}
        onChange={(event) => onChange({ [keys.color]: event.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label={sizeLabel}
          type="number"
          value={size}
          onChange={(event) => onChange({ [keys.size]: Number(event.target.value) })}
        />
        <InputField
          label={weightLabel}
          value={weight}
          onChange={(event) => onChange({ [keys.weight]: event.target.value })}
        />
      </div>
    </div>
  </div>
);

const getStoredImageGallery = () => {
  try {
    return JSON.parse(localStorage.getItem("trackmini:image-gallery") || "[]");
  } catch {
    return [];
  }
};

const getAssetUploadEndpoint = (editorConfig) => (
  editorConfig?.assetUploadEndpoint ||
  editorConfig?.assetUpload?.endpoint ||
  editorConfig?.assets?.uploadEndpoint ||
  "/api/templates/assets"
);

const getAssetUploadUrl = (editorConfig) => {
  const endpoint = getAssetUploadEndpoint(editorConfig);
  return /^https?:\/\//i.test(endpoint) ? endpoint : apiUrl(endpoint);
};

const IMAGE_UPLOAD_MAX_DIMENSION = 420;
const IMAGE_UPLOAD_MIN_DIMENSION = 220;
const IMAGE_UPLOAD_INITIAL_QUALITY = 0.42;
const IMAGE_UPLOAD_MIN_QUALITY = 0.16;
const IMAGE_UPLOAD_MAX_DATA_URL_CHARS = 60000;

const formatFileSize = (bytes) => {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const loadImageElement = (src) => new Promise((resolve, reject) => {
  const image = new window.Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const resizeImageFile = async (file) => {
  const originalDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await loadImageElement(originalDataUrl);
  const scale = Math.min(
    1,
    IMAGE_UPLOAD_MAX_DIMENSION / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
  );
  let width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  let height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return {
      dataUrl: originalDataUrl,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      compressed: false,
      originalSize: file.size,
      outputSize: Math.ceil(originalDataUrl.length * 0.75)
    };
  }

  let quality = IMAGE_UPLOAD_INITIAL_QUALITY;
  let dataUrl = originalDataUrl;

  const renderCompressedImage = () => {
    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  };

  while (quality >= IMAGE_UPLOAD_MIN_QUALITY) {
    dataUrl = renderCompressedImage();

    if (dataUrl.length <= IMAGE_UPLOAD_MAX_DATA_URL_CHARS) {
      break;
    }

    quality -= 0.08;
  }

  quality = IMAGE_UPLOAD_MIN_QUALITY;

  while (
    dataUrl.length > IMAGE_UPLOAD_MAX_DATA_URL_CHARS &&
    Math.max(width, height) > IMAGE_UPLOAD_MIN_DIMENSION
  ) {
    const nextScale = Math.max(
      IMAGE_UPLOAD_MIN_DIMENSION / Math.max(width, height),
      0.78
    );
    width = Math.max(1, Math.round(width * nextScale));
    height = Math.max(1, Math.round(height * nextScale));
    dataUrl = renderCompressedImage();
  }

  return {
    dataUrl,
    width,
    height,
    compressed: dataUrl !== originalDataUrl,
    originalSize: file.size,
    outputSize: Math.ceil(dataUrl.length * 0.75)
  };
};

const ImageBlockEditor = ({ block, updateBlockProps, editorConfig }) => {
  const props = block.props || {};
  const [imageTab, setImageTab] = useState("url");
  const [draftUrl, setDraftUrl] = useState(props.src || "");
  const [urlStatus, setUrlStatus] = useState("");
  const [customGallery, setCustomGallery] = useState(getStoredImageGallery);
  const galleryImages = [
    ...customGallery,
    ...defaultImageGallery
  ];

  useEffect(() => {
    setDraftUrl(props.src || "");
  }, [block.id, props.src]);

  const saveCustomGallery = (items) => {
    setCustomGallery(items);
    localStorage.setItem("trackmini:image-gallery", JSON.stringify(items));
  };

  const applyImage = (image) => {
    if (/^data:image\//i.test(image.src || "") && image.src.length > IMAGE_UPLOAD_MAX_DATA_URL_CHARS) {
      setUrlStatus("This image is still too large. Upload a smaller image or compress it before saving.");
      return;
    }

    updateBlockProps(block.id, {
      src: image.src,
      alt: image.alt || props.alt || image.name || "Email image",
      width: image.width || props.width || 600,
      height: image.height || props.height || 320,
      bannerWidth: image.width || props.bannerWidth || props.width || 600,
      bannerHeight: image.height || props.bannerHeight || props.height || 320,
      imageWidth: image.width || props.imageWidth || props.width || 600,
      imageHeight: image.height || props.imageHeight || props.height || 320
    });
    setDraftUrl(image.src);
    setUrlStatus("");
  };

  const saveCurrentToGallery = () => {
    if (!props.src) {
      setUrlStatus("Add an image URL first.");
      return;
    }

    const exists = customGallery.some((item) => item.src === props.src);

    if (exists) {
      setUrlStatus("Image is already saved.");
      return;
    }

    saveCustomGallery([
      {
        name: props.alt || "Saved image",
        src: props.src,
        alt: props.alt || "Saved image"
      },
      ...customGallery
    ]);
    setUrlStatus("Saved to gallery.");
  };

  const removeSavedImage = (src) => {
    saveCustomGallery(customGallery.filter((item) => item.src !== src));
  };

  const handleFilePreview = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUrlStatus(`Compressing ${formatFileSize(file.size)} image...`);
      const resizedImage = await resizeImageFile(file);

      setUrlStatus(`Uploading compressed image (${formatFileSize(resizedImage.outputSize)})...`);
      const response = await axios.post(getAssetUploadUrl(editorConfig), {
        image: resizedImage.dataUrl,
        fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
        category: "images"
      });
      const assetUrl = response.data?.asset?.url || response.data?.url;

      if (!assetUrl || /^data:image\//i.test(assetUrl)) {
        throw new Error("Upload response did not include a hosted asset URL.");
      }

      applyImage({
        name: file.name,
        src: assetUrl,
        alt: file.name.replace(/\.[^.]+$/, ""),
        width: resizedImage.width || props.width || 600,
        height: resizedImage.height || props.height || 320
      });
      setUrlStatus(`Image compressed from ${formatFileSize(resizedImage.originalSize)} to ${formatFileSize(resizedImage.outputSize)} and uploaded.`);
    } catch (error) {
      console.log(error);
      const status = error.response?.status;
      setUrlStatus(status === 413
        ? "Image is still too large for the server after compression. Try a smaller image."
        : "Image upload failed. Check the asset endpoint and try again.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {props.src ? (
          <img
            src={props.src}
            alt={props.alt || ""}
            onLoad={(event) => {
              const image = event.currentTarget;
              if (!props.width || !props.height) {
                updateBlockProps(block.id, {
                  width: image.naturalWidth || 600,
                  height: image.naturalHeight || 320
                });
              }
              setUrlStatus("Image loaded.");
            }}
            onError={() => setUrlStatus("Image could not be loaded. Check the URL.")}
            className="max-h-48 w-full object-contain"
          />
        ) : (
          <div className="flex h-32 items-center justify-center text-sm font-semibold text-slate-400">
            No image selected
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600">
        {[
          ["url", "URL"],
          ["gallery", "Gallery"],
          ["upload", "Local"]
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setImageTab(id)}
            className={`rounded-md px-2 py-2 transition ${imageTab === id ? "bg-emerald-600 text-white" : "hover:bg-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {imageTab === "url" && (
        <div className="grid gap-2">
          <InputField label="Image URL" value={draftUrl} onChange={(event) => setDraftUrl(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyImage({ src: draftUrl, alt: props.alt || "Email image" })}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Fetch URL
            </button>
            <button
              type="button"
              onClick={saveCurrentToGallery}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Save Image
            </button>
          </div>
          {urlStatus && <p className="text-xs font-medium text-slate-500">{urlStatus}</p>}
        </div>
      )}

      {imageTab === "gallery" && (
        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
          {galleryImages.map((image) => {
            const isSaved = customGallery.some((item) => item.src === image.src);

            return (
              <div key={image.src} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button type="button" onClick={() => applyImage(image)} className="block w-full">
                  <img src={image.src} alt={image.alt} className="h-24 w-full object-cover" />
                  <span className="block truncate px-2 py-2 text-left text-xs font-semibold text-slate-700">
                    {image.name}
                  </span>
                </button>
                {isSaved && (
                  <button
                    type="button"
                    onClick={() => removeSavedImage(image.src)}
                    className="w-full border-t border-slate-100 px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {imageTab === "upload" && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFilePreview}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-700"
          />
          <p className="mt-2 text-xs text-slate-500">
            Images upload to the template asset library and are saved as public URLs for email.
          </p>
        </div>
      )}

      <InputField label="Link" value={props.href || ""} onChange={(event) => updateBlockProps(block.id, { href: event.target.value })} />
      <InputField label="Alt Text" value={props.alt || ""} onChange={(event) => updateBlockProps(block.id, { alt: event.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Width" type="number" value={props.width || 600} onChange={(event) => {
          const value = Number(event.target.value);
          updateBlockProps(block.id, { width: value, bannerWidth: value, imageWidth: value });
        }} />
        <InputField label="Height" type="number" value={props.height || 320} onChange={(event) => {
          const value = Number(event.target.value);
          updateBlockProps(block.id, { height: value, bannerHeight: value, imageHeight: value });
        }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Mobile Width" type="number" value={props.mobileWidth || Math.min(Number(props.width || 600), 320)} onChange={(event) => updateBlockProps(block.id, { mobileWidth: Number(event.target.value) })} />
        <label className="block text-sm font-semibold text-slate-700">
          Fit
          <select value={props.objectFit || "contain"} onChange={(event) => updateBlockProps(block.id, { objectFit: event.target.value })} className={`mt-2 ${inputClass}`}>
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Radius" type="number" value={props.radius || 0} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
        <label className="block text-sm font-semibold text-slate-700">
          Align
          <select value={props.align || "center"} onChange={(event) => updateBlockProps(block.id, { align: event.target.value })} className={`mt-2 ${inputClass}`}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </div>
    </div>
  );
};

const BlockEditor = ({ block, updateBlockProps, updateFormField, addFormField, removeFormField, editorConfig }) => {
  const props = block.props || {};

  if (block.type === "heading" || block.type === "text") {
    return (
      <div className="grid gap-3">
        <label className="block text-sm font-semibold text-slate-700">
          Text
          <textarea value={props.text || ""} onChange={(event) => updateBlockProps(block.id, { text: event.target.value })} rows={4} className={`mt-2 ${inputClass}`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700">
            Align
            <select value={props.align || "left"} onChange={(event) => updateBlockProps(block.id, { align: event.target.value })} className={`mt-2 ${inputClass}`}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <InputField label="Font Size" type="number" value={props.fontSize || 16} onChange={(event) => updateBlockProps(block.id, { fontSize: Number(event.target.value) })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Weight" value={props.fontWeight || (block.type === "heading" ? "700" : "400")} onChange={(event) => updateBlockProps(block.id, { fontWeight: event.target.value })} />
          <InputField label="Line Height" value={props.lineHeight || "1.45"} onChange={(event) => updateBlockProps(block.id, { lineHeight: event.target.value })} />
        </div>
        <InputField label="Padding" value={props.padding || ""} placeholder="0 or 12px 16px" onChange={(event) => updateBlockProps(block.id, { padding: event.target.value })} />
        <div className="grid grid-cols-4 gap-2">
          <InputField label="Top" type="number" value={props.paddingTop ?? 0} onChange={(event) => updateBlockProps(block.id, { paddingTop: Number(event.target.value) })} />
          <InputField label="Right" type="number" value={props.paddingRight ?? 0} onChange={(event) => updateBlockProps(block.id, { paddingRight: Number(event.target.value) })} />
          <InputField label="Bottom" type="number" value={props.paddingBottom ?? 0} onChange={(event) => updateBlockProps(block.id, { paddingBottom: Number(event.target.value) })} />
          <InputField label="Left" type="number" value={props.paddingLeft ?? 0} onChange={(event) => updateBlockProps(block.id, { paddingLeft: Number(event.target.value) })} />
        </div>
        <ColorField label="Color" value={props.color || "#111827"} onChange={(event) => updateBlockProps(block.id, { color: event.target.value })} />
      </div>
    );
  }

  if (block.type === "image") {
    return <ImageBlockEditor block={block} updateBlockProps={updateBlockProps} editorConfig={editorConfig} />;
  }

  if (block.type === "button") {
    return (
      <div className="grid gap-3">
        <InputField label="Button Text" value={props.text || ""} onChange={(event) => updateBlockProps(block.id, { text: event.target.value })} />
        <InputField label="Link" value={props.href || ""} onChange={(event) => updateBlockProps(block.id, { href: event.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={props.backgroundColor || "#178218"} onChange={(event) => updateBlockProps(block.id, { backgroundColor: event.target.value })} />
          <ColorField label="Text Color" value={props.color || "#ffffff"} onChange={(event) => updateBlockProps(block.id, { color: event.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Radius" type="number" value={props.radius || 6} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
          <InputField label="Font Size" type="number" value={props.fontSize || 16} onChange={(event) => updateBlockProps(block.id, { fontSize: Number(event.target.value) })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Text Weight" value={props.fontWeight || "800"} onChange={(event) => updateBlockProps(block.id, { fontWeight: event.target.value })} />
          <InputField label="Line Height" value={props.lineHeight || "1.2"} onChange={(event) => updateBlockProps(block.id, { lineHeight: event.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Width" value={props.width || "auto"} onChange={(event) => updateBlockProps(block.id, { width: event.target.value })} />
          <InputField label="Height" type="number" value={props.height || ""} onChange={(event) => updateBlockProps(block.id, { height: event.target.value ? Number(event.target.value) : "" })} />
        </div>
        <InputField label="Padding" value={props.padding || "13px 20px"} onChange={(event) => updateBlockProps(block.id, { padding: event.target.value })} />
      </div>
    );
  }

  if (block.type === "social") {
    const links = Array.isArray(props.links) ? props.links : [];
    const updateSocialLink = (index, patch) => {
      updateBlockProps(block.id, {
        links: links.map((link, linkIndex) => (
          linkIndex === index ? { ...link, ...patch } : link
        ))
      });
    };
    const addSocialLink = () => {
      updateBlockProps(block.id, {
        links: [
          ...links,
          { label: "Social", href: "https://example.com", icon: "so", iconKey: "link" }
        ]
      });
    };
    const removeSocialLink = (index) => {
      updateBlockProps(block.id, {
        links: links.filter((_, linkIndex) => linkIndex !== index)
      });
    };

    return (
      <div className="grid gap-3">
        <InputField label="Title" value={props.title || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700">
            Align
            <select value={props.align || "center"} onChange={(event) => updateBlockProps(block.id, { align: event.target.value })} className={`mt-2 ${inputClass}`}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Layout
            <select value={props.layout || "icons"} onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })} className={`mt-2 ${inputClass}`}>
              <option value="icons">Icons</option>
              <option value="buttons">Buttons</option>
              <option value="text">Text links</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Section Background" value={props.backgroundColor || "#ffffff"} onChange={(event) => updateBlockProps(block.id, { backgroundColor: event.target.value })} />
          <ColorField label="Button Background" value={props.iconBackgroundColor || "#0f172a"} onChange={(event) => updateBlockProps(block.id, { iconBackgroundColor: event.target.value })} />
          <ColorField label="Button Text" value={props.iconColor || "#ffffff"} onChange={(event) => updateBlockProps(block.id, { iconColor: event.target.value })} />
          <ColorField label="Text Link Color" value={props.textColor || "#0f766e"} onChange={(event) => updateBlockProps(block.id, { textColor: event.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Font Size" type="number" value={props.fontSize || 13} onChange={(event) => updateBlockProps(block.id, { fontSize: Number(event.target.value) })} />
          <InputField label="Font Weight" value={props.fontWeight || "800"} onChange={(event) => updateBlockProps(block.id, { fontWeight: event.target.value })} />
          <InputField label="Icon Size" type="number" value={props.iconSize || 18} onChange={(event) => updateBlockProps(block.id, { iconSize: Number(event.target.value) })} />
          <InputField label="Radius" type="number" value={props.radius ?? 999} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
          <InputField label="Gap" type="number" value={props.gap ?? 10} onChange={(event) => updateBlockProps(block.id, { gap: Number(event.target.value) })} />
          <InputField label="Padding" value={props.padding || "18px"} onChange={(event) => updateBlockProps(block.id, { padding: event.target.value })} />
          <InputField label="Item Padding" value={props.itemPadding || "9px 13px"} onChange={(event) => updateBlockProps(block.id, { itemPadding: event.target.value })} />
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Social Links</p>
            <button type="button" onClick={addSocialLink} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-700">
              Add
            </button>
          </div>
          <div className="space-y-3">
            {links.map((link, index) => (
              <div key={`${link.label || "social"}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,0.8fr)] gap-2">
                  <input value={link.label || ""} onChange={(event) => updateSocialLink(index, { label: event.target.value })} placeholder="Label" className={inputClass} />
                  <select
                    value={link.iconKey || "link"}
                    onChange={(event) => {
                      const option = socialIconOptions.find((item) => item.value === event.target.value);
                      updateSocialLink(index, {
                        iconKey: event.target.value,
                        label: link.label || option?.label || "Social",
                        icon: (option?.label || "so").slice(0, 2).toLowerCase(),
                        iconUrl: socialLogoUrls[event.target.value] || ""
                      });
                    }}
                    className={inputClass}
                  >
                    {socialIconOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <input value={link.iconUrl || link.logoUrl || ""} onChange={(event) => updateSocialLink(index, { iconUrl: event.target.value })} placeholder="Icon URL" className={inputClass} />
                <ColorField label="Logo Background" value={link.backgroundColor || link.iconBackgroundColor || props.iconBackgroundColor || "#0f172a"} onChange={(event) => updateSocialLink(index, { backgroundColor: event.target.value, iconBackgroundColor: event.target.value })} />
                <input value={link.href || ""} onChange={(event) => updateSocialLink(index, { href: event.target.value })} placeholder="https://..." className={inputClass} />
                <button type="button" onClick={() => removeSocialLink(index)} className="justify-self-end rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-600">
                  Remove
                </button>
              </div>
            ))}
            {!links.length && <p className="text-xs font-semibold text-slate-500">No links yet. Add Facebook, Instagram, LinkedIn, X, YouTube, or any custom URL.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "form") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={props.showTitle !== false}
              onChange={(event) => updateBlockProps(block.id, { showTitle: event.target.checked })}
            />
            Show heading
          </label>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={props.showDescription !== false}
              onChange={(event) => updateBlockProps(block.id, { showDescription: event.target.checked })}
            />
            Show subtitle
          </label>
        </div>
        <InputField label="Form Title" value={props.title || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
        <InputField label="Submit Text" value={props.submitText || ""} onChange={(event) => updateBlockProps(block.id, { submitText: event.target.value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Description
          <textarea value={props.description || ""} onChange={(event) => updateBlockProps(block.id, { description: event.target.value })} rows={2} className={`mt-2 ${inputClass}`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Form Background" value={props.formBackgroundColor || "#ffffff"} onChange={(event) => updateBlockProps(block.id, { formBackgroundColor: event.target.value })} />
          <ColorField label="Border Color" value={props.borderColor || "#e2e8f0"} onChange={(event) => updateBlockProps(block.id, { borderColor: event.target.value })} />
          <InputField label="Border Width" type="number" value={props.borderWidth ?? 1} onChange={(event) => updateBlockProps(block.id, { borderWidth: Number(event.target.value) })} />
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(props.formBackgroundTransparent)}
              onChange={(event) => updateBlockProps(block.id, { formBackgroundTransparent: event.target.checked })}
            />
            No form background
          </label>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Background Image</p>
          <div className="grid gap-3">
            <InputField label="Image URL" value={props.backgroundImageUrl || ""} onChange={(event) => updateBlockProps(block.id, { backgroundImageUrl: event.target.value })} placeholder="https://example.com/background.jpg" />
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">
                Size
                <select value={props.backgroundImageSize || "cover"} onChange={(event) => updateBlockProps(block.id, { backgroundImageSize: event.target.value })} className={`mt-2 ${inputClass}`}>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Original</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Position
                <select value={props.backgroundImagePosition || "center"} onChange={(event) => updateBlockProps(block.id, { backgroundImagePosition: event.target.value })} className={`mt-2 ${inputClass}`}>
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Repeat
                <select value={props.backgroundImageRepeat || "no-repeat"} onChange={(event) => updateBlockProps(block.id, { backgroundImageRepeat: event.target.value })} className={`mt-2 ${inputClass}`}>
                  <option value="no-repeat">No repeat</option>
                  <option value="repeat">Repeat</option>
                  <option value="repeat-x">Repeat X</option>
                  <option value="repeat-y">Repeat Y</option>
                </select>
              </label>
              <InputField label="Overlay" value={props.backgroundOverlayColor || ""} onChange={(event) => updateBlockProps(block.id, { backgroundOverlayColor: event.target.value })} placeholder="rgba(255,255,255,0.75)" />
            </div>
          </div>
        </div>
        <TextStyleGroup
          title="Title Text"
          colorLabel="Title Color"
          sizeLabel="Title Size"
          weightLabel="Title Weight"
          color={props.titleColor || "#020617"}
          size={props.titleSize || 18}
          weight={props.titleWeight || "800"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "titleColor", size: "titleSize", weight: "titleWeight" }}
        />
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Heading Position</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-slate-700">
              Heading Align
              <select value={props.titleAlign || props.align || "left"} onChange={(event) => updateBlockProps(block.id, { titleAlign: event.target.value })} className={`mt-2 ${inputClass}`}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Subtitle Align
              <select value={props.descriptionAlign || props.titleAlign || props.align || "left"} onChange={(event) => updateBlockProps(block.id, { descriptionAlign: event.target.value })} className={`mt-2 ${inputClass}`}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <InputField label="Heading Top" type="number" value={props.titleTopGap ?? 0} onChange={(event) => updateBlockProps(block.id, { titleTopGap: Number(event.target.value) })} />
            <InputField label="Heading Bottom" type="number" value={props.titleBottomGap ?? 0} onChange={(event) => updateBlockProps(block.id, { titleBottomGap: Number(event.target.value) })} />
            <InputField label="Heading Left" type="number" value={props.titleIndent ?? 0} onChange={(event) => updateBlockProps(block.id, { titleIndent: Number(event.target.value) })} />
          </div>
        </div>
        <TextStyleGroup
          title="Description Text"
          colorLabel="Description Color"
          sizeLabel="Description Size"
          weightLabel="Description Weight"
          color={props.descriptionColor || props.textColor || "#64748b"}
          size={props.descriptionSize || props.textSize || 14}
          weight={props.descriptionWeight || props.textWeight || "400"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "descriptionColor", size: "descriptionSize", weight: "descriptionWeight" }}
        />
        <TextStyleGroup
          title="Input Label"
          colorLabel="Label Color"
          sizeLabel="Label Size"
          weightLabel="Label Weight"
          color={props.inputLabelColor || props.inputTextColor || "#64748b"}
          size={props.inputFontSize || 14}
          weight={props.inputFontWeight || "600"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "inputLabelColor", size: "inputFontSize", weight: "inputFontWeight" }}
        />
        <ColorField label="Input Box Text Color" value={props.inputValueColor || props.inputTextColor || "#64748b"} onChange={(event) => updateBlockProps(block.id, { inputValueColor: event.target.value })} />
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Field Box</p>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Field Background" value={props.inputBackgroundColor || "#f8fafc"} onChange={(event) => updateBlockProps(block.id, { inputBackgroundColor: event.target.value })} />
            <ColorField label="Field Border Color" value={props.inputBorderColor || "#e2e8f0"} onChange={(event) => updateBlockProps(block.id, { inputBorderColor: event.target.value })} />
            <InputField label="Field Border Width" type="number" value={props.inputBorderWidth ?? 1} onChange={(event) => updateBlockProps(block.id, { inputBorderWidth: Number(event.target.value) })} />
            <InputField label="Field Width" value={props.inputWidth || "100%"} onChange={(event) => updateBlockProps(block.id, { inputWidth: event.target.value })} />
            <InputField label="Field Height" type="number" value={props.inputHeight ?? 40} onChange={(event) => updateBlockProps(block.id, { inputHeight: Number(event.target.value) })} />
            <InputField label="Field Radius" type="number" value={props.inputRadius ?? 6} onChange={(event) => updateBlockProps(block.id, { inputRadius: Number(event.target.value) })} />
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(props.inputBackgroundTransparent)}
                onChange={(event) => updateBlockProps(block.id, { inputBackgroundTransparent: event.target.checked })}
              />
              No field background
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Field Align
              <select value={props.inputAlign || "left"} onChange={(event) => updateBlockProps(block.id, { inputAlign: event.target.value })} className={`mt-2 ${inputClass}`}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </div>
        <ColorField label="Button Color" value={props.buttonColor || props.submitColor || props.backgroundColor || "#178218"} onChange={(event) => updateBlockProps(block.id, { buttonColor: event.target.value })} />
        <TextStyleGroup
          title="Button Text"
          colorLabel="Button Text Color"
          sizeLabel="Button Text Size"
          weightLabel="Button Text Weight"
          color={props.buttonTextColor || props.color || "#ffffff"}
          size={props.buttonFontSize || props.fontSize || 14}
          weight={props.buttonFontWeight || "800"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "buttonTextColor", size: "buttonFontSize", weight: "buttonFontWeight" }}
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Form Radius" type="number" value={props.radius || 8} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
          <InputField label="Button Radius" type="number" value={props.buttonRadius || 6} onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })} />
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Button Box</p>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Button Width" value={props.buttonWidth || "100%"} onChange={(event) => updateBlockProps(block.id, { buttonWidth: event.target.value })} />
            <InputField label="Button Height" type="number" value={props.buttonHeight ?? 44} onChange={(event) => updateBlockProps(block.id, { buttonHeight: Number(event.target.value) })} />
            <label className="block text-sm font-semibold text-slate-700">
              Button Align
              <select value={props.buttonAlign || props.align || "left"} onChange={(event) => updateBlockProps(block.id, { buttonAlign: event.target.value })} className={`mt-2 ${inputClass}`}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Canvas Spacing</p>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Form Padding" value={props.padding || "20px"} onChange={(event) => updateBlockProps(block.id, { padding: event.target.value })} />
            <InputField label="Fields Top Gap" type="number" value={props.fieldTopGap ?? 14} onChange={(event) => updateBlockProps(block.id, { fieldTopGap: Number(event.target.value) })} />
            <InputField label="Field Gap" type="number" value={props.fieldGap ?? 10} onChange={(event) => updateBlockProps(block.id, { fieldGap: Number(event.target.value) })} />
            <InputField label="Label Gap" type="number" value={props.labelGap ?? 5} onChange={(event) => updateBlockProps(block.id, { labelGap: Number(event.target.value) })} />
            <InputField label="Button Top Gap" type="number" value={props.buttonTopGap ?? 12} onChange={(event) => updateBlockProps(block.id, { buttonTopGap: Number(event.target.value) })} />
          </div>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-700">Success</p>
          <div className="grid gap-3">
            <InputField label="Thank You Title" value={props.thankYouTitle || "Thank you"} onChange={(event) => updateBlockProps(block.id, { thankYouTitle: event.target.value })} />
            <label className="block text-sm font-semibold text-slate-700">
              Thank You Message
              <textarea
                value={props.thankYouText || "Your response was submitted."}
                onChange={(event) => updateBlockProps(block.id, { thankYouText: event.target.value })}
                rows={2}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Background" value={props.thankYouBackgroundColor || "#ecfdf5"} onChange={(event) => updateBlockProps(block.id, { thankYouBackgroundColor: event.target.value })} />
              <ColorField label="Border" value={props.thankYouBorderColor || "#34d399"} onChange={(event) => updateBlockProps(block.id, { thankYouBorderColor: event.target.value })} />
              <ColorField label="Title Color" value={props.thankYouTitleColor || "#047857"} onChange={(event) => updateBlockProps(block.id, { thankYouTitleColor: event.target.value })} />
              <ColorField label="Message Color" value={props.thankYouTextColor || "#064e3b"} onChange={(event) => updateBlockProps(block.id, { thankYouTextColor: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Radius" type="number" value={props.thankYouRadius ?? 10} onChange={(event) => updateBlockProps(block.id, { thankYouRadius: Number(event.target.value) })} />
              <InputField label="Padding" value={props.thankYouPadding || "16px"} onChange={(event) => updateBlockProps(block.id, { thankYouPadding: event.target.value })} />
              <InputField label="Title Size" type="number" value={props.thankYouTitleSize ?? 18} onChange={(event) => updateBlockProps(block.id, { thankYouTitleSize: Number(event.target.value) })} />
              <InputField label="Message Size" type="number" value={props.thankYouTextSize ?? 14} onChange={(event) => updateBlockProps(block.id, { thankYouTextSize: Number(event.target.value) })} />
            </div>
            <div
              className="rounded-md border p-4 text-center"
              style={{
                backgroundColor: props.thankYouBackgroundColor || "#ecfdf5",
                borderColor: props.thankYouBorderColor || "#34d399",
                borderRadius: `${Number(props.thankYouRadius ?? 10)}px`,
                padding: props.thankYouPadding || "16px"
              }}
            >
              <div
                className="font-extrabold"
                style={{
                  color: props.thankYouTitleColor || "#047857",
                  fontSize: `${Number(props.thankYouTitleSize ?? 18)}px`
                }}
              >
                {props.thankYouTitle || "Thank you"}
              </div>
              <div
                className="mt-1 font-semibold"
                style={{
                  color: props.thankYouTextColor || "#064e3b",
                  fontSize: `${Number(props.thankYouTextSize ?? 14)}px`
                }}
              >
                {props.thankYouText || "Your response was submitted."}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Fields</p>
            <button type="button" onClick={addFormField} className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold">Add</button>
          </div>
          <div className="space-y-3">
            {(props.fields || []).map((field, index) => (
              <div key={`${field.name}-${index}`} className="rounded-md border border-slate-200 p-3">
                <div className="grid gap-2">
                  <input value={field.label || ""} onChange={(event) => updateFormField(index, { label: event.target.value })} placeholder="Label" className={inputClass} />
                  <input value={field.name || ""} onChange={(event) => updateFormField(index, { name: event.target.value })} placeholder="name" className={inputClass} />
                  <input value={field.placeholder || ""} onChange={(event) => updateFormField(index, { placeholder: event.target.value })} placeholder="Placeholder" className={inputClass} />
                  <select value={field.type || "text"} onChange={(event) => updateFormField(index, { type: event.target.value })} className={inputClass}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="radio">Radio</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                  {["select", "radio", "checkbox"].includes(field.type) && (
                    <textarea
                      value={(field.options || []).map((option) => option.label || option.value || option).join("\n")}
                      onChange={(event) => updateFormField(index, {
                        options: event.target.value.split("\n").filter(Boolean).map((option) => ({
                          label: option,
                          value: option.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                        }))
                      })}
                      placeholder={"Options\nOne per line"}
                      rows={3}
                      className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={Boolean(field.required)} onChange={(event) => updateFormField(index, { required: event.target.checked })} />
                      Required
                    </label>
                    <button type="button" onClick={() => removeFormField(index)} className="ml-auto rounded-md border border-red-300 px-2 py-1 text-sm text-red-600">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (["poll", "survey", "rating", "nps", "appointment", "booking", "quiz", "productFeedback", "rsvp", "productList", "conditionalGroup"].includes(block.type)) {
    return (
      <div className="grid gap-3">
        <InputField label="Title" value={props.title || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
        {"question" in props && (
          <InputField label="Question" value={props.question || ""} onChange={(event) => updateBlockProps(block.id, { question: event.target.value })} />
        )}
        {"collection" in props && (
          <InputField label="Collection Variable" value={props.collection || "products"} onChange={(event) => updateBlockProps(block.id, { collection: event.target.value })} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={props.formBackgroundColor || "#ffffff"} onChange={(event) => updateBlockProps(block.id, { formBackgroundColor: event.target.value })} />
          <ColorField label="Border Color" value={props.borderColor || "#e2e8f0"} onChange={(event) => updateBlockProps(block.id, { borderColor: event.target.value })} />
        </div>
        <TextStyleGroup
          title="Title Text"
          colorLabel="Title Color"
          sizeLabel="Title Size"
          weightLabel="Title Weight"
          color={props.titleColor || "#020617"}
          size={props.titleSize || 18}
          weight={props.titleWeight || "800"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "titleColor", size: "titleSize", weight: "titleWeight" }}
        />
        <TextStyleGroup
          title="Description Text"
          colorLabel="Description Color"
          sizeLabel="Description Size"
          weightLabel="Description Weight"
          color={props.descriptionColor || props.textColor || "#64748b"}
          size={props.descriptionSize || props.textSize || 14}
          weight={props.descriptionWeight || props.textWeight || "400"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "descriptionColor", size: "descriptionSize", weight: "descriptionWeight" }}
        />
        <ColorField label="Input Background" value={props.inputBackgroundColor || "#f8fafc"} onChange={(event) => updateBlockProps(block.id, { inputBackgroundColor: event.target.value })} />
        <TextStyleGroup
          title="Input Label"
          colorLabel="Label Color"
          sizeLabel="Label Size"
          weightLabel="Label Weight"
          color={props.inputLabelColor || props.inputTextColor || "#64748b"}
          size={props.inputFontSize || 14}
          weight={props.inputFontWeight || "600"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "inputLabelColor", size: "inputFontSize", weight: "inputFontWeight" }}
        />
        <ColorField label="Input Box Text Color" value={props.inputValueColor || props.inputTextColor || "#64748b"} onChange={(event) => updateBlockProps(block.id, { inputValueColor: event.target.value })} />
        <ColorField label="Button Color" value={props.buttonColor || props.submitColor || props.backgroundColor || "#178218"} onChange={(event) => updateBlockProps(block.id, { buttonColor: event.target.value })} />
        <TextStyleGroup
          title="Button Text"
          colorLabel="Button Text Color"
          sizeLabel="Button Text Size"
          weightLabel="Button Text Weight"
          color={props.buttonTextColor || props.color || "#ffffff"}
          size={props.buttonFontSize || props.fontSize || 14}
          weight={props.buttonFontWeight || "800"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "buttonTextColor", size: "buttonFontSize", weight: "buttonFontWeight" }}
        />
        <label className="block text-sm font-semibold text-slate-700">
          Props JSON
          <textarea
            value={JSON.stringify(props, null, 2)}
            onChange={(event) => {
              try {
                updateBlockProps(block.id, JSON.parse(event.target.value));
              } catch {
                // Keep typing invalid JSON until it becomes valid.
              }
            }}
            rows={10}
            className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
      </div>
    );
  }

  if (block.type === "card") {
    return (
      <div className="grid gap-3">
        <InputField label="Title" value={props.title || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Text
          <textarea value={props.text || ""} onChange={(event) => updateBlockProps(block.id, { text: event.target.value })} rows={3} className={`mt-2 ${inputClass}`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Background" value={props.backgroundColor || "#f8fafc"} onChange={(event) => updateBlockProps(block.id, { backgroundColor: event.target.value })} />
          <ColorField label="Text Color" value={props.textColor || "#64748b"} onChange={(event) => updateBlockProps(block.id, { textColor: event.target.value })} />
        </div>
        <TextStyleGroup
          title="Title Text"
          colorLabel="Title Color"
          sizeLabel="Title Size"
          weightLabel="Title Weight"
          color={props.titleColor || props.textColor || "#0f172a"}
          size={props.titleSize || 20}
          weight={props.titleWeight || "800"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "titleColor", size: "titleSize", weight: "titleWeight" }}
        />
        <TextStyleGroup
          title="Body Text"
          colorLabel="Body Color"
          sizeLabel="Body Size"
          weightLabel="Body Weight"
          color={props.textColor || "#64748b"}
          size={props.textSize || 14}
          weight={props.textWeight || "400"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "textColor", size: "textSize", weight: "textWeight" }}
        />
        <InputField label="Radius" type="number" value={props.radius || 8} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
        <InputField label="Padding" value={props.padding || "18px"} onChange={(event) => updateBlockProps(block.id, { padding: event.target.value })} />
        <InputField label="Border" value={props.border || "1px solid #e5e7eb"} onChange={(event) => updateBlockProps(block.id, { border: event.target.value })} />
      </div>
    );
  }

  if (block.type === "shape") {
    return (
      <div className="grid gap-3">
        <label className="block text-sm font-semibold text-slate-700">
          Shape
          <select value={props.shape || "rectangle"} onChange={(event) => updateBlockProps(block.id, { shape: event.target.value })} className={`mt-2 ${inputClass}`}>
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="pill">Pill</option>
            <option value="line">Line</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Width" type="number" value={props.width || 160} onChange={(event) => updateBlockProps(block.id, { width: Number(event.target.value) })} />
          <InputField label="Height" type="number" value={props.height || 80} onChange={(event) => updateBlockProps(block.id, { height: Number(event.target.value) })} />
        </div>
        <InputField label="Radius" type="number" value={props.radius || 8} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Line Width" type="number" value={props.lineWidth || 2} onChange={(event) => updateBlockProps(block.id, { lineWidth: Number(event.target.value) })} />
          <label className="block text-sm font-semibold text-slate-700">
            Line Style
            <select value={props.lineStyle || "solid"} onChange={(event) => updateBlockProps(block.id, { lineStyle: event.target.value })} className={`mt-2 ${inputClass}`}>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </label>
        </div>
        <InputField label="Border" value={props.border || ""} onChange={(event) => updateBlockProps(block.id, { border: event.target.value })} />
        <ColorField label="Fill / Line Color" value={props.backgroundColor || "#178218"} onChange={(event) => updateBlockProps(block.id, { backgroundColor: event.target.value })} />
      </div>
    );
  }

  if (block.type === "rawHtml") {
    return (
      <label className="block text-sm font-semibold text-slate-700">
        HTML
        <textarea value={props.html || ""} onChange={(event) => updateBlockProps(block.id, { html: event.target.value })} rows={8} className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </label>
    );
  }

  if (["navbar", "accordion", "carousel", "pricingCard"].includes(block.type)) {
    const listKey = block.type === "navbar"
      ? "links"
      : block.type === "carousel"
        ? "slides"
        : block.type === "pricingCard"
          ? "features"
          : "items";

    return (
      <div className="grid gap-3">
        <label className="block text-sm font-semibold text-slate-700">
          {listKey} JSON
          <textarea
            value={JSON.stringify(props[listKey] || [], null, 2)}
            onChange={(event) => {
              try {
                updateBlockProps(block.id, { [listKey]: JSON.parse(event.target.value) });
              } catch {
                // Keep typing invalid JSON until it becomes valid.
              }
            }}
            rows={8}
            className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        {block.type === "pricingCard" && (
          <>
            <InputField label="Title" value={props.title || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
            <InputField label="Price" value={props.price || ""} onChange={(event) => updateBlockProps(block.id, { price: event.target.value })} />
          </>
        )}
        <TextStyleGroup
          title="Text Style"
          colorLabel="Text Color"
          sizeLabel="Text Size"
          weightLabel="Text Weight"
          color={props.textColor || "#0f172a"}
          size={props.textSize || props.fontSize || 14}
          weight={props.textWeight || props.fontWeight || "600"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "textColor", size: "textSize", weight: "textWeight" }}
        />
      </div>
    );
  }

  if (["logoHeader", "productCard", "testimonial", "countdown"].includes(block.type)) {
    return (
      <div className="grid gap-3">
        <InputField label="Title" value={props.title || props.label || ""} onChange={(event) => updateBlockProps(block.id, block.type === "countdown" ? { label: event.target.value } : { title: event.target.value })} />
        {block.type === "logoHeader" && <InputField label="Logo URL" value={props.logoUrl || ""} onChange={(event) => updateBlockProps(block.id, { logoUrl: event.target.value })} />}
        {block.type === "productCard" && (
          <>
            <InputField label="Image URL" value={props.imageUrl || ""} onChange={(event) => updateBlockProps(block.id, { imageUrl: event.target.value })} />
            <InputField label="Price" value={props.price || ""} onChange={(event) => updateBlockProps(block.id, { price: event.target.value })} />
            <InputField label="Button Text" value={props.buttonText || ""} onChange={(event) => updateBlockProps(block.id, { buttonText: event.target.value })} />
            <InputField label="Link" value={props.href || ""} onChange={(event) => updateBlockProps(block.id, { href: event.target.value })} />
          </>
        )}
        {block.type === "testimonial" && (
          <>
            <InputField label="Quote" value={props.quote || ""} onChange={(event) => updateBlockProps(block.id, { quote: event.target.value })} />
            <InputField label="Name" value={props.name || ""} onChange={(event) => updateBlockProps(block.id, { name: event.target.value })} />
            <InputField label="Role" value={props.role || ""} onChange={(event) => updateBlockProps(block.id, { role: event.target.value })} />
          </>
        )}
        {block.type === "countdown" && <InputField label="Date" value={props.date || ""} onChange={(event) => updateBlockProps(block.id, { date: event.target.value })} />}
        <TextStyleGroup
          title="Title Text"
          colorLabel="Title Color"
          sizeLabel="Title Size"
          weightLabel="Title Weight"
          color={props.titleColor || props.textColor || "#0f172a"}
          size={props.titleSize || props.fontSize || 16}
          weight={props.titleWeight || props.fontWeight || "800"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "titleColor", size: "titleSize", weight: "titleWeight" }}
        />
        <TextStyleGroup
          title="Body Text"
          colorLabel="Body Color"
          sizeLabel="Body Size"
          weightLabel="Body Weight"
          color={props.textColor || "#64748b"}
          size={props.textSize || 14}
          weight={props.textWeight || "400"}
          onChange={(patch) => updateBlockProps(block.id, patch)}
          keys={{ color: "textColor", size: "textSize", weight: "textWeight" }}
        />
      </div>
    );
  }

  if (block.type === "spacer") {
    return <InputField label="Height" type="number" value={props.height || 24} onChange={(event) => updateBlockProps(block.id, { height: Number(event.target.value) })} />;
  }

  if (block.type === "divider") {
    return (
      <div className="grid gap-3">
        <ColorField label="Color" value={props.color || "#e5e7eb"} onChange={(event) => updateBlockProps(block.id, { color: event.target.value })} />
        <InputField label="Margin" value={props.margin || "12px 0"} placeholder="12px 0" onChange={(event) => updateBlockProps(block.id, { margin: event.target.value })} />
        <div className="grid grid-cols-4 gap-2">
          <InputField label="Top" type="number" value={props.marginTop ?? 12} onChange={(event) => updateBlockProps(block.id, { marginTop: Number(event.target.value) })} />
          <InputField label="Right" type="number" value={props.marginRight ?? 0} onChange={(event) => updateBlockProps(block.id, { marginRight: Number(event.target.value) })} />
          <InputField label="Bottom" type="number" value={props.marginBottom ?? 12} onChange={(event) => updateBlockProps(block.id, { marginBottom: Number(event.target.value) })} />
          <InputField label="Left" type="number" value={props.marginLeft ?? 0} onChange={(event) => updateBlockProps(block.id, { marginLeft: Number(event.target.value) })} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <InputField label="Title" value={props.title || props.label || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value, label: event.target.value })} />
      <label className="block text-sm font-semibold text-slate-700">
        Text
        <textarea value={props.text || props.description || ""} onChange={(event) => updateBlockProps(block.id, { text: event.target.value, description: event.target.value })} rows={3} className={`mt-2 ${inputClass}`} />
      </label>
      <TextStyleGroup
        title="Title Text"
        colorLabel="Title Color"
        sizeLabel="Title Size"
        weightLabel="Title Weight"
        color={props.titleColor || props.textColor || "#0f172a"}
        size={props.titleSize || props.fontSize || 16}
        weight={props.titleWeight || props.fontWeight || "800"}
        onChange={(patch) => updateBlockProps(block.id, patch)}
        keys={{ color: "titleColor", size: "titleSize", weight: "titleWeight" }}
      />
      <TextStyleGroup
        title="Body Text"
        colorLabel="Body Color"
        sizeLabel="Body Size"
        weightLabel="Body Weight"
        color={props.textColor || "#64748b"}
        size={props.textSize || 14}
        weight={props.textWeight || "400"}
        onChange={(patch) => updateBlockProps(block.id, patch)}
        keys={{ color: "textColor", size: "textSize", weight: "textWeight" }}
      />
    </div>
  );
};

const LegacyRawTemplateForm = ({ rawTemplate, updateRawField }) => (
  <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3">
      <InputField name="name" value={templateText(rawTemplate, "name")} onChange={updateRawField} placeholder="Template name" required />
      <InputField name="slug" value={templateText(rawTemplate, "slug")} onChange={updateRawField} placeholder="template-slug" />
      <InputField name="subject" value={templateText(rawTemplate, "subject")} onChange={updateRawField} placeholder="Subject" />
    </div>
    <textarea name="html" value={rawTemplate.html} onChange={updateRawField} placeholder="HTML email template" required rows={10} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    <textarea name="amp" value={rawTemplate.amp} onChange={updateRawField} placeholder="Optional AMP email template" rows={6} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    <textarea name="formHtml" value={rawTemplate.formHtml} onChange={updateRawField} placeholder="Hosted form HTML" rows={8} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
  </div>
);

const LegacySavedTemplates = ({
  listLoading,
  templates,
  activeTemplateId,
  loadSavedTemplate,
  versions,
  restoreVersion,
  compact = false
}) => (
  <div className={compact ? "mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" : "border-t border-slate-200 bg-slate-50 p-5"}>
    <div className={compact ? "space-y-3" : "flex flex-col gap-3 md:flex-row md:items-start md:justify-between"}>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Saved Templates</h3>
        <p className={compact ? "mt-1 text-xs text-slate-500" : "mt-1 text-sm text-slate-500"}>Load saved builder templates.</p>
      </div>
      {activeTemplateId && !compact && (
        <div className="w-full rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:w-80">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Version Restore</p>
          <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
            {versions.length === 0 && <p className="text-sm text-slate-500">No versions yet.</p>}
            {versions.map((version) => (
              <button
                key={version._id}
                type="button"
                onClick={() => restoreVersion(version.version)}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="text-sm font-semibold text-slate-800">v{version.version}</span>
                <span className="text-xs text-slate-500">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    <div className={compact ? "mt-3 max-h-44 space-y-2 overflow-y-auto pr-1" : "mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3"}>
      {listLoading && <p className="text-sm text-slate-500">Loading templates...</p>}
      {!listLoading && templates.length === 0 && <p className="text-sm text-slate-500">No templates saved yet.</p>}
      {templates.map((item) => (
        <button
          key={templateIdentifier(item) || templateText(item, "name", "saved-template")}
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("template/id", templateIdentifier(item));
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => loadSavedTemplate(item)}
          className={`cursor-grab rounded-lg border bg-white p-3 text-left shadow-sm hover:border-emerald-400 hover:bg-emerald-50 active:cursor-grabbing ${
            activeTemplateId === templateIdentifier(item) ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">{templateText(item, "name", "Untitled template")}</p>
              <p className="text-sm text-slate-500">{templateText(item, "slug")}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {item.sourceJson ? "Builder" : "Raw"}
            </span>
          </div>
        </button>
      ))}
    </div>
    {activeTemplateId && compact && versions.length > 0 && (
      <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-500">
          Versions
        </summary>
        <div className="mt-2 max-h-28 space-y-2 overflow-y-auto">
          {versions.map((version) => (
            <button
              key={version._id}
              type="button"
              onClick={() => restoreVersion(version.version)}
              className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1 text-left text-xs hover:bg-slate-50"
            >
              <span className="font-semibold text-slate-800">v{version.version}</span>
              <span className="text-slate-500">{new Date(version.createdAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      </details>
    )}
  </div>
);

export default TemplateForm;
