import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../api/Api";

const numberFormat = new Intl.NumberFormat("en-IN");
const percentFormat = (value) => `${Number(value || 0).toFixed(2)}%`;

const panelClass = "rounded-lg border border-[#d8c9a3] bg-[#fffdf7] shadow-[0_1px_2px_rgba(31,24,10,0.05),0_18px_36px_rgba(55,39,12,0.10)]";
const inputClass = "h-10 rounded-md border border-[#d6c69a] bg-[#fffaf0] px-3 text-sm text-[#1c2541] outline-none transition placeholder:text-[#9a8f78] focus:border-[#b8872f] focus:bg-white focus:ring-2 focus:ring-[#ead7a3]";
const secondaryButtonClass = "rounded-md border border-[#d6c69a] bg-[#fffaf0] px-3 py-2 text-sm font-semibold text-[#1c2541] transition hover:border-[#b8872f] hover:bg-[#f6ecd5]";

const emptyAnalytics = {
  totalUsers: 0,
  totalSent: 0,
  totalDelivered: 0,
  totalOpens: 0,
  totalClicks: 0,
  totalForms: 0,
  totalBounces: 0,
  totalUnsubscribes: 0,
  totalSpamComplaints: 0,
  uniqueOpens: 0,
  uniqueClicks: 0,
  uniqueForms: 0,
  overview: {},
  funnel: {},
  campaignComparison: [],
  campaignAnalytics: [],
  templatePerformance: [],
  templateAnalytics: [],
  conversionRateByCampaignType: [],
  senderAccountPerformance: [],
  gmailQuotaUsage: [],
  linkAnalytics: [],
  formFieldAnalytics: [],
  topEngagedRecipients: [],
  coldRecipients: [],
  recipientJourney: [],
  receiverDetails: [],
  bounceReasons: [],
  botFiltering: {
    opens: { total: 0, suspectedBots: 0, human: 0 },
    clicks: { total: 0, suspectedBots: 0, human: 0 }
  },
  graphData: { hourly: [], daily: [], weekly: [] },
  timeline: { firstHour: {}, first24Hours: {} },
  breakdowns: {
    browsers: [],
    devices: [],
    operatingSystems: [],
    countries: [],
    cities: []
  }
};

const maxFromRows = (rows, field) => Math.max(...rows.map((row) => Number(row[field] || 0)), 1);

