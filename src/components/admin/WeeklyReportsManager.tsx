"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Field, apiJson } from "@/components/admin/ui";
import {
  formatWeeklyReportText,
  mondayOfWeek,
  weekEndFromStart,
} from "@/lib/weeklyReportFormat";
import type {
  WeeklyAttachment,
  WeeklyReport,
} from "@/lib/weeklyReportTypes";

type FormState = Omit<WeeklyReport, "id" | "createdAt" | "updatedAt">;

const emptyForm = (): FormState => ({
  email: "",
  weekStartDate: mondayOfWeek(),
  departmentLeadName: "",
  avgStudentsPresent: "",
  staffLeave: "",
  leisureClasses: "",
  schoolOpeningDays: "",
  mealsByDay: "",
  achievements: "",
  challenges: "",
  nextWeekPlan: "",
  requirementsSosd: "",
  expensesSosd: "",
  sanitationSosd: "",
  sanitationPinkyHouse: "",
  urgentRequirementsPinkyHouse: "",
  expensesPinkyHouse: "",
  requestsPinkyHouseStaff: "",
  complaintsParentsStaff: "",
  attachmentsSosd: [],
  attachmentsPinkyHouse: [],
});

function fmtDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const QUESTIONS: Array<{ key: keyof FormState; label: string; rows?: number }> = [
  { key: "avgStudentsPresent", label: "Average number of students present this week in school." },
  { key: "staffLeave", label: "Staff Leave this week", rows: 2 },
  { key: "leisureClasses", label: "Number of leisure classes this week." },
  { key: "schoolOpeningDays", label: "Number of school opening days this week." },
  { key: "mealsByDay", label: "What meal was served in which days. List them.", rows: 4 },
  { key: "achievements", label: "Achievements in SOSD", rows: 4 },
  { key: "challenges", label: "Challenges faced during work", rows: 4 },
  { key: "nextWeekPlan", label: "Next Week Plan of SOSD", rows: 4 },
  { key: "requirementsSosd", label: "Requirements in SOSD", rows: 3 },
  { key: "expensesSosd", label: "Expenses in SOSD", rows: 3 },
  { key: "sanitationSosd", label: "Condition of Sanitation in SOSD", rows: 3 },
  { key: "sanitationPinkyHouse", label: "Condition of Sanitation in Pinky House", rows: 3 },
  { key: "urgentRequirementsPinkyHouse", label: "Urgent requirements in Pinky House", rows: 3 },
  { key: "expensesPinkyHouse", label: "Expenses in Pinky House", rows: 3 },
  {
    key: "requestsPinkyHouseStaff",
    label: "Any requests / complaints or suggestions from Pinky House staffs?",
    rows: 3,
  },
  {
    key: "complaintsParentsStaff",
    label: "Any complaints or suggestions from parents or staffs around.",
    rows: 3,
  },
];

