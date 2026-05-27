import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../api/Api";

const sourceOptions = [
  { id: "csv", label: "CSV / Excel" },
  { id: "manual", label: "Paste Emails" },
  { id: "list", label: "Contact List" },
  { id: "segment", label: "Segment" },
];

const defaultSegment = `{
  "status": "subscribed",
  "tags": []
}`;

const schedulerStatuses = ["all", "scheduled", "pending", "running", "paused", "completed", "cancelled", "failed"];

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

const toDateTimeLocal = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const CampaignForm = () => {
  const [campaignNames, setCampaignNames] = useState([
    "startup-loan",
    "business-growth",
    "education-loan",
    "marketing-campaign",
  ]);

  const [campaignTypes, setCampaignTypes] = useState([
    "Loan",
    "Marketing",
    "Finance",
    "Promotion",
  ]);

  const [sendMode, setSendMode] = useState("single");
  const [sourceType, setSourceType] = useState("csv");
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    campaignName: "",
    campaignType: "",
    templateSlug: "",
    senderEmail: "",
    replyTo: "",
    scheduledAt: "",
  });
  const [csvText, setCsvText] = useState("");
  const [manualEmails, setManualEmails] = useState("");
  const [segmentJson, setSegmentJson] = useState(defaultSegment);
  const [selectedListId, setSelectedListId] = useState("");
  const [saveContacts, setSaveContacts] = useState(false);
  const [listName, setListName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState("all");
  const [rescheduleDrafts, setRescheduleDrafts] = useState({});

  const selectedSource = useMemo(
    () => sourceOptions.find((option) => option.id === sourceType),
    [sourceType]
  );

  const fetchTemplates = async () => {
    try {
      setTemplateLoading(true);
      const response = await axios.get(apiUrl("/api/templates"));
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.log(error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const fetchContactLists = async () => {
    try {
      const response = await axios.get(apiUrl("/api/contact-lists"));
      setContactLists(response.data.lists || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCampaigns = async (status = campaignStatus) => {
    try {
      setCampaignsLoading(true);
      const query = status && status !== "all" ? `?status=${status}&limit=50` : "?limit=50";
      const response = await axios.get(apiUrl(`/api/campaigns${query}`));
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.log(error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchContactLists();
    fetchCampaigns();
    window.addEventListener("templates:changed", fetchTemplates);
    const refreshCampaigns = () => fetchCampaigns(campaignStatus);
    window.addEventListener("campaigns:refresh", refreshCampaigns);

    return () => {
      window.removeEventListener("templates:changed", fetchTemplates);
      window.removeEventListener("campaigns:refresh", refreshCampaigns);
    };
  }, []);

  useEffect(() => {
    fetchCampaigns(campaignStatus);
  }, [campaignStatus]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCampaignNameBlur = () => {
    const value = formData.campaignName.trim();

    if (value && !campaignNames.includes(value)) {
      setCampaignNames([...campaignNames, value]);
    }
  };

  const handleCampaignTypeBlur = () => {
    const value = formData.campaignType.trim();

    if (value && !campaignTypes.includes(value)) {
      setCampaignTypes([...campaignTypes, value]);
    }
  };

  const parseManualEmails = () => {
    return manualEmails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter(Boolean);
  };

  const parseSegment = () => {
    try {
      return JSON.parse(segmentJson || "{}");
    } catch {
      throw new Error("Segment JSON is not valid");
    }
  };

  const getSourcePayload = () => {
    if (sourceType === "csv") {
      return { csv: csvText };
    }

    if (sourceType === "manual") {
      return { emails: parseManualEmails() };
    }

    if (sourceType === "list") {
      return { listId: selectedListId };
    }

    return { segment: parseSegment() };
  };

  const getBulkPayload = () => ({
    ...getSourcePayload(),
    subject: formData.subject,
    campaignName: formData.campaignName,
    campaignType: formData.campaignType,
    templateSlug: formData.templateSlug,
    senderEmail: formData.senderEmail || undefined,
    replyTo: formData.replyTo || formData.senderEmail || undefined,
    scheduledAt: formData.scheduledAt || undefined,
    saveContacts,
    listName: saveContacts && !selectedListId ? listName : undefined,
    saveListId: saveContacts && selectedListId ? selectedListId : undefined,
  });

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setCsvText(text);
    setPreview(null);
  };

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      const response = await axios.post(
        apiUrl("/api/bulk-email/import/preview"),
        getSourcePayload()
      );

      setPreview(response.data.preview);
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      subject: "",
      campaignName: "",
      campaignType: "",
      templateSlug: "",
      senderEmail: "",
      replyTo: "",
      scheduledAt: "",
    });
    setCsvText("");
    setManualEmails("");
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (sendMode === "single") {
        await axios.post(apiUrl("/api/send-email"), formData);
        alert("Campaign submitted successfully!");
      } else {
        const response = await axios.post(
          apiUrl("/api/bulk-email/import"),
          getBulkPayload()
        );
        const imported = response.data.importSummary?.imported || 0;
        alert(`Bulk campaign queued for ${imported} recipients.`);
      }

      window.dispatchEvent(new Event("analytics:refresh"));
      window.dispatchEvent(new Event("campaigns:refresh"));
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Send Campaign
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Send one test email or import recipients for a bulk campaign.
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm font-semibold text-slate-600">
            {["single", "bulk"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setSendMode(mode);
                  setPreview(null);
                }}
                className={`rounded-md px-4 py-2 capitalize transition ${
                  sendMode === mode
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "hover:text-slate-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Template">
              <select
                name="templateSlug"
                value={formData.templateSlug}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">
                  {templateLoading ? "Loading templates..." : "Default template"}
                </option>
                {templates.map((template) => (
                  <option key={template._id} value={template.slug}>
                    {template.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Subject">
              <input
                type="text"
                name="subject"
                placeholder="Subject of the email"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>

            <Field label="Campaign Name">
              <input
                type="text"
                name="campaignName"
                list="campaignNames"
                placeholder="Enter or select campaign name"
                value={formData.campaignName}
                onChange={handleChange}
                onBlur={handleCampaignNameBlur}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="campaignNames">
                {campaignNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>

            <Field label="Campaign Type">
              <input
                type="text"
                name="campaignType"
                list="campaignTypes"
                placeholder="Marketing, Finance, Promotion"
                value={formData.campaignType}
                onChange={handleChange}
                onBlur={handleCampaignTypeBlur}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="campaignTypes">
                {campaignTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </Field>

            <Field label="Sender Email">
              <input
                type="email"
                name="senderEmail"
                placeholder="sender@example.com"
                value={formData.senderEmail}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>

            <Field label="Reply-To Email">
              <input
                type="email"
                name="replyTo"
                placeholder="reply@example.com"
                value={formData.replyTo}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>
          </div>

          {sendMode === "single" ? (
            <Field label="Email Address">
              <input
                type="email"
                name="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recipient Source
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Import contacts, preview rows, then queue the bulk campaign.
                  </p>
                </div>

                <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
                  {sourceOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSourceType(option.id);
                        setPreview(null);
                      }}
                      className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition ${
                        sourceType === option.id
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="min-w-0">
                  {sourceType === "csv" && (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700"
                      />
                      <textarea
                        value={csvText}
                        onChange={(event) => {
                          setCsvText(event.target.value);
                          setPreview(null);
                        }}
                        placeholder="email,firstName,company&#10;alex@example.com,Alex,Acme"
                        rows={8}
                        className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {sourceType === "manual" && (
                    <textarea
                      value={manualEmails}
                      onChange={(event) => {
                        setManualEmails(event.target.value);
                        setPreview(null);
                      }}
                      placeholder="alex@example.com&#10;sam@example.com"
                      rows={8}
                      className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}

                  {sourceType === "list" && (
                    <select
                      value={selectedListId}
                      onChange={(event) => {
                        setSelectedListId(event.target.value);
                        setPreview(null);
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select contact list</option>
                      {contactLists.map((list) => (
                        <option key={list._id} value={list._id}>
                          {list.name} ({list.contactCount || 0})
                        </option>
                      ))}
                    </select>
                  )}

                  {sourceType === "segment" && (
                    <textarea
                      value={segmentJson}
                      onChange={(event) => {
                        setSegmentJson(event.target.value);
                        setPreview(null);
                      }}
                      rows={8}
                      className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>

                <div className="min-w-0 space-y-3">
                  <Field label="Schedule">
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </Field>

                  {sourceType !== "list" && (
                    <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={saveContacts}
                        onChange={(event) => setSaveContacts(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        Save imported recipients into contacts
                      </span>
                    </label>
                  )}

                  {saveContacts && sourceType !== "list" && (
                    <input
                      type="text"
                      value={listName}
                      onChange={(event) => setListName(event.target.value)}
                      placeholder="Optional new list name"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="w-full rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {previewLoading ? "Previewing..." : `Preview ${selectedSource?.label || "Source"}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Campaign Summary
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <SummaryBox label="Mode" value={sendMode === "single" ? "Single" : "Bulk"} />
            <SummaryBox label="Source" value={sendMode === "single" ? "Email" : selectedSource?.label} />
            <SummaryBox label="Sender" value={formData.senderEmail || "Default"} />
            <SummaryBox label="Reply-To" value={formData.replyTo || formData.senderEmail || "Default"} />
            <SummaryBox label="Recipients" value={sendMode === "single" ? (formData.email ? "1" : "0") : preview?.total ?? "-"} />
            <SummaryBox label="Rejected" value={sendMode === "single" ? "0" : preview?.failed?.length ?? "-"} />
          </div>

          {preview?.sample?.length > 0 && (
            <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Variables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.sample.map((recipient) => (
                    <tr key={recipient.email}>
                      <td className="max-w-[160px] truncate px-3 py-2 text-slate-800">
                        {recipient.email}
                      </td>
                      <td className="max-w-[140px] truncate px-3 py-2 text-slate-500">
                        {Object.keys(recipient.variables || {}).filter((key) => recipient.variables[key]).join(", ") || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview?.failed?.length > 0 && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {preview.failed.length} row(s) need valid email addresses before they can be sent.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : sendMode === "single" ? "Send Email" : formData.scheduledAt ? "Schedule Bulk Campaign" : "Queue Bulk Campaign"}
          </button>
        </aside>
      </form>
    </section>
    <CampaignScheduler
      campaigns={campaigns}
      loading={campaignsLoading}
      status={campaignStatus}
      setStatus={setCampaignStatus}
      rescheduleDrafts={rescheduleDrafts}
      setRescheduleDrafts={setRescheduleDrafts}
      refresh={() => fetchCampaigns(campaignStatus)}
    />
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-sm font-semibold text-slate-700">
      {label}
    </span>
    {children}
  </label>
);

const CampaignScheduler = ({
  campaigns,
  loading,
  status,
  setStatus,
  rescheduleDrafts,
  setRescheduleDrafts,
  refresh
}) => {
  const runAction = async (campaignId, action, payload) => {
    try {
      await axios.post(apiUrl(`/api/campaigns/${campaignId}/${action}`), payload);
      await refresh();
      window.dispatchEvent(new Event("analytics:refresh"));
    } catch (error) {
      alert(error.response?.data?.message || "Campaign action failed");
    }
  };

  const getDraftValue = (campaign) => {
    return rescheduleDrafts[campaign._id] ?? toDateTimeLocal(campaign.scheduledAt);
  };

  const updateDraft = (campaignId, value) => {
    setRescheduleDrafts({
      ...rescheduleDrafts,
      [campaignId]: value
    });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Campaign Scheduler
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage scheduled, running, paused, and completed bulk campaigns.
          </p>
        </div>

        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
          {schedulerStatuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold capitalize transition ${
                status === item
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">Campaign</th>
              <th className="px-4 py-3 font-bold">Sender</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Schedule</th>
              <th className="px-4 py-3 font-bold">Recipients</th>
              <th className="px-4 py-3 font-bold">Progress</th>
              <th className="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading campaigns...
                </td>
              </tr>
            )}

            {!loading && !campaigns.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No campaigns found.
                </td>
              </tr>
            )}

            {!loading && campaigns.map((campaign) => {
              const canSchedule = ["draft", "scheduled", "pending", "paused"].includes(campaign.status);
              const canSendNow = ["draft", "scheduled", "paused"].includes(campaign.status);
              const canPause = ["scheduled", "pending", "running"].includes(campaign.status);
              const canResume = campaign.status === "paused";
              const canCancel = ["draft", "scheduled", "pending", "paused"].includes(campaign.status);
              const progress = campaign.totalRecipients
                ? Math.round(((campaign.sent || 0) / campaign.totalRecipients) * 100)
                : 0;

              return (
                <tr key={campaign._id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="max-w-[220px] truncate font-bold text-slate-900">
                      {campaign.campaignName}
                    </p>
                    <p className="max-w-[220px] truncate text-xs text-slate-500">
                      {campaign.subject || "No subject"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-[180px] truncate text-slate-700">
                      {campaign.senderEmail || "Default"}
                    </p>
                    <p className="max-w-[180px] truncate text-xs text-slate-500">
                      Reply: {campaign.replyTo || campaign.senderEmail || "Default"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="whitespace-nowrap text-slate-700">
                      {formatDateTime(campaign.scheduledAt)}
                    </p>
                    {canSchedule && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="datetime-local"
                          value={getDraftValue(campaign)}
                          onChange={(event) => updateDraft(campaign._id, event.target.value)}
                          className="w-44 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => runAction(campaign._id, "reschedule", { scheduledAt: getDraftValue(campaign) })}
                          className="rounded-md border border-indigo-200 px-2 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {campaign.totalRecipients || 0}
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {campaign.sent || 0} sent / {campaign.failed || 0} failed
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canSendNow && (
                        <ActionButton onClick={() => runAction(campaign._id, "send-now")}>
                          Send now
                        </ActionButton>
                      )}
                      {canPause && (
                        <ActionButton onClick={() => runAction(campaign._id, "pause")}>
                          Pause
                        </ActionButton>
                      )}
                      {canResume && (
                        <ActionButton onClick={() => runAction(campaign._id, "resume")}>
                          Resume
                        </ActionButton>
                      )}
                      {canCancel && (
                        <ActionButton danger onClick={() => runAction(campaign._id, "cancel")}>
                          Cancel
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const ActionButton = ({ children, danger = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-md border px-2.5 py-1.5 text-xs font-bold transition ${
      danger
        ? "border-rose-200 text-rose-700 hover:bg-rose-50"
        : "border-slate-200 text-slate-700 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

const statusClass = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-sky-50 text-sky-700";
    case "running":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-indigo-50 text-indigo-700";
    case "paused":
      return "bg-amber-50 text-amber-700";
    case "completed":
      return "bg-slate-100 text-slate-700";
    case "cancelled":
    case "failed":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const SummaryBox = ({ label, value }) => (
  <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
    <p className="truncate text-xs font-semibold uppercase text-slate-400">
      {label}
    </p>
    <p className="mt-1 truncate text-sm font-bold text-slate-900">
      {value || "-"}
    </p>
  </div>
);

export default CampaignForm;
