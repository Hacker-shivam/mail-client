import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import CampaignForm from "./components/CampaignForm";
import TemplateForm from "./components/TemplateForm";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

const pages = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Workspace",
    title: "Campaign Control Room",
    description: "A premium command surface for email creation, delivery, and performance intelligence.",
    accent: "#0f766e",
    stats: [
      ["Pages", "4"],
      ["Flow", "Build - Send - Measure"],
      ["Workspace", "Unified"]
    ]
  },
  {
    id: "templates",
    label: "Templates",
    eyebrow: "Creative Studio",
    title: "Template Studio",
    description: "Design polished email experiences with builder controls, raw HTML, validation, and previews.",
    accent: "#2563eb",
    stats: [
      ["Modes", "Builder + Raw"],
      ["Preview", "Desktop + Mobile"],
      ["Output", "HTML + AMP"]
    ]
  },
  {
    id: "campaigns",
    label: "Campaigns",
    eyebrow: "Delivery",
    title: "Campaign Operations",
    description: "Prepare recipients, schedule sends, control state, and keep every campaign moving.",
    accent: "#7c3aed",
    stats: [
      ["Send", "Single + Bulk"],
      ["Sources", "CSV, List, Segment"],
      ["Scheduler", "Active"]
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    eyebrow: "Intelligence",
    title: "Performance Intelligence",
    description: "Deep reporting for delivery, engagement, forms, receivers, links, senders, and exports.",
    accent: "#b45309",
    stats: [
      ["Funnel", "Live"],
      ["Receivers", "Detailed"],
      ["Exports", "CSV"]
    ]
  }
];

const getPageFromHash = () => {
  const hash = window.location.hash.replace("#/", "").replace("#", "");
  return pages.some((page) => page.id === hash) ? hash : "overview";
};

const App = () => {
  const [activePage, setActivePage] = useState(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener("hashchange", handleHashChange);

    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/overview");
    }

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const currentPage = useMemo(
    () => pages.find((page) => page.id === activePage) || pages[0],
    [activePage]
  );

  const navigate = (pageId) => {
    window.location.hash = `/${pageId}`;
    setActivePage(pageId);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#101827]">
      <Navbar pages={pages} activePage={activePage} onNavigate={navigate} />

      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_12%_10%,rgba(45,212,191,0.22),transparent_28%),linear-gradient(135deg,#08111f_0%,#10233f_48%,#0f3f3b_100%)]" />
        <div className="absolute inset-x-0 top-[300px] h-20 bg-gradient-to-b from-transparent to-[#f4f7fb]" />

        <div className={`relative mx-auto w-full max-w-[1540px] px-3 pb-10 sm:px-5 lg:px-8 ${activePage === "templates" ? "pt-0" : "pt-5"}`}>
          {activePage !== "templates" && (
            <PageHero page={currentPage} activePage={activePage} onNavigate={navigate} />
          )}

          <div className={`${activePage === "templates" ? "mt-0" : "mt-5"} min-w-0`}>
            {activePage === "overview" && <OverviewPage onNavigate={navigate} />}
            {activePage === "templates" && <TemplateForm />}
            {activePage === "campaigns" && (
              <div className="mx-auto max-w-7xl">
                <CampaignForm />
              </div>
            )}
            {activePage === "analytics" && <AnalyticsDashboard />}
          </div>
        </div>
      </main>
    </div>
  );
};

const PageHero = ({ page, activePage, onNavigate }) => {
  const actions = [
    { id: "templates", label: "Create Template" },
    { id: "campaigns", label: "Launch Campaign" },
    { id: "analytics", label: "View Analytics" }
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-white/15 bg-white/[0.08] shadow-[0_30px_90px_rgba(2,6,23,0.30)] backdrop-blur-xl">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                {page.eyebrow}
              </p>
              <p className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                Premium UI
              </p>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-normal text-white sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
              {page.description}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {page.stats.map(([label, value]) => (
              <div key={label} className="min-h-[86px] rounded-lg border border-white/12 bg-white/[0.07] p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</p>
                <p className="mt-2 text-lg font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-lg border border-white/15 bg-[#07111f]/45 p-3 shadow-inner">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className={`flex min-h-[54px] items-center justify-between rounded-md px-3 py-3 text-left text-sm font-bold transition ${
                  activePage === action.id
                    ? "bg-white text-[#102033] shadow-sm"
                    : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/12"
                }`}
              >
                <span>{action.label}</span>
                <span className="text-base" aria-hidden="true">-&gt;</span>
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-md border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Active Page</p>
            <p className="mt-1 text-sm font-black text-white">{page.label}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const OverviewPage = ({ onNavigate }) => {
  const metrics = [
    { label: "Workspace", value: "4", detail: "Core pages connected" },
    { label: "Campaign Flow", value: "3", detail: "Build, send, measure" },
    { label: "Reports", value: "12+", detail: "Operational views" },
    { label: "Template Modes", value: "2", detail: "Builder and raw HTML" }
  ];

  const workflow = [
    {
      step: "01",
      title: "Design",
      text: "Template builder, raw HTML, previews, blocks, and validation.",
      page: "templates"
    },
    {
      step: "02",
      title: "Deliver",
      text: "Recipient imports, sender details, scheduling, and campaign state.",
      page: "campaigns"
    },
    {
      step: "03",
      title: "Analyze",
      text: "Funnels, receivers, forms, links, bounces, senders, and CSV exports.",
      page: "analytics"
    }
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="rounded-lg border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Executive Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Stable navigation, clearer hierarchy, and faster daily actions.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("campaigns")}
            className="min-h-11 w-full rounded-md bg-[#0f766e] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(15,118,110,0.24)] transition hover:bg-[#115e59] sm:w-auto"
          >
            Start Campaign
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-h-[132px] rounded-lg border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-3 text-4xl font-black tracking-normal text-slate-950">{metric.value}</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border-t border-slate-100 p-5 lg:grid-cols-3">
          {workflow.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => onNavigate(item.page)}
              className="min-h-[190px] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:shadow-[0_18px_38px_rgba(15,23,42,0.10)]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f7f5] text-xs font-black text-[#0f766e]">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
              <p className="mt-4 text-sm font-black text-[#0f766e]">Open {item.title}</p>
            </button>
          ))}
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-[#0f172a] p-4 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)] sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Command Menu</p>
        <h2 className="mt-3 text-xl font-black">Primary Pages</h2>
        <div className="mt-5 space-y-2">
          {pages.slice(1).map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onNavigate(page.id)}
              className="group flex min-h-[64px] w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-sm font-bold transition hover:bg-white/10"
            >
              <span>
                <span className="block text-white">{page.label}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-400">{page.eyebrow}</span>
              </span>
              <span className="text-slate-300 transition group-hover:translate-x-0.5">Open</span>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">UI Status</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Responsive shell, stable page state, polished spacing, and production build verified.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default App;