export default function WeeklyReportsManager() {
  const [rows, setRows] = useState<WeeklyReport[]>([]);
  const [mode, setMode] = useState<"list" | "form" | "view">("list");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"sosd" | "pinky" | null>(null);

  const load = useCallback(async () => {
    setRows(await apiJson<WeeklyReport[]>("/api/weekly-reports"));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function uploadFile(
    file: File,
    field: "attachmentsSosd" | "attachmentsPinkyHouse",
  ) {
    setUploading(field === "attachmentsSosd" ? "sosd" : "pinky");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const att: WeeklyAttachment = {
        url: data.url,
        name: data.name || file.name,
        kind: data.kind === "document" ? "document" : "image",
      };
      setForm((f) => ({ ...f, [field]: [...f[field], att] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiJson("/api/weekly-reports", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      await load();
      setMode("list");
      setEditingId(null);
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this weekly report?")) return;
    await apiJson(`/api/weekly-reports?id=${id}`, { method: "DELETE" });
    await load();
    if (viewing?.id === id) {
      setViewing(null);
      setMode("list");
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setMode("form");
  }

  function openEdit(r: WeeklyReport) {
    setEditingId(r.id);
    setForm({
      email: r.email,
      weekStartDate: r.weekStartDate,
      departmentLeadName: r.departmentLeadName,
      avgStudentsPresent: r.avgStudentsPresent,
      staffLeave: r.staffLeave,
      leisureClasses: r.leisureClasses,
      schoolOpeningDays: r.schoolOpeningDays,
      mealsByDay: r.mealsByDay,
      achievements: r.achievements,
      challenges: r.challenges,
      nextWeekPlan: r.nextWeekPlan,
      requirementsSosd: r.requirementsSosd,
      expensesSosd: r.expensesSosd,
      sanitationSosd: r.sanitationSosd,
      sanitationPinkyHouse: r.sanitationPinkyHouse,
      urgentRequirementsPinkyHouse: r.urgentRequirementsPinkyHouse,
      expensesPinkyHouse: r.expensesPinkyHouse,
      requestsPinkyHouseStaff: r.requestsPinkyHouseStaff,
      complaintsParentsStaff: r.complaintsParentsStaff,
      attachmentsSosd: r.attachmentsSosd || [],
      attachmentsPinkyHouse: r.attachmentsPinkyHouse || [],
    });
    setMode("form");
  }

  function openView(r: WeeklyReport) {
    setViewing(r);
    setMode("view");
  }

  if (mode === "form") {
    return (
      <div>
        <div className="print:hidden mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setMode("list")}
          >
            ← Back to list
          </button>
          <h2 className="font-display text-xl text-brand-ink">
            {editingId ? "Edit weekly report" : "New weekly report"}
          </h2>
        </div>
        {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
        <form
          onSubmit={onSubmit}
          className="grid max-w-3xl gap-4 rounded-xl border border-stone bg-white p-5"
        >
          <Field label="Email Address">
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Week Start Date">
              <input
                className="input"
                type="date"
                required
                value={form.weekStartDate}
                onChange={(e) =>
                  setForm({ ...form, weekStartDate: e.target.value })
                }
              />
            </Field>
            <Field label="Week ends (auto)">
              <input
                className="input"
                readOnly
                value={
                  form.weekStartDate
                    ? weekEndFromStart(form.weekStartDate)
                    : ""
                }
              />
            </Field>
          </div>
          <Field label="Department Lead Name">
            <input
              className="input"
              required
              value={form.departmentLeadName}
              onChange={(e) =>
                setForm({ ...form, departmentLeadName: e.target.value })
              }
            />
          </Field>

          {QUESTIONS.map((q) => (
            <Field key={q.key} label={q.label}>
              {q.rows ? (
                <textarea
                  className="input"
                  rows={q.rows}
                  value={String(form[q.key] ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, [q.key]: e.target.value })
                  }
                />
              ) : (
                <input
                  className="input"
                  value={String(form[q.key] ?? "")}
                  onChange={(e) =>
                    setForm({ ...form, [q.key]: e.target.value })
                  }
                />
              )}
            </Field>
          ))}

          <AttachmentField
            label="Any Image or Document to support your report. (SOSD)"
            files={form.attachmentsSosd}
            uploading={uploading === "sosd"}
            onUpload={(f) => void uploadFile(f, "attachmentsSosd")}
            onRemove={(i) =>
              setForm({
                ...form,
                attachmentsSosd: form.attachmentsSosd.filter((_, idx) => idx !== i),
              })
            }
          />
          <AttachmentField
            label="Any Image or Document to support your report (Pinky House)"
            files={form.attachmentsPinkyHouse}
            uploading={uploading === "pinky"}
            onUpload={(f) => void uploadFile(f, "attachmentsPinkyHouse")}
            onRemove={(i) =>
              setForm({
                ...form,
                attachmentsPinkyHouse: form.attachmentsPinkyHouse.filter(
                  (_, idx) => idx !== i,
                ),
              })
            }
          />

          <button
            type="submit"
            className="btn btn-dark w-full"
            disabled={saving || Boolean(uploading)}
          >
            {saving ? "Saving…" : "Save weekly report"}
          </button>
        </form>
      </div>
    );
  }

  if (mode === "view" && viewing) {
    return (
      <WeeklyReportView
        report={viewing}
        onBack={() => {
          setViewing(null);
          setMode("list");
        }}
        onEdit={() => openEdit(viewing)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Weekly meeting questions (SOSD + Pinky House). Fill, save, then Print /
          PDF, Gmail, or WhatsApp share.
        </p>
        <button type="button" className="btn btn-dark" onClick={openNew}>
          New weekly report
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Week start</th>
              <th>Lead</th>
              <th>Email</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No weekly reports yet. Click “New weekly report”.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">
                    {fmtDate(r.weekStartDate)}
                    <span className="block text-xs text-muted">
                      → {fmtDate(weekEndFromStart(r.weekStartDate))}
                    </span>
                  </td>
                  <td>
                    <strong>{r.departmentLeadName}</strong>
                  </td>
                  <td className="text-xs">{r.email}</td>
                  <td className="text-xs whitespace-nowrap">
                    {fmtDate(r.updatedAt.slice(0, 10))}
                  </td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-sm font-semibold text-sky"
                      onClick={() => openView(r)}
                    >
                      Open / Share
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-sky"
                      onClick={() => openEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700"
                      onClick={() => void remove(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttachmentField({
  label,
  files,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  files: WeeklyAttachment[];
  uploading: boolean;
  onUpload: (f: File) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        className="input"
        type="file"
        accept="image/*,.pdf,.doc,.docx,application/pdf"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <p className="mt-1 text-xs text-muted">Uploading…</p>
      ) : null}
      <ul className="mt-2 space-y-2">
        {files.map((f, i) => (
          <li
            key={`${f.url}-${i}`}
            className="flex items-center justify-between gap-2 rounded border border-stone px-2 py-1 text-sm"
          >
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sky"
            >
              {f.name} ({f.kind})
            </a>
            <button
              type="button"
              className="shrink-0 text-xs font-semibold text-red-700"
              onClick={() => onRemove(i)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </Field>
  );
}

function WeeklyReportView({
  report,
  onBack,
  onEdit,
}: {
  report: WeeklyReport;
  onBack: () => void;
  onEdit: () => void;
}) {
  const weekEnd = weekEndFromStart(report.weekStartDate);
  const text = useMemo(() => formatWeeklyReportText(report), [report]);
  const subject = `SOSD Weekly Report — ${report.weekStartDate} to ${weekEnd}`;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  function shareGmail() {
    const body = encodeURIComponent(
      text +
        (origin
          ? `\n\nAttachments are saved in the school portal. Open report after login or attach the PDF you download from Print.`
          : ""),
    );
    const su = encodeURIComponent(subject);
    const to = encodeURIComponent(report.email || "");
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`,
      "_blank",
    );
  }

  function shareMailto() {
    const body = encodeURIComponent(text.slice(0, 1800));
    window.location.href = `mailto:${report.email || ""}?subject=${encodeURIComponent(subject)}&body=${body}`;
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(text.slice(0, 3500));
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  function printPdf() {
    window.print();
  }

  const fields: Array<{ label: string; value: string }> = [
    { label: "Email Address", value: report.email },
    { label: "Week Start Date", value: `${fmtDate(report.weekStartDate)} → ${fmtDate(weekEnd)}` },
    { label: "Department Lead Name", value: report.departmentLeadName },
    {
      label: "Average number of students present this week in school.",
      value: report.avgStudentsPresent,
    },
    { label: "Staff Leave this week", value: report.staffLeave },
    {
      label: "Number of leisure classes this week.",
      value: report.leisureClasses,
    },
    {
      label: "Number of school opening days this week.",
      value: report.schoolOpeningDays,
    },
    {
      label: "What meal was served in which days. List them.",
      value: report.mealsByDay,
    },
    { label: "Achievements in SOSD", value: report.achievements },
    { label: "Challenges faced during work", value: report.challenges },
    { label: "Next Week Plan of SOSD", value: report.nextWeekPlan },
    { label: "Requirements in SOSD", value: report.requirementsSosd },
    { label: "Expenses in SOSD", value: report.expensesSosd },
    {
      label: "Condition of Sanitation in SOSD",
      value: report.sanitationSosd,
    },
    {
      label: "Condition of Sanitation in Pinky House",
      value: report.sanitationPinkyHouse,
    },
    {
      label: "Urgent requirements in Pinky House",
      value: report.urgentRequirementsPinkyHouse,
    },
    { label: "Expenses in Pinky House", value: report.expensesPinkyHouse },
    {
      label: "Any requests / complaints or suggestions from Pinky House staffs?",
      value: report.requestsPinkyHouseStaff,
    },
    {
      label: "Any complaints or suggestions from parents or staffs around.",
      value: report.complaintsParentsStaff,
    },
  ];

  return (
    <div>
      <div className="print:hidden mb-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-ghost" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="btn btn-primary" onClick={printPdf}>
          Print / Save PDF
        </button>
        <button type="button" className="btn btn-dark" onClick={shareGmail}>
          Share Gmail
        </button>
        <button type="button" className="btn btn-ghost" onClick={shareMailto}>
          Email app
        </button>
        <button type="button" className="btn btn-dark" onClick={shareWhatsApp}>
          Share WhatsApp
        </button>
      </div>
      <p className="print:hidden mb-4 text-xs text-muted">
        Print / Save PDF: browser dialog ma “Save as PDF” chhannus. Gmail /
        WhatsApp ma report text share huncha — PDF attach garnu cha bhane pahile
        Save as PDF gari attach garnus.
      </p>

      <div className="print-area space-y-6 rounded-xl border border-stone bg-white p-6 text-brand-ink">
        <header className="border-b border-stone pb-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/logo.jpg"
            alt=""
            className="mx-auto mb-2 h-14 w-14 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <p className="text-xs uppercase tracking-widest text-muted">
            School of Social Development · Bodgaun
          </p>
          <h2 className="font-display mt-2 text-2xl">Weekly Meeting Report</h2>
          <p className="mt-1 text-sm">
            {fmtDate(report.weekStartDate)} — {fmtDate(weekEnd)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Lead: {report.departmentLeadName} · {report.email}
          </p>
        </header>

        <dl className="space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="break-inside-avoid">
              <dt className="text-sm font-semibold text-brand-ink">{f.label}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-ink/90">
                {f.value?.trim() ? f.value : "—"}
              </dd>
            </div>
          ))}
        </dl>

        <AttachmentPrintBlock
          title="Supporting files (SOSD)"
          files={report.attachmentsSosd || []}
        />
        <AttachmentPrintBlock
          title="Supporting files (Pinky House)"
          files={report.attachmentsPinkyHouse || []}
        />

        <footer className="border-t border-stone pt-3 text-center text-xs text-muted">
          Generated from SOSD weekly report form ·{" "}
          {fmtDate(report.updatedAt.slice(0, 10))}
        </footer>
      </div>
    </div>
  );
}

function AttachmentPrintBlock({
  title,
  files,
}: {
  title: string;
  files: WeeklyAttachment[];
}) {
  if (!files.length) {
    return (
      <section className="break-inside-avoid">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">None uploaded.</p>
      </section>
    );
  }
  return (
    <section className="break-inside-avoid space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-3">
        {files.map((f, i) => (
          <li key={`${f.url}-${i}`}>
            {f.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.url}
                alt={f.name}
                className="max-h-64 max-w-full rounded object-contain"
              />
            ) : (
              <a href={f.url} className="text-sm text-sky underline">
                {f.name}
              </a>
            )}
            <p className="text-xs text-muted">{f.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