const joinText = (...parts) => parts.filter(Boolean).join(" - ");

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col justify-between gap-3 border-b border-[#eadfbd] px-5 py-4 md:flex-row md:items-center">
    <div>
      <h2 className="text-base font-bold text-[#1c2541]">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-[#70664f]">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const SummaryCard = ({ label, value, detail, tone = "slate" }) => {
  const tones = {
    slate: "bg-[#1c2541]",
    emerald: "bg-[#0f6f5c]",
    sky: "bg-[#2b5b89]",
    indigo: "bg-[#4b2e83]",
    amber: "bg-[#c89b3c]",
    rose: "bg-[#8a2f48]"
  };

  return (
    <div className={`${panelClass} p-4 transition hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(31,24,10,0.06),0_22px_42px_rgba(55,39,12,0.14)]`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[#70664f]">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${tones[tone] || tones.slate}`} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#1c2541]">
        {numberFormat.format(value || 0)}
      </p>
      <p className="mt-1 text-sm text-[#70664f]">{detail}</p>
    </div>
  );
};

const Bar = ({ label, value, maxValue, color = "bg-[#1c2541]" }) => (
  <div className="grid grid-cols-[72px_1fr_52px] items-center gap-2">
    <span className="text-xs font-semibold text-[#70664f]">{label}</span>
    <div className="h-2 rounded-full bg-[#eadfbd]">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${Math.max((Number(value || 0) / maxValue) * 100, value ? 4 : 0)}%` }}
      />
    </div>
    <span className="text-right text-xs font-semibold text-[#70664f]">
      {numberFormat.format(value || 0)}
    </span>
  </div>
);

const Funnel = ({ funnel }) => {
  const steps = [
    { label: "Sent", value: funnel.sent, rate: 100, color: "bg-[#1c2541]" },
    { label: "Delivered", value: funnel.delivered, rate: funnel.deliveryRate, color: "bg-[#0f6f5c]" },
    { label: "Opened", value: funnel.opened, rate: funnel.openRate, color: "bg-[#4b2e83]" },
    { label: "Clicked", value: funnel.clicked, rate: funnel.clickRate, color: "bg-[#c89b3c]" },
    { label: "Submitted", value: funnel.submitted, rate: funnel.submitRate, color: "bg-[#2b5b89]" }
  ];

  return (
    <section className={panelClass}>
      <SectionHeader
        title="Conversion Funnel"
        subtitle="Recipient movement from send to submit."
        action={
          <div className="rounded-md bg-[#eadfbd] px-3 py-2 text-sm font-semibold text-[#3a2f4f]">
            CTOR {percentFormat(funnel.clickToOpenRate)}
          </div>
        }
      />

      <div className="grid gap-3 p-5 md:grid-cols-5">
        {steps.map((step) => (
          <div key={step.label} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-[#1c2541]">{step.label}</p>
              <p className="text-sm font-semibold text-[#70664f]">{percentFormat(step.rate)}</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#1c2541]">
              {numberFormat.format(step.value || 0)}
            </p>
            <div className="mt-4 h-2 rounded-full bg-[#eadfbd]">
              <div
                className={`h-2 rounded-full ${step.color}`}
                style={{ width: `${Math.min(Number(step.rate || 0), 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const TimelineChart = ({ rows, mode }) => {
  const maxValue = Math.max(
    maxFromRows(rows, "totalOpens"),
    maxFromRows(rows, "totalClicks"),
    maxFromRows(rows, "totalForms")
  );

  return (
    <section className={panelClass}>
      <SectionHeader
        title={`${mode[0].toUpperCase()}${mode.slice(1)} Performance`}
        subtitle="Opens, clicks, submissions, and bounces over time."
      />

      <div className="space-y-4 p-5">
        {rows.length === 0 ? (
          <p className="rounded-lg bg-[#fff8e8] p-4 text-sm text-[#70664f]">No timeline data available.</p>
        ) : (
          rows.slice(-14).map((row) => (
            <div key={row.period} className="grid gap-2 rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-3 md:grid-cols-[132px_1fr]">
              <p className="text-sm font-semibold text-[#70664f]">{row.period}</p>
              <div className="space-y-2">
                <Bar label="Opens" value={row.totalOpens} maxValue={maxValue} color="bg-[#4b2e83]" />
                <Bar label="Clicks" value={row.totalClicks} maxValue={maxValue} color="bg-[#c89b3c]" />
                <Bar label="Forms" value={row.totalForms} maxValue={maxValue} color="bg-[#2b5b89]" />
                <Bar label="Bounces" value={row.bounces} maxValue={maxValue} color="bg-[#8a2f48]" />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const PerformanceTable = ({ title, rows, labelKey }) => (
  <section className={panelClass}>
    <SectionHeader title={title} />
    <div className="overflow-x-auto px-5 pb-5">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#eadfbd] text-xs uppercase text-[#8a6f2b]">
            {["Name", "Sent", "Delivered", "Open", "Click", "CTOR", "Forms", "Bounce"].map((heading) => (
              <th key={heading} className="py-3 pr-4 font-bold">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="py-5 text-[#70664f]" colSpan={8}>No data available.</td></tr>
          ) : rows.map((row) => (
            <tr key={row[labelKey]} className="border-b border-[#f0e6c8] transition hover:bg-[#fff8e8]">
              <td className="max-w-[220px] truncate py-3 pr-4 font-semibold text-[#1c2541]">{row[labelKey]}</td>
              <td className="py-3 pr-4 text-[#70664f]">{numberFormat.format(row.sent || 0)}</td>
              <td className="py-3 pr-4 text-[#70664f]">{numberFormat.format(row.delivered || 0)}</td>
              <td className="py-3 pr-4 text-[#70664f]">{percentFormat(row.openRate)}</td>
              <td className="py-3 pr-4 text-[#70664f]">{percentFormat(row.clickThroughRate)}</td>
              <td className="py-3 pr-4 text-[#70664f]">{percentFormat(row.clickToOpenRate)}</td>
              <td className="py-3 pr-4 text-[#70664f]">{numberFormat.format(row.totalForms || 0)}</td>
              <td className="py-3 pr-4 text-[#70664f]">{percentFormat(row.bounceRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const BreakdownList = ({ title, rows }) => {
  const maxValue = maxFromRows(rows, "total");

  return (
    <section className={panelClass}>
      <SectionHeader title={title} />
      <div className="space-y-3 p-5">
        {rows.length === 0 ? (
          <p className="text-sm text-[#70664f]">No data available.</p>
        ) : rows.slice(0, 8).map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-[#1c2541]">{row.name}</p>
              <p className="text-sm font-semibold text-[#70664f]">{numberFormat.format(row.total)}</p>
            </div>
            <div className="h-2 rounded-full bg-[#eadfbd]">
              <div className="h-2 rounded-full bg-[#b8872f]" style={{ width: `${(Number(row.total || 0) / maxValue) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const LinkAnalytics = ({ rows }) => (
  <section className={panelClass}>
    <SectionHeader title="Top Clicked Links" subtitle="Most active destinations and suspected automated clicks." />
    <div className="space-y-3 p-5">
      {rows.length === 0 ? (
        <p className="text-sm text-[#70664f]">No link clicks yet.</p>
      ) : rows.map((row) => (
          <div key={`${row.url}-${row.domain}`} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-3">
          <p className="truncate font-semibold text-[#1c2541]">{row.url}</p>
          <p className="mt-1 text-sm text-[#70664f]">
            {joinText(row.domain, `${numberFormat.format(row.totalClicks)} clicks`, `${numberFormat.format(row.uniqueClicks)} unique`, `${numberFormat.format(row.botClicks)} suspected bot`)}
          </p>
        </div>
      ))}
    </div>
  </section>
);

const FormAnalytics = ({ rows }) => (
  <section className={panelClass}>
    <SectionHeader title="Form Field Analytics" subtitle="Common fields and top submitted values." />
    <div className="grid gap-3 p-5 md:grid-cols-2">
      {rows.length === 0 ? (
        <p className="text-sm text-[#70664f]">No form submissions yet.</p>
      ) : rows.map((field) => (
        <div key={field.field} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-3">
          <p className="font-semibold text-[#1c2541]">{field.field}</p>
          <p className="text-sm text-[#70664f]">{numberFormat.format(field.totalResponses)} responses</p>
          <div className="mt-2 space-y-1">
            {field.topValues.slice(0, 4).map((item, index) => (
              <p key={`${field.field}-${index}`} className="truncate text-xs text-[#70664f]">
                {joinText(String(item.value || "Blank"), numberFormat.format(item.count))}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const RecipientList = ({ title, rows }) => (
  <section className={panelClass}>
    <SectionHeader title={title} />
    <div className="space-y-2 p-5">
      {rows.length === 0 ? (
        <p className="text-sm text-[#70664f]">No recipients found.</p>
      ) : rows.slice(0, 10).map((row) => (
        <div key={row.trackingId} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-3 transition hover:bg-[#fffdf7]">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-semibold text-[#1c2541]">{row.email}</p>
            <p className="rounded-md bg-[#f6ecd5] px-2 py-1 text-xs font-bold text-[#7a1735]">Score {row.score}</p>
          </div>
          <p className="mt-1 text-xs text-[#70664f]">
            {joinText(row.campaignName, `opens ${row.opens}`, `clicks ${row.clicks}`, `forms ${row.forms}`, `bot events ${row.botEvents}`)}
          </p>
        </div>
      ))}
    </div>
  </section>
);

const ReceiverDetails = ({ rows }) => (
  <section className={panelClass}>
    <SectionHeader
      title="Receiver Details"
      subtitle="Mail ID, campaign, engagement timing, location, device, links, and form fill data."
      action={<p className="rounded-md bg-[#eadfbd] px-3 py-2 text-sm font-semibold text-[#3a2f4f]">{numberFormat.format(rows.length)} receivers</p>}
    />

    <div className="overflow-x-auto px-5 pb-5">
      <table className="min-w-[1380px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#eadfbd] text-xs uppercase text-[#8a6f2b]">
            {["Mail ID", "Campaign", "Delivery", "Provider", "Opened", "Clicked", "Forms", "Location", "Device", "Browser", "Clicked Links", "Form Fill Info"].map((heading) => (
              <th key={heading} className="py-3 pr-4 font-bold">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="py-5 text-[#70664f]" colSpan={12}>No receiver activity found.</td></tr>
          ) : rows.slice(0, 80).map((receiver) => (
            <tr key={receiver.trackingId} className="border-b border-[#f0e6c8] align-top transition hover:bg-[#fff8e8]">
              <td className="max-w-[220px] py-3 pr-4">
                <p className="truncate font-semibold text-[#1c2541]">{receiver.email}</p>
                <p className="text-xs text-[#9a8f78]">Score {receiver.score || 0}</p>
              </td>
              <td className="max-w-[180px] py-3 pr-4 text-[#70664f]">
                <p className="truncate font-semibold">{receiver.campaignName}</p>
                <p className="truncate text-xs text-[#9a8f78]">{receiver.templateSlug}</p>
              </td>
              <td className="max-w-[180px] py-3 pr-4 text-[#70664f]">
                <p className="font-semibold text-[#1c2541]">
                  {receiver.firstBouncedAt ? "Bounced" : receiver.firstDeliveredAt ? "Delivered" : "Pending"}
                </p>
                <p className="text-xs text-[#9a8f78]">
                  {receiver.firstBouncedAt
                    ? new Date(receiver.firstBouncedAt).toLocaleString()
                    : receiver.firstDeliveredAt
                      ? new Date(receiver.firstDeliveredAt).toLocaleString()
                      : "No delivery event"}
                </p>
                {receiver.bounceReason && (
                  <p className="mt-1 truncate text-xs text-[#8a2f48]">{receiver.bounceReason}</p>
                )}
              </td>
              <td className="max-w-[220px] py-3 pr-4 text-[#70664f]">
                <p className="truncate">{receiver.providerStatus || "Unknown"}</p>
                <p className="truncate text-xs text-[#9a8f78]">
                  {joinText(
                    receiver.deliveryMeta?.statusCode ? `code ${receiver.deliveryMeta.statusCode}` : "",
                    receiver.deliveryMeta?.queue,
                    receiver.deliveryMeta?.peerAddress
                  )}
                </p>
              </td>
              <td className="py-3 pr-4 text-[#70664f]">
                <p>{numberFormat.format(receiver.opens || 0)} times</p>
                <p className="text-xs text-[#9a8f78]">{receiver.firstOpenedAt ? new Date(receiver.firstOpenedAt).toLocaleString() : "Not opened"}</p>
              </td>
              <td className="py-3 pr-4 text-[#70664f]">
                <p>{numberFormat.format(receiver.clicks || 0)} times</p>
                <p className="text-xs text-[#9a8f78]">{receiver.firstClickedAt ? new Date(receiver.firstClickedAt).toLocaleString() : "No click"}</p>
              </td>
              <td className="py-3 pr-4 text-[#70664f]">
                <p>{numberFormat.format(receiver.forms || 0)} submits</p>
                <p className="text-xs text-[#9a8f78]">{receiver.firstFormSubmittedAt ? new Date(receiver.firstFormSubmittedAt).toLocaleString() : "No form"}</p>
              </td>
              <td className="max-w-[160px] py-3 pr-4 text-[#70664f]">
                <p className="truncate">{receiver.lastLocation || "Unknown"}</p>
                <p className="truncate text-xs text-[#9a8f78]">{(receiver.locations || []).join(" | ")}</p>
              </td>
              <td className="py-3 pr-4 text-[#70664f]">{receiver.lastDevice || "Unknown"}</td>
              <td className="py-3 pr-4 text-[#70664f]">{receiver.lastBrowser || "Unknown"}</td>
              <td className="max-w-[240px] py-3 pr-4 text-[#70664f]">
                {(receiver.clickedLinks || []).length === 0 ? (
                  <span className="text-[#9a8f78]">No links</span>
                ) : (
                  <div className="space-y-1">
                    {(receiver.clickedLinks || []).slice(0, 3).map((link, index) => (
                      <p key={`${receiver.trackingId}-link-${index}`} className="truncate text-xs">
                        {joinText(link.url, link.clickedAt ? new Date(link.clickedAt).toLocaleString() : "")}
                      </p>
                    ))}
                  </div>
                )}
              </td>
              <td className="max-w-[260px] py-3 pr-4 text-[#70664f]">
                {(receiver.formSubmissions || []).length === 0 ? (
                  <span className="text-[#9a8f78]">No form data</span>
                ) : (
                  <div className="space-y-1">
                    {(receiver.formSubmissions || []).slice(0, 2).map((submission, index) => (
                      <p key={`${receiver.trackingId}-form-${index}`} className="truncate text-xs">
                        {Object.entries(submission.data || {})
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")}
                      </p>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const GmailQuota = ({ rows }) => (
  <section className={panelClass}>
    <SectionHeader title="Gmail Quota Usage" subtitle="Daily Gmail sender usage and remaining capacity." />
    <div className="space-y-3 p-5">
      {rows.length === 0 ? (
        <p className="text-sm text-[#70664f]">No Gmail sender usage yet.</p>
      ) : rows.map((row) => (
        <div key={row.senderEmail} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-semibold text-[#1c2541]">{row.senderEmail}</p>
            <p className="text-sm font-semibold text-[#70664f]">{percentFormat(row.usageRate)}</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#eadfbd]">
            <div className="h-2 rounded-full bg-[#c89b3c]" style={{ width: `${Math.min(row.usageRate || 0, 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#70664f]">
            {joinText(`${numberFormat.format(row.sentToday)} sent today`, `${numberFormat.format(row.remainingToday)} remaining`, `${numberFormat.format(row.dailyLimit)} limit`)}
          </p>
        </div>
      ))}
    </div>
  </section>
);

const BotFiltering = ({ data }) => (
  <section className={panelClass}>
    <SectionHeader title="Bot Filtering" subtitle="Human versus suspected automated engagement." />
    <div className="grid gap-3 p-5 md:grid-cols-2">
      {["opens", "clicks"].map((key) => (
        <div key={key} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-4">
          <p className="font-semibold capitalize text-[#1c2541]">{key}</p>
          <p className="mt-2 text-sm text-[#70664f]">
            {joinText(`${numberFormat.format(data[key]?.human || 0)} human`, `${numberFormat.format(data[key]?.suspectedBots || 0)} suspected bot`, `${numberFormat.format(data[key]?.total || 0)} total`)}
          </p>
        </div>
      ))}
    </div>
  </section>
);

const DeliveryProviderDetails = ({ rows }) => {
  const providerRows = rows
    .filter((receiver) => receiver.firstDeliveredAt || receiver.firstBouncedAt || receiver.providerStatus)
    .slice(0, 12);

  return (
    <section className={panelClass}>
      <SectionHeader
        title="Delivery Provider Events"
        subtitle="Latest delivery and failure response from the mail delivery API."
      />
      <div className="space-y-3 p-5">
        {providerRows.length === 0 ? (
          <p className="text-sm text-[#70664f]">No delivery provider events synced yet.</p>
        ) : providerRows.map((receiver) => (
          <div key={`${receiver.trackingId}-provider`} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-3">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
              <div>
                <p className="font-semibold text-[#1c2541]">{receiver.email}</p>
                <p className="mt-1 text-xs text-[#70664f]">
                  {joinText(receiver.campaignName, receiver.providerStatus || "Unknown status")}
                </p>
              </div>
              <p className={`rounded-md px-2 py-1 text-xs font-bold ${
                receiver.firstBouncedAt
                  ? "bg-[#f6d9df] text-[#8a2f48]"
                  : "bg-[#d9eee8] text-[#0f6f5c]"
              }`}>
                {receiver.firstBouncedAt ? "Failed" : "Delivered"}
              </p>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-[#70664f] md:grid-cols-3">
              <p>{joinText("Code", receiver.deliveryMeta?.statusCode || "NA")}</p>
              <p className="truncate">{joinText("Queue", receiver.deliveryMeta?.queue || "NA")}</p>
              <p className="truncate">{joinText("Peer", receiver.deliveryMeta?.peerAddress || "NA")}</p>
              <p className="truncate">{joinText("TLS", receiver.deliveryMeta?.tlsCipher || "NA")}</p>
              <p className="truncate">{joinText("IP", receiver.deliveryMeta?.ip || "NA")}</p>
              <p className="truncate">{receiver.deliveryMeta?.responseMessage || receiver.bounceReason || "No response message"}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [filters, setFilters] = useState({
    campaignName: "",
    campaignType: "",
    subject: "",
    templateSlug: "",
    senderEmail: "",
    senderProvider: "",
    email: "",
    eventType: "",
    clickedDomain: "",
    clickedUrl: "",
    country: "",
    city: "",
    device: "",
    browser: "",
    os: "",
    isBot: "",
    bounceType: "",
    formField: "",
    formValue: "",
    from: "",
    to: ""
  });
  const [graphMode, setGraphMode] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [syncingDelivery, setSyncingDelivery] = useState(false);
  const [error, setError] = useState("");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    });

    return params;
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const query = queryParams.toString();
      const response = await axios.get(apiUrl(`/track/analytics/deep${query ? `?${query}` : ""}`));
      setAnalytics(response.data.analytics || emptyAnalytics);
    } catch (requestError) {
      console.log(requestError);
      setError(requestError.response?.data?.message || "Analytics loading failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    window.addEventListener("analytics:refresh", fetchAnalytics);

    return () => {
      window.removeEventListener("analytics:refresh", fetchAnalytics);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value
    });
  };

  const resetFilters = () => {
    setFilters({
      campaignName: "",
      campaignType: "",
      subject: "",
      templateSlug: "",
      senderEmail: "",
      senderProvider: "",
      email: "",
      eventType: "",
      clickedDomain: "",
      clickedUrl: "",
      country: "",
      city: "",
      device: "",
      browser: "",
      os: "",
      isBot: "",
      bounceType: "",
      formField: "",
      formValue: "",
      from: "",
      to: ""
    });
  };

  const exportCsv = (groupBy) => {
    const params = new URLSearchParams(queryParams);
    params.set("groupBy", groupBy);
    window.location.href = apiUrl(`/track/analytics/export.csv?${params.toString()}`);
  };

  const syncDeliveryStatus = async () => {
    try {
      setSyncingDelivery(true);
      setError("");
      await axios.get(apiUrl("/track/delivery-status/sync"));
      await fetchAnalytics();
    } catch (requestError) {
      console.log(requestError);
      setError(requestError.response?.data?.message || "Delivery status sync failed");
    } finally {
      setSyncingDelivery(false);
    }
  };

  const cards = [
    { label: "Sent", value: analytics.totalSent, detail: `${numberFormat.format(analytics.totalUsers)} recipients`, tone: "slate" },
    { label: "Delivered", value: analytics.totalDelivered, detail: `${percentFormat(analytics.overview?.deliveryRate)} delivery rate`, tone: "emerald" },
    { label: "Opens", value: analytics.totalOpens, detail: `${numberFormat.format(analytics.uniqueOpens)} unique`, tone: "indigo" },
    { label: "Clicks", value: analytics.totalClicks, detail: `${numberFormat.format(analytics.uniqueClicks)} unique`, tone: "amber" },
    { label: "Forms", value: analytics.totalForms, detail: `${numberFormat.format(analytics.uniqueForms)} unique`, tone: "sky" },
    { label: "Bounces", value: analytics.totalBounces, detail: `${percentFormat(analytics.overview?.bounceRate)} bounce rate`, tone: "rose" },
    { label: "Unsubscribes", value: analytics.totalUnsubscribes, detail: `${percentFormat(analytics.overview?.unsubscribeRate)} unsubscribe rate`, tone: "slate" },
    { label: "Spam", value: analytics.totalSpamComplaints, detail: `${percentFormat(analytics.overview?.spamComplaintRate)} complaint rate`, tone: "rose" }
  ];

  const activeGraphRows = analytics.graphData?.[graphMode] || [];
  const filterGroups = [
    {
      title: "Campaign",
      fields: [
        ["campaignName", "Campaign name"],
        ["campaignType", "Campaign type"],
        ["subject", "Subject"],
        ["templateSlug", "Template slug"]
      ]
    },
    {
      title: "Receiver",
      fields: [
        ["email", "Receiver email"],
        ["senderEmail", "Sender email"],
        ["senderProvider", "Sender provider"],
        ["clickedDomain", "Clicked domain"]
      ]
    },
    {
      title: "Context",
      fields: [
        ["country", "Country"],
        ["city", "City"],
        ["device", "Device"],
        ["browser", "Browser"],
        ["os", "Operating system"],
        ["clickedUrl", "Clicked URL"]
      ]
    },
    {
      title: "Form",
      fields: [
        ["formField", "Form field"],
        ["formValue", "Form value"]
      ]
    }
  ];

  return (
    <div className="space-y-6 rounded-lg bg-[#f4efe3] p-1">
      <section className="overflow-hidden rounded-lg border border-[#2d2545] bg-[#171226] shadow-[0_22px_54px_rgba(23,18,38,0.32)]">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#d8b45d]">Campaign Intelligence</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#fff7df]">Royal Analytics Command Center</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c8bfdc]">
                Premium reporting for campaigns, receivers, senders, forms, links, devices, geo, bots, bounces, and exports.
              </p>
            </div>

            <div className="grid min-w-full gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <div className="rounded-lg border border-[#5b4a77] bg-[#241c3a] p-4 shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#d8b45d]">Open Rate</p>
                <p className="mt-2 text-2xl font-bold text-[#fff7df]">{percentFormat(analytics.overview?.openRate)}</p>
              </div>
              <div className="rounded-lg border border-[#5b4a77] bg-[#241c3a] p-4 shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#d8b45d]">Click Rate</p>
                <p className="mt-2 text-2xl font-bold text-[#fff7df]">{percentFormat(analytics.overview?.clickThroughRate)}</p>
              </div>
              <div className="rounded-lg border border-[#5b4a77] bg-[#241c3a] p-4 shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#d8b45d]">Form Rate</p>
                <p className="mt-2 text-2xl font-bold text-[#fff7df]">{percentFormat(analytics.overview?.formSubmitRate)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#d8c9a3] bg-[#fffdf7] shadow-[0_12px_30px_rgba(16,10,2,0.18)]">
            <div className="flex flex-col justify-between gap-3 border-b border-[#eadfbd] px-5 py-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-bold text-[#1c2541]">Advanced Filters</h2>
                <p className="text-sm text-[#70664f]">Grouped filters keep campaign, receiver, context, and form reports aligned.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={fetchAnalytics} disabled={loading} className="rounded-md bg-[#7a1735] px-4 py-2 text-sm font-semibold text-[#fff7df] transition hover:bg-[#5e1028] disabled:opacity-50">
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
                <button type="button" onClick={syncDeliveryStatus} disabled={syncingDelivery} className="rounded-md bg-[#1c2541] px-4 py-2 text-sm font-semibold text-[#fff7df] transition hover:bg-[#2d2545] disabled:opacity-50">
                  {syncingDelivery ? "Syncing..." : "Sync Delivery"}
                </button>
                <button type="button" onClick={resetFilters} className={secondaryButtonClass}>Clear Filters</button>
              </div>
            </div>

            <div className="grid gap-4 p-5 xl:grid-cols-4">
              {filterGroups.map((group) => (
                <div key={group.title} className="rounded-lg border border-[#eadfbd] bg-[#fff8e8] p-3">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#8a6f2b]">{group.title}</p>
                  <div className="grid gap-2">
                    {group.fields.map(([name, placeholder]) => (
                      <input key={name} name={name} value={filters[name]} onChange={handleFilterChange} placeholder={placeholder} className={inputClass} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 border-t border-[#eadfbd] px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,auto)]">
              <div className="grid gap-2 md:grid-cols-5">
                <select name="eventType" value={filters.eventType} onChange={handleFilterChange} className={inputClass}>
                  <option value="">All events</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="open">Open</option>
                  <option value="click">Click</option>
                  <option value="form_submit">Form submit</option>
                  <option value="bounce">Bounce</option>
                  <option value="unsubscribe">Unsubscribe</option>
                  <option value="spam_complaint">Spam complaint</option>
                </select>
                <select name="isBot" value={filters.isBot} onChange={handleFilterChange} className={inputClass}>
                  <option value="">Human + bot</option>
                  <option value="false">Human only</option>
                  <option value="true">Suspected bot only</option>
                </select>
                <select name="bounceType" value={filters.bounceType} onChange={handleFilterChange} className={inputClass}>
                  <option value="">All bounce types</option>
                  <option value="hard">Hard bounce</option>
                  <option value="soft">Soft bounce</option>
                </select>
                <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className={inputClass} />
                <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className={inputClass} />
              </div>

              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                {["campaign", "template", "sender", "campaignType", "daily"].map((group) => (
                  <button key={group} type="button" onClick={() => exportCsv(group)} className={secondaryButtonClass}>
                    {group}
                  </button>
                ))}
                <button type="button" onClick={() => exportCsv("receiver")} className={secondaryButtonClass}>Receivers</button>
                <button type="button" onClick={() => exportCsv("formFill")} className="rounded-md bg-[#b8872f] px-3 py-2 text-sm font-semibold text-[#171226] transition hover:bg-[#d8b45d]">
                  Form fill CSV
                </button>
              </div>
            </div>

            {error && <p className="mx-5 mb-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <SummaryCard key={card.label} {...card} />)}
      </div>

      <Funnel funnel={analytics.funnel || emptyAnalytics.funnel} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div>
          <div className="mb-3 inline-flex rounded-lg border border-[#d8c9a3] bg-[#fffdf7] p-1 shadow-sm">
            {["hourly", "daily", "weekly"].map((mode) => (
              <button key={mode} type="button" onClick={() => setGraphMode(mode)} className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${graphMode === mode ? "bg-[#7a1735] text-[#fff7df]" : "text-[#70664f] hover:bg-[#fff8e8]"}`}>
                {mode}
              </button>
            ))}
          </div>
          <TimelineChart rows={activeGraphRows} mode={graphMode} />
        </div>

        <div className="grid gap-6">
          <BotFiltering data={analytics.botFiltering || emptyAnalytics.botFiltering} />
          <GmailQuota rows={analytics.gmailQuotaUsage || []} />
        </div>
      </section>

      <DeliveryProviderDetails rows={analytics.receiverDetails || analytics.recipientJourney || []} />

      <div className="grid gap-6 xl:grid-cols-2">
        <PerformanceTable title="Campaign Comparison" rows={analytics.campaignComparison || analytics.campaignAnalytics || []} labelKey="campaignName" />
        <PerformanceTable title="Template Performance" rows={analytics.templatePerformance || analytics.templateAnalytics || []} labelKey="template" />
        <PerformanceTable title="Conversion by Campaign Type" rows={analytics.conversionRateByCampaignType || []} labelKey="campaignType" />
        <PerformanceTable title="Sender Account Performance" rows={analytics.senderAccountPerformance || []} labelKey="senderEmail" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LinkAnalytics rows={analytics.linkAnalytics || []} />
        <FormAnalytics rows={analytics.formFieldAnalytics || []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecipientList title="Top Engaged Recipients" rows={analytics.topEngagedRecipients || []} />
        <RecipientList title="Cold Recipients" rows={analytics.coldRecipients || []} />
      </div>

      <ReceiverDetails rows={analytics.receiverDetails || analytics.recipientJourney || []} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <BreakdownList title="Browsers" rows={analytics.breakdowns?.browsers || []} />
        <BreakdownList title="Devices" rows={analytics.breakdowns?.devices || []} />
        <BreakdownList title="Operating Systems" rows={analytics.breakdowns?.operatingSystems || []} />
        <BreakdownList title="Countries" rows={analytics.breakdowns?.countries || []} />
        <BreakdownList title="Cities" rows={analytics.breakdowns?.cities || []} />
      </div>

      <BreakdownList title="Bounce Reasons" rows={(analytics.bounceReasons || []).map((row) => ({
        name: `${row.type}: ${row.reason}`,
        total: row.total,
        unique: row.unique
      }))} />
    </div>
  );
};

export default AnalyticsDashboard;
