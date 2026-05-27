import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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

const initialTemplate = {
  name: "Builder Demo Template",
  slug: "builder-demo",
  subject: "Hi {{email}}, check your eligibility",
  status: "draft"
};

const starterSource = {
  version: 1,
  theme: {
    width: 600,
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
  }
];

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
      src: "https://via.placeholder.com/600x320.png?text=Campaign+Image",
      alt: "Campaign image",
      width: 600,
      height: 320,
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
      logoUrl: "https://via.placeholder.com/180x60.png?text=Logo",
      logoAlt: "Logo",
      logoWidth: 140,
      title: "Brand Header",
      align: "center"
    }
  },
  productCard: {
    type: "productCard",
    props: {
      imageUrl: "https://via.placeholder.com/600x320.png?text=Product",
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
        { imageUrl: "https://via.placeholder.com/600x260.png?text=Slide+1", title: "First slide" },
        { imageUrl: "https://via.placeholder.com/600x260.png?text=Slide+2", title: "Second slide" }
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
  divider: {
    type: "divider",
    props: {
      color: "#e5e7eb"
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
  social: {
    type: "rawHtml",
    props: {
      html: "<p style=\"text-align:center;\"><a href=\"https://facebook.com\">Facebook</a> &nbsp; <a href=\"https://instagram.com\">Instagram</a> &nbsp; <a href=\"https://linkedin.com\">LinkedIn</a></p>"
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
    items: ["hero", "twoColumn", "card"]
  },
  {
    title: "Designs",
    items: ["image", "offer", "coupon", "productCard", "pricingCard", "testimonial"]
  },
  {
    title: "Widgets",
    items: ["social", "rawHtml", "countdown", "accordion", "carousel"]
  },
  {
    title: "Forms",
    items: ["form", "leadForm", "contactForm", "registrationForm", "appointmentForm", "survey", "rating", "nps"]
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
  rawHtml: "HTML",
  form: "Form",
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
  rawHtml: "Custom code",
  form: "Basic fields",
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

const cloneBlock = (block, fallbackType = "block") => ({
  ...block,
  id: `${block?.type || fallbackType}-${Date.now()}`,
  props: {
    ...(block?.props || {})
  }
});

const replaceSampleValues = (html = "") => {
  const sample = {
    email: "demo@example.com",
    trackingId: "preview-tracking-id",
    campaignName: "startup-loan",
    campaignType: "Loan",
    subject: "Preview subject",
    unsubscribeUrl: "#unsubscribe",
    formHtmlUrl: "https://example.com/hosted-form",
    directFormHtmlUrl: "https://example.com/hosted-form",
    formAmpUrl: "https://example.com/amp-form-submit",
    formActionUrl: "https://example.com/form-submit",
    baseUrl: "http://localhost:5000",
    templateId: "preview-template-id",
    templateSlug: "preview-template",
    preheader: "Preview"
  };

  const replaced = Object.entries(sample).reduce((next, [key, value]) => {
    return next.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
  }, html);

  return replaced.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key) => {
    return `[${key}]`;
  });
};

const TemplateForm = () => {
  const [mode, setMode] = useState("builder");
  const [template, setTemplate] = useState(initialTemplate);
  const [rawTemplate, setRawTemplate] = useState(emptyRawTemplate);
  const [sourceJson, setSourceJson] = useState(starterSource);
  const [jsonText, setJsonText] = useState(JSON.stringify(starterSource, null, 2));
  const [selectedBlockId, setSelectedBlockId] = useState(starterSource.blocks[0]?.id);
  const [preview, setPreview] = useState({
    html: "",
    amp: "",
    formHtml: ""
  });
  const [previewTab, setPreviewTab] = useState("html");
  const [workspaceTab, setWorkspaceTab] = useState("canvas");
  const [previewViewport, setPreviewViewport] = useState("desktop");
  const [sideBySidePreview, setSideBySidePreview] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState("");
  const [versions, setVersions] = useState([]);
  const [catalogBlocks, setCatalogBlocks] = useState([]);
  const [savedBlocks, setSavedBlocks] = useState([]);
  const [editorConfig, setEditorConfig] = useState(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [builderSection, setBuilderSection] = useState("layouts");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewValidation, setPreviewValidation] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [jsonError, setJsonError] = useState("");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [clipboardBlock, setClipboardBlock] = useState(null);

  const selectedBlock = useMemo(() => {
    return sourceJson.blocks?.find((block) => block.id === selectedBlockId);
  }, [selectedBlockId, sourceJson.blocks]);

  const dynamicBlockPresets = useMemo(() => {
    const backendPresets = Object.fromEntries(
      catalogBlocks.map((item) => [
        item.type,
        item.block
      ])
    );

    return {
      ...blockPresets,
      ...backendPresets
    };
  }, [catalogBlocks]);

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
    ...Object.fromEntries(catalogBlocks.map((item) => [item.type, item.label || item.type]))
  }), [catalogBlocks]);

  const previewMarkup = preview?.[previewTab] || "";
  const renderedPreviewMarkup = replaceSampleValues(previewMarkup);
  const templateStats = useMemo(() => {
    const blocks = sourceJson.blocks || [];
    const interactiveTypes = new Set([
      "form",
      "poll",
      "survey",
      "rating",
      "nps",
      "appointment",
      "booking",
      "quiz",
      "productFeedback",
      "rsvp"
    ]);

    return {
      blocks: blocks.length,
      interactive: blocks.filter((block) => interactiveTypes.has(block.type)).length,
      variables: previewValidation?.warnings
        ?.find((issue) => issue.code === "MISSING_VARIABLE_VALUES")
        ?.variables?.length || 0,
      errors: previewValidation?.errors?.length || 0,
      warnings: previewValidation?.warnings?.length || 0
    };
  }, [sourceJson.blocks, previewValidation]);
  const builderPayload = () => ({
    name: template.name,
    slug: template.slug,
    subject: template.subject,
    status: template.status || "draft",
    sourceJson: {
      ...sourceJson,
      name: template.name,
      subject: template.subject
    }
  });
  const rawPayload = () => ({
    ...rawTemplate,
    status: rawTemplate.status || "draft"
  });

  const fetchTemplates = async () => {
    try {
      setListLoading(true);
      const response = await axios.get(apiUrl("/api/templates"));
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.log(error);
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
      const response = await axios.get(apiUrl(`/api/templates/${templateId}/versions`));
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

    if (record) {
      setHistory((items) => [...items.slice(-30), sourceJson]);
      setFuture([]);
    }

    setSourceJson(nextSourceJson);
    setJsonText(JSON.stringify(nextSourceJson, null, 2));
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
    const index = sourceJson.blocks.findIndex((block) => block.id === blockId);

    if (index < 0) {
      return;
    }

    const duplicate = {
      ...sourceJson.blocks[index],
      id: `${sourceJson.blocks[index].type}-${Date.now()}`,
      props: {
        ...(sourceJson.blocks[index].props || {})
      }
    };
    const nextBlocks = [...sourceJson.blocks];

    nextBlocks.splice(index + 1, 0, duplicate);
    syncJson({
      ...sourceJson,
      blocks: nextBlocks
    });
    setSelectedBlockId(duplicate.id);
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

    const pasted = {
      ...clipboardBlock,
      id: `${clipboardBlock.type}-${Date.now()}`,
      props: {
        ...(clipboardBlock.props || {})
      }
    };

    syncJson({
      ...sourceJson,
      blocks: [...sourceJson.blocks, pasted]
    });
    setSelectedBlockId(pasted.id);
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
    syncJson({
      ...sourceJson,
      theme: {
        ...sourceJson.theme,
        [key]: value
      }
    });
  };

  const updateBlockProps = (blockId, patch) => {
    syncJson({
      ...sourceJson,
      blocks: sourceJson.blocks.map((block) => (
        block.id === blockId
          ? {
              ...block,
              props: {
                ...block.props,
                ...patch
              }
            }
          : block
      ))
    });
  };

  const addBlock = (type) => {
    const preset = dynamicBlockPresets[type];

    if (!preset) {
      return;
    }

    const block = cloneBlock(preset, type);

    syncJson({
      ...sourceJson,
      blocks: [...(sourceJson.blocks || []), block]
    });
    setSelectedBlockId(block.id);
  };

  const insertBlock = (type, index) => {
    const preset = dynamicBlockPresets[type];

    if (!preset) {
      return;
    }

    const block = cloneBlock(preset, type);
    const nextBlocks = [...(sourceJson.blocks || [])];
    const targetIndex = Math.max(0, Math.min(index, nextBlocks.length));

    nextBlocks.splice(targetIndex, 0, block);
    syncJson({
      ...sourceJson,
      blocks: nextBlocks
    });
    setSelectedBlockId(block.id);
  };

  const moveBlockToIndex = (blockId, index) => {
    const currentIndex = sourceJson.blocks.findIndex((block) => block.id === blockId);

    if (currentIndex < 0) {
      return;
    }

    const nextBlocks = [...sourceJson.blocks];
    const [block] = nextBlocks.splice(currentIndex, 1);
    const targetIndex = Math.max(0, Math.min(index, nextBlocks.length));

    nextBlocks.splice(targetIndex, 0, block);
    syncJson({
      ...sourceJson,
      blocks: nextBlocks
    });
    setSelectedBlockId(block.id);
  };

  const insertBlocksAtIndex = (blocks = [], index = sourceJson.blocks.length) => {
    if (!blocks.length) {
      return;
    }

    const clonedBlocks = blocks.map((block) => cloneBlock(block, block.type));
    const nextBlocks = [...(sourceJson.blocks || [])];
    const targetIndex = Math.max(0, Math.min(index, nextBlocks.length));

    nextBlocks.splice(targetIndex, 0, ...clonedBlocks);
    syncJson({
      ...sourceJson,
      blocks: nextBlocks
    });
    setSelectedBlockId(clonedBlocks[0]?.id || "");
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
        const nextBlocks = [...(sourceJson.blocks || [])];
        const block = cloneBlock(savedBlock.block, savedBlock.type);
        const targetIndex = Math.max(0, Math.min(index, nextBlocks.length));

        nextBlocks.splice(targetIndex, 0, block);
        syncJson({
          ...sourceJson,
          blocks: nextBlocks
        });
        setSelectedBlockId(block.id);
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
    const nextBlocks = sourceJson.blocks.filter((block) => block.id !== blockId);

    syncJson({
      ...sourceJson,
      blocks: nextBlocks
    });
    setSelectedBlockId(nextBlocks[0]?.id || "");
  };

  const moveBlock = (blockId, direction) => {
    const index = sourceJson.blocks.findIndex((block) => block.id === blockId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= sourceJson.blocks.length) {
      return;
    }

    const nextBlocks = [...sourceJson.blocks];
    const [block] = nextBlocks.splice(index, 1);
    nextBlocks.splice(nextIndex, 0, block);

    syncJson({
      ...sourceJson,
      blocks: nextBlocks
    });
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
    try {
      setPreviewError("");
      if (silent) {
        setPreviewLoading(true);
      } else {
        setLoading(true);
      }

      const response = await axios.post(apiUrl("/api/templates/builder/preview"), {
        sourceJson: {
          ...sourceJson,
          name: template.name,
          subject: template.subject
        }
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
      const validation = error.response?.data?.validation || null;
      const message = error.response?.data?.message || "Template validation failed";

      setPreviewValidation(validation);
      setPreviewError(message);

      if (!silent) {
        alert(message);
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
    }, 500);

    return () => clearTimeout(timer);
  }, [mode, sourceJson, template.name, template.subject]);

  const saveTemplate = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const validation = await validateCurrentTemplate({ silent: true });
      const nextStatus = mode === "builder"
        ? template.status || "draft"
        : rawTemplate.status || "draft";

      if (nextStatus === "published" && validation && !validation.valid) {
        alert("Fix validation errors before publishing this template.");
        return;
      }

      if (mode === "builder") {
        const response = await axios.post(apiUrl("/api/templates"), {
          ...builderPayload(),
          isActive: true
        });

        setActiveTemplateId(response.data.template?._id || "");
        setPreviewValidation(response.data.validation || validation || null);
        setPreview({
          html: response.data.template?.html || "",
          amp: response.data.template?.amp || "",
          formHtml: response.data.template?.formHtml || "",
          text: response.data.template?.text || ""
        });
        await fetchVersions(response.data.template?._id);
      } else {
        const response = await axios.post(apiUrl("/api/templates"), rawPayload());
        setPreviewValidation(response.data.validation || validation || null);
        setPreview({
          html: response.data.template?.html || "",
          amp: response.data.template?.amp || "",
          formHtml: response.data.template?.formHtml || "",
          text: response.data.template?.text || ""
        });
      }

      alert("Template saved successfully");
      await fetchTemplates();
      window.dispatchEvent(new Event("templates:changed"));
    } catch (error) {
      console.log(error);
      setPreviewValidation(error.response?.data?.validation || previewValidation);
      alert(error.response?.data?.message || "Template save failed");
    } finally {
      setLoading(false);
    }
  };

  const loadStarter = () => {
    setTemplate(initialTemplate);
    syncJson(starterSource);
    setSelectedBlockId(starterSource.blocks[0]?.id);
    setPreview(null);
    setMode("builder");
    setActiveTemplateId("");
    setVersions([]);
  };

  const loadSavedTemplate = async (templateId) => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl(`/api/templates/${templateId}`));
      const savedTemplate = response.data.template;

      if (!savedTemplate?.sourceJson) {
        alert("This saved template was created from raw HTML, so it cannot be loaded into the visual builder.");
        return;
      }

      setTemplate({
        name: savedTemplate.name || "",
        slug: savedTemplate.slug || "",
        subject: savedTemplate.subject || "",
        status: savedTemplate.status || "draft"
      });
      syncJson(savedTemplate.sourceJson);
      setSelectedBlockId(savedTemplate.sourceJson.blocks?.[0]?.id || "");
      setActiveTemplateId(savedTemplate._id);
      await fetchVersions(savedTemplate._id);
      setMode("builder");
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
      const response = await axios.post(apiUrl(`/api/templates/${activeTemplateId}/versions/${version}/restore`));
      const restoredTemplate = response.data.template;

      setTemplate({
        name: restoredTemplate.name || "",
        slug: restoredTemplate.slug || "",
        subject: restoredTemplate.subject || "",
        status: restoredTemplate.status || "draft"
      });
      syncJson(restoredTemplate.sourceJson);
      setSelectedBlockId(restoredTemplate.sourceJson?.blocks?.[0]?.id || "");
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

  return (
    <section className="w-full max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">Template Studio</h2>
              <p className="text-xs text-slate-500">Build, validate, preview, and save interactive email templates.</p>
            </div>
            <div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-slate-300 bg-slate-50 p-1">
              {["builder", "raw"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${
                    mode === item
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {item === "raw" ? "Raw HTML" : "Builder"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StudioPill label="Blocks" value={templateStats.blocks} />
            <StudioPill label="Issues" value={`${templateStats.errors}/${templateStats.warnings}`} tone={templateStats.errors ? "danger" : templateStats.warnings ? "warn" : "default"} />
            <button
              type="button"
              onClick={loadStarter}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Starter
            </button>
            <button
              type="button"
              onClick={loadRawExample}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Raw Example
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={saveTemplate} className="min-w-0 space-y-4 p-3 sm:p-4">
        {mode === "builder" ? (
          <>
            <div
              className={`grid min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white xl:h-[82vh] xl:min-h-[680px] ${
                leftPanelCollapsed
                  ? "xl:grid-cols-[minmax(0,1fr)_360px]"
                  : "xl:grid-cols-[430px_minmax(0,1fr)_360px]"
              }`}
            >
              {!leftPanelCollapsed && (
              <aside className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
                <BuilderRail
                  sections={builderSections}
                  activeSection={builderSection}
                  setActiveSection={setBuilderSection}
                  collapse={() => setLeftPanelCollapsed(true)}
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
                  setSelectedBlockId={setSelectedBlockId}
                  handleBuilderDrop={handleBuilderDrop}
                  loadTemplate={(item) => {
                    setTemplate({
                      name: item.name,
                      slug: item.slug,
                      subject: item.subject,
                      status: template.status || "draft"
                    });
                    syncJson(item.sourceJson);
                    setSelectedBlockId(item.sourceJson.blocks?.[0]?.id || "");
                    setMode("builder");
                  }}
                />
              </aside>
              )}

              <main className="min-w-0 space-y-4 bg-slate-100 p-3 sm:p-5">
                {leftPanelCollapsed && (
                  <button
                    type="button"
                    onClick={() => setLeftPanelCollapsed(false)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Show Builder Panel
                  </button>
                )}
                <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <div className="inline-flex max-w-full overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-1">
                      {["canvas", "preview"].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setWorkspaceTab(tab)}
                          className={`rounded-md px-3 py-2 text-xs font-bold capitalize ${
                            workspaceTab === tab
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-white"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <select
                      value={previewViewport}
                      onChange={(event) => setPreviewViewport(event.target.value)}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={previewBuilder}
                    disabled={loading}
                    className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {loading ? "Generating..." : "Preview"}
                  </button>
                  <button
                    type="button"
                    onClick={() => validateCurrentTemplate()}
                    disabled={previewLoading}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {previewLoading ? "Checking..." : "Validate"}
                  </button>
                  </div>
                </div>
                <ValidationSummary validation={previewValidation} />
                </div>

                <div className="min-w-0 min-h-[420px] overflow-visible xl:h-[calc(78vh-150px)] xl:min-h-[470px] xl:overflow-y-auto xl:pr-1">
                  {workspaceTab === "canvas" ? (
                    <EmailCanvas
                      sourceJson={sourceJson}
                      selectedBlockId={selectedBlockId}
                      setSelectedBlockId={setSelectedBlockId}
                      handleBuilderDrop={handleBuilderDrop}
                      updateBlockProps={updateBlockProps}
                      removeBlock={removeBlock}
                      editorConfig={editorConfig}
                    />
                  ) : (
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
                  )}
                </div>
              </main>

              <aside className="min-w-0 space-y-4 border-t border-slate-200 bg-white p-3 sm:p-4 xl:border-l xl:border-t-0 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto">
                <SelectedBlockPanel
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
                />

                <JsonEditor
                  jsonText={jsonText}
                  setJsonText={setJsonText}
                  applyJson={applyJson}
                  jsonError={jsonError}
                />
              </aside>
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

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
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
    <div className="min-w-0 overflow-y-auto p-4 xl:max-h-[calc(100vh-150px)]">
      <div className="mb-4">
        {activeSection !== "style" && <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email Body</p>}
        <h3 className="mt-1 text-2xl font-black text-slate-900">
          {activeSection === "style" ? "Email Body" : titleMap[activeSection] || "Builder"}
        </h3>
      </div>

      {activeSection === "style" && (
        <div className="space-y-4">
          <PanelCard title="Template Settings">
            <div className="grid gap-3">
              <InputField label="Template Name" name="name" value={template.name} onChange={updateTemplateField} required />
              <InputField label="Slug" name="slug" value={template.slug} onChange={updateTemplateField} />
              <InputField label="Subject" name="subject" value={template.subject} onChange={updateTemplateField} />
              <CompactStatusField
                value={template.status || "draft"}
                onChange={(event) => setTemplate({
                  ...template,
                  status: event.target.value
                })}
              />
            </div>
          </PanelCard>
          <ThemeEditor theme={sourceJson.theme} updateTheme={updateTheme} />
        </div>
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
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700">
    {text}
  </div>
);

const DesignSearchChips = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <input
      readOnly
      value=""
      placeholder="Search by keywords or use cases"
      className={inputClass}
    />
    <div className="mt-3 flex flex-wrap gap-2">
      {["All", "Header", "Hero", "Editorial", "Highlights", "E-commerce", "Gallery", "Footer"].map((chip) => (
        <span key={chip} className="rounded-full border border-indigo-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
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
      { type: "testimonial", label: "Customer quote", media: "quote" }
    ]
  }
];

const DesignGallery = ({ loadTemplate }) => (
  <div className="space-y-6">
    {designSections.map((section) => (
      <div key={section.title}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{section.title}</p>
          <button type="button" className="text-xs font-bold text-indigo-600">See all</button>
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
                const template = predefinedTemplates.find((entry) => entry.sourceJson.blocks?.some((block) => block.type === item.type)) || predefinedTemplates[0];
                loadTemplate(template);
              }}
              className="cursor-grab overflow-hidden rounded-md border border-slate-200 bg-white p-2 text-left hover:border-indigo-300 hover:bg-indigo-50 active:cursor-grabbing"
            >
              <DesignPreview media={item.media} />
              <span className="mt-2 block truncate text-xs font-semibold text-slate-700">{item.label}</span>
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
        { type: "poll", label: "Poll" },
        { type: "rating", label: "Thumbs up or down" }
      ]
    },
    {
      title: "Gamification",
      items: [
        { type: "quiz", label: "Quiz" },
        { type: "nps", label: "Spin the wheel" }
      ]
    },
    {
      title: "Media",
      items: [
        { type: "carousel", label: "Image carousel" }
      ]
    },
    {
      title: "E-commerce",
      items: [
        { type: "productList", label: "Shopify Product Catalog" },
        { type: "productCard", label: "Abandoned checkout" }
      ]
    }
  ];

  return (
    <div className="space-y-5">
      <SectionNotice text="Widgets will be added to mobile and desktop." />
      <input readOnly value="" placeholder="Search by widget name" className={inputClass} />
      <div className="flex flex-wrap gap-2">
        {["All", "Ratings", "Gamification", "Media", "Real time updates", "Scheduling", "E-commerce"].map((chip) => (
          <span key={chip} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 first:border-indigo-500 first:text-indigo-600">
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
                className="cursor-grab overflow-hidden rounded-md border border-slate-200 bg-white text-left hover:border-indigo-300 hover:bg-indigo-50 active:cursor-grabbing"
              >
                <div className="border-b border-slate-200 p-3">
                  <ComponentGraphic type={item.type} large />
                </div>
                <span className="block truncate px-3 py-2 text-xs font-semibold text-slate-700">
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
            className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize ${
              mode === item
                ? "border-indigo-500 text-indigo-600"
                : "border-slate-200 text-slate-700"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-slate-700">
        Designed for straightforward use cases like lead generation, NPS survey, feedback collection, etc.
        <span className="block font-semibold text-indigo-600">Learn more</span>
      </p>
      <PanelCard title="Start from scratch">
        <button
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("component/type", "form");
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => addBlock("form")}
          className="w-full cursor-grab rounded-md border border-slate-200 bg-white p-3 text-left hover:border-indigo-300 hover:bg-indigo-50 active:cursor-grabbing"
        >
          <ComponentGraphic type="form" large />
        </button>
      </PanelCard>
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Prebuilt Forms</p>
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
              className="w-full cursor-grab rounded-lg border border-slate-200 bg-white p-5 text-left hover:border-indigo-300 hover:bg-indigo-50 active:cursor-grabbing"
            >
              <p className="mb-4 text-lg font-black text-slate-700">{form.title}</p>
              <FormPreview />
              <span className="sr-only">{labels[form.type] || form.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const FormPreview = () => (
  <div className="space-y-3">
    <div className="h-9 rounded border border-slate-300 bg-white" />
    <div className="grid grid-cols-2 gap-2">
      <div className="h-8 rounded-full bg-emerald-400" />
      <div className="h-8 rounded-full border border-slate-300 bg-slate-50" />
    </div>
    <div className="grid grid-cols-[1fr_0.8fr] gap-2">
      <div className="h-8 rounded-full border border-slate-300 bg-slate-50" />
      <div className="h-8 rounded-full border border-slate-300 bg-slate-50" />
    </div>
    <div className="h-10 rounded border border-slate-300 bg-white" />
    <div className="h-10 w-24 rounded bg-emerald-500" />
  </div>
);

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
  const [query, setQuery] = useState("");
  const elementTypes = ["heading", "text", "button", "image", "divider", "spacer", "social", "bullet", "number", "table", "card"];
  const layoutTypes = ["hero", "card", "twoColumn", "productCard", "testimonial", "offer", "productList"];
  const search = query.trim().toLowerCase();
  const filterTypes = (types) => types.filter((type) => {
    const label = labels[type] || type;
    const description = componentDescriptions[type] || "";
    return `${label} ${type} ${description}`.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xl font-black text-slate-900">Elements & layouts</h4>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Drag and drop elements & layouts to design your email from scratch
        </p>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by keywords or use cases"
        className={inputClass}
      />

      <ElementGrid
        title="Elements"
        items={filterTypes(elementTypes)}
        labels={labels}
        addBlock={addBlock}
      />

      <ElementGrid
        title="Pre-made layouts"
        items={filterTypes(layoutTypes)}
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
          className="cursor-grab rounded-md border border-slate-200 bg-white p-3 text-center hover:border-indigo-300 hover:bg-indigo-50 active:cursor-grabbing"
        >
          <ComponentGraphic type={type} large={large} />
          <span className="mt-2 block truncate text-[11px] font-semibold text-slate-700">
            {labels[type] || type}
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
          <span className="block text-sm font-semibold text-slate-800">{savedBlock.name}</span>
          <span className="block text-xs text-slate-500">{savedBlock.type}</span>
        </button>
      ))}
    </div>
  </div>
);

const templateCategories = ["All", ...new Set(predefinedTemplates.map((template) => template.category))];

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
        <p className="mt-2 text-sm font-bold text-slate-900">{activeTemplate.name}</p>
        <p className="text-xs text-slate-500">{activeTemplate.category}</p>
      </div>

      <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
        {filteredTemplates.map((item) => (
          <button
            key={item.slug}
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("template/predefined-slug", item.slug);
              event.dataTransfer.effectAllowed = "copy";
            }}
            onMouseEnter={() => setActiveTemplate(item)}
            onFocus={() => setActiveTemplate(item)}
            onClick={() => loadTemplate(item)}
            className={`w-full cursor-grab rounded-md border px-3 py-2 text-left active:cursor-grabbing ${
              activeTemplate.slug === item.slug
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <span className="block text-sm font-semibold text-slate-800">{item.name}</span>
            <span className="block text-xs text-slate-500">{item.subject}</span>
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
          <h3
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => updateBlockProps(block.id, { title: event.currentTarget.textContent })}
            className="mb-1 text-lg font-bold text-slate-900"
          >
            {props.title || "Form"}
          </h3>
          {props.description && (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => updateBlockProps(block.id, { description: event.currentTarget.textContent })}
              className="mb-3 text-sm text-slate-500"
            >
              {props.description}
            </p>
          )}
          <div className="space-y-3">
            {(props.fields || props.questions || []).map((field, index) => (
              <label key={`${field.name}-${index}`} className="block text-sm font-semibold text-slate-700">
                {field.label || field.question || field.name}{field.required ? " *" : ""}
                <div className="mt-1 h-10 rounded-md border border-slate-300 bg-slate-50" />
              </label>
            ))}
            {!props.fields && !props.questions && props.question && (
              <label className="block text-sm font-semibold text-slate-700">
                {props.question}
                <div className="mt-1 h-10 rounded-md border border-slate-300 bg-slate-50" />
              </label>
            )}
          </div>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => updateBlockProps(block.id, { submitText: event.currentTarget.textContent })}
            className="mt-4 rounded-md py-3 text-center text-sm font-bold text-white"
            style={{
              backgroundColor: props.backgroundColor || theme.primaryColor || "#178218"
            }}
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
        <div className="h-px w-full" style={{ backgroundColor: props.color || "#e5e7eb" }} />
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
    updateBlockProps(block.id, {
      src: image.src,
      alt: image.alt || props.alt || image.name || "Email image",
      width: image.width || props.width || 600,
      height: image.height || props.height || 320
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
      src: "https://via.placeholder.com/600x220.png?text=Icon+Set",
      alt: "Icon set"
    })],
    ["Get GIFs & Stickers", () => applyImage({
      src: "https://via.placeholder.com/600x220.png?text=GIF+or+Sticker",
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

const ColorField = ({ label, value, onChange }) => (
  <label className="block text-sm font-semibold text-slate-700">
    {label}
    <input
      type="color"
      value={value}
      onChange={onChange}
      className="mt-2 h-10 w-full rounded-md border border-slate-300"
    />
  </label>
);

const getStoredImageGallery = () => {
  try {
    return JSON.parse(localStorage.getItem("trackmini:image-gallery") || "[]");
  } catch {
    return [];
  }
};

const ImageBlockEditor = ({ block, updateBlockProps }) => {
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
    updateBlockProps(block.id, {
      src: image.src,
      alt: image.alt || props.alt || image.name || "Email image",
      width: image.width || props.width || 600,
      height: image.height || props.height || 320
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

    const reader = new FileReader();
    reader.onload = () => {
      applyImage({
        name: file.name,
        src: reader.result,
        alt: file.name.replace(/\.[^.]+$/, ""),
        width: props.width || 600,
        height: props.height || 320
      });
      setUrlStatus("Local preview added. Use hosted URLs before final sending.");
    };
    reader.readAsDataURL(file);
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
            Local images are useful for design preview. Hosted image URLs are recommended for final emails.
          </p>
        </div>
      )}

      <InputField label="Link" value={props.href || ""} onChange={(event) => updateBlockProps(block.id, { href: event.target.value })} />
      <InputField label="Alt Text" value={props.alt || ""} onChange={(event) => updateBlockProps(block.id, { alt: event.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Width" type="number" value={props.width || 600} onChange={(event) => updateBlockProps(block.id, { width: Number(event.target.value) })} />
        <InputField label="Height" type="number" value={props.height || 320} onChange={(event) => updateBlockProps(block.id, { height: Number(event.target.value) })} />
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

const BlockEditor = ({ block, updateBlockProps, updateFormField, addFormField, removeFormField }) => {
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
        <ColorField label="Color" value={props.color || "#111827"} onChange={(event) => updateBlockProps(block.id, { color: event.target.value })} />
      </div>
    );
  }

  if (block.type === "image") {
    return <ImageBlockEditor block={block} updateBlockProps={updateBlockProps} />;
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
        <InputField label="Padding" value={props.padding || "13px 20px"} onChange={(event) => updateBlockProps(block.id, { padding: event.target.value })} />
      </div>
    );
  }

  if (block.type === "form") {
    return (
      <div className="space-y-4">
        <InputField label="Form Title" value={props.title || ""} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
        <InputField label="Submit Text" value={props.submitText || ""} onChange={(event) => updateBlockProps(block.id, { submitText: event.target.value })} />
        <label className="block text-sm font-semibold text-slate-700">
          Description
          <textarea value={props.description || ""} onChange={(event) => updateBlockProps(block.id, { description: event.target.value })} rows={2} className={`mt-2 ${inputClass}`} />
        </label>
        <ColorField label="Button Color" value={props.backgroundColor || "#178218"} onChange={(event) => updateBlockProps(block.id, { backgroundColor: event.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Form Radius" type="number" value={props.radius || 8} onChange={(event) => updateBlockProps(block.id, { radius: Number(event.target.value) })} />
          <InputField label="Button Radius" type="number" value={props.buttonRadius || 6} onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })} />
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
      </div>
    );
  }

  if (block.type === "spacer") {
    return <InputField label="Height" type="number" value={props.height || 24} onChange={(event) => updateBlockProps(block.id, { height: Number(event.target.value) })} />;
  }

  if (block.type === "divider") {
    return <ColorField label="Color" value={props.color || "#e5e7eb"} onChange={(event) => updateBlockProps(block.id, { color: event.target.value })} />;
  }

  return <p className="text-sm text-slate-500">This block has no settings.</p>;
};

const LegacyRawTemplateForm = ({ rawTemplate, updateRawField }) => (
  <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3">
      <InputField name="name" value={rawTemplate.name} onChange={updateRawField} placeholder="Template name" required />
      <InputField name="slug" value={rawTemplate.slug} onChange={updateRawField} placeholder="template-slug" />
      <InputField name="subject" value={rawTemplate.subject} onChange={updateRawField} placeholder="Subject" />
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
          key={item._id}
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("template/id", item._id);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => loadSavedTemplate(item._id)}
          className={`cursor-grab rounded-lg border bg-white p-3 text-left shadow-sm hover:border-emerald-400 hover:bg-emerald-50 active:cursor-grabbing ${
            activeTemplateId === item._id ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">{item.name}</p>
              <p className="text-sm text-slate-500">{item.slug}</p>
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
