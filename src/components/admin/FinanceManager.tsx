"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AuditReportsPanel from "@/components/admin/AuditReportsPanel";
import { DualDate } from "@/components/admin/DualDate";
import FinanceImportPanel from "@/components/admin/FinanceImportPanel";
import { Field, Modal, apiJson } from "@/components/admin/ui";
import { formatAd, formatBs, formatBsNp } from "@/lib/bilingualDate";
import type { FinanceCategory, LedgerRow, SectorSummary } from "@/lib/types";

type FinancePayload = {
  openingBalance: number;
  closingBalance: number;
  categories: FinanceCategory[];
  entries: LedgerRow[];
  totals: { debit: number; credit: number; net: number };
  bySector: SectorSummary[];
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    sector: string;
    type: string;
    debit: number;
    credit: number;
    net: number;
    count: number;
  }>;
  meta: { view: string; year: number; month: number | null; sector: string | null };
};

function npr(n: number) {
  return new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function FinanceManager() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [tab, setTab] = useState<
    | "saved"
    | "import"
    | "ledger"
    | "monthly"
    | "yearly"
    | "audit"
    | "accounts"
  >("saved");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [sector, setSector] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [data, setData] = useState<FinancePayload | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerRow | null>(null);
  const [form, setForm] = useState({
    date: today.toISOString().slice(0, 10),
    voucherNo: "",
    particular: "",
    categoryId: "",
    amount: "",
    notes: "",
  });

  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    code: "",
    name: "",
    type: "expense" as "income" | "expense",
    sector: "",
  });
  const [openingInput, setOpeningInput] = useState("0");
  const [downloadFrom, setDownloadFrom] = useState(`${currentYear}-01-01`);
  const [downloadTo, setDownloadTo] = useState(
    today.toISOString().slice(0, 10),
  );

  const years = useMemo(
    () => [currentYear - 2, currentYear - 1, currentYear, currentYear + 1],
    [currentYear],
  );

  const load = useCallback(async () => {
    setError("");
    const view =
      tab === "monthly" || tab === "yearly"
        ? tab
        : tab === "accounts"
          ? "all"
          : "all";
    const params = new URLSearchParams({
      view,
      year: String(year),
    });
    if (tab === "monthly") params.set("month", String(month));
    if (sector) params.set("sector", sector);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    const res = await apiJson<FinancePayload>(`/api/finance?${params}`);
    setData(res);
    setOpeningInput(String(res.openingBalance));
  }, [tab, year, month, sector, categoryFilter]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const sectors = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(data.categories.map((c) => c.sector).filter(Boolean)),
    ).sort();
  }, [data]);

  const activeCategories = useMemo(
    () => (data?.categories || []).filter((c) => c.active),
    [data],
  );

  /** Group ledger rows under one account head — for yearly/monthly print */
  const headwiseGroups = useMemo(() => {
    if (!data) return { expenses: [], incomes: [] };
    type Group = {
      categoryId: string;
      categoryName: string;
      sector: string;
      type: "income" | "expense";
      rows: LedgerRow[];
      totalDebit: number;
      totalCredit: number;
    };
    const map = new Map<string, Group>();
    for (const e of data.entries) {
      const key = e.categoryId || e.categoryName;
      const g = map.get(key) || {
        categoryId: e.categoryId,
        categoryName: e.categoryName,
        sector: e.sector,
        type: e.type,
        rows: [],
        totalDebit: 0,
        totalCredit: 0,
      };
      g.rows.push(e);
      g.totalDebit += e.debit || 0;
      g.totalCredit += e.credit || 0;
      map.set(key, g);
    }
    const all = Array.from(map.values()).map((g) => ({
      ...g,
      rows: [...g.rows].sort((a, b) => a.date.localeCompare(b.date)),
      totalDebit: Math.round(g.totalDebit * 100) / 100,
      totalCredit: Math.round(g.totalCredit * 100) / 100,
    }));
    all.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    return {
      expenses: all.filter((g) => g.type === "expense"),
      incomes: all.filter((g) => g.type === "income"),
    };
  }, [data]);

  function openCreate() {
    setEditing(null);
    setForm({
      date: today.toISOString().slice(0, 10),
      voucherNo: "",
      particular: "",
      categoryId: activeCategories[0]?.id || "",
      amount: "",
      notes: "",
    });
    setFormOpen(true);
  }

  function openEdit(row: LedgerRow) {
    setEditing(row);
    setForm({
      date: row.date,
      voucherNo: row.voucherNo,
      particular: row.particular,
      categoryId: row.categoryId,
      amount: String(row.debit || row.credit),
      notes: row.notes,
    });
    setFormOpen(true);
  }

  async function saveEntry(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiJson("/api/finance", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { ...form, id: editing.id, amount: Number(form.amount) }
            : { ...form, amount: Number(form.amount) },
        ),
      });
      setFormOpen(false);
      setTab("saved");
      setMessage(
        editing
          ? "Entry updated and saved permanently."
          : "Income/expense saved permanently in Saved Entries.",
      );
      const res = await apiJson<FinancePayload>(
        `/api/finance?view=all&year=${year}`,
      );
      setData(res);
      setOpeningInput(String(res.openingBalance));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  function downloadBackup(kind: "json" | "csv") {
    if (!data) return;
    const from = downloadFrom || "0000-01-01";
    const to = downloadTo || "9999-12-31";
    if (from > to) {
      setError("Download: From date must be before To date.");
      return;
    }
    const filtered = data.entries.filter(
      (e) => e.date >= from && e.date <= to,
    );
    const t = filtered.reduce(
      (acc, e) => ({
        debit: acc.debit + (e.debit || 0),
        credit: acc.credit + (e.credit || 0),
      }),
      { debit: 0, credit: 0 },
    );
    const rangeLabel =
      downloadFrom || downloadTo
        ? `${from}_to_${to}`
        : new Date().toISOString().slice(0, 10);

    if (filtered.length === 0) {
      setError(
        `No entries found between ${from} and ${to}. Change date filter.`,
      );
      return;
    }
    setError("");
    setMessage(
      `Downloading ${filtered.length} entries (${from} → ${to}). Income: ${npr(t.credit)}, Expense: ${npr(t.debit)}`,
    );

    if (kind === "json") {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              school: "SOSD Bodgaun",
              exportedAt: new Date().toISOString(),
              dateFrom: from,
              dateTo: to,
              entryCount: filtered.length,
              totals: {
                debit: Math.round(t.debit * 100) / 100,
                credit: Math.round(t.credit * 100) / 100,
              },
              openingBalance: data.openingBalance,
              entries: filtered,
              categories: data.categories,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sosd-finance-${rangeLabel}.json`;
      a.click();
      return;
    }
    const header = [
      "Date_AD",
      "Date_BS_English",
      "Date_BS_Nepali",
      "Voucher",
      "Type",
      "AccountHead",
      "Sector",
      "Particular",
      "Debit",
      "Credit",
      "Notes",
    ];
    const lines = filtered.map((e) =>
      [
        e.date,
        formatBs(e.date),
        `"${(formatBsNp(e.date) || "").replace(/"/g, '""')}"`,
        e.voucherNo,
        e.type,
        e.categoryName,
        e.sector,
        `"${(e.particular || "").replace(/"/g, '""')}"`,
        e.debit || 0,
        e.credit || 0,
        `"${(e.notes || "").replace(/"/g, '""')}"`,
      ].join(","),
    );
    lines.push(
      `"TOTAL","","","","","","","",${Math.round(t.debit * 100) / 100},${Math.round(t.credit * 100) / 100},""`,
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sosd-finance-${rangeLabel}.csv`;
    a.click();
  }

  async function removeEntry(id: string) {
    if (!confirm("Delete this ledger entry?")) return;
    await apiJson(`/api/finance?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function saveCategory(e: FormEvent) {
    e.preventDefault();
    try {
      await apiJson("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addCategory", ...catForm }),
      });
      setCatOpen(false);
      setCatForm({ code: "", name: "", type: "expense", sector: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function saveOpening() {
    await apiJson("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setOpeningBalance",
        openingBalance: Number(openingInput) || 0,
      }),
    });
    setMessage("Opening balance updated.");
    await load();
  }

  function printReport() {
    window.print();
  }

  const reportTitle =
    tab === "monthly"
      ? `Monthly Financial Report — ${MONTHS[month - 1]} ${year}`
      : tab === "yearly"
        ? `Yearly Financial Report — ${year}`
        : `Cash Book / Ledger — ${year}`;

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm text-muted">
        Entry गरेको income र expense यहाँ स्थायी रूपमा save हुन्छ (
        <code className="text-xs">data/finance.json</code>). Saved Entries मा
        सबै दर्ता हेर्न, Edit/Delete गर्न र CSV/JSON backup डाउनलोड गर्न सकिन्छ।
      </p>

      <div className="flex flex-wrap gap-2 print:hidden">
        {(
          [
            ["saved", "Saved Entries"],
            ["import", "Excel Import"],
            ["ledger", "Cash Book"],
            ["audit", "Audit Reports"],
            ["monthly", "Monthly Report"],
            ["yearly", "Yearly Report"],
            ["accounts", "Account Heads"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn text-sm ${tab === id ? "btn-brand" : "btn-ghost"}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone bg-white p-4 print:hidden">
        {tab !== "saved" && tab !== "accounts" && tab !== "import" && tab !== "audit" && (
        <label className="text-sm">
          <span className="mb-1 block font-medium">Year</span>
          <select
            className="input"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        )}
        {tab === "monthly" && (
          <label className="text-sm">
            <span className="mb-1 block font-medium">Month</span>
            <select
              className="input"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          <span className="mb-1 block font-medium">Sector</span>
          <select
            className="input min-w-[10rem]"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Account head</span>
          <select
            className="input min-w-[12rem]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All heads</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} — ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {tab !== "accounts" && tab !== "import" && tab !== "audit" && (
          <>
            <button type="button" className="btn btn-dark" onClick={openCreate}>
              + Add income / expense
            </button>
            {(tab === "saved" || tab === "ledger") && (
              <>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">
                    Download from (AD)
                  </span>
                  <input
                    className="input"
                    type="date"
                    value={downloadFrom}
                    onChange={(e) => setDownloadFrom(e.target.value)}
                  />
                  {downloadFrom ? (
                    <span className="mt-1 block text-[11px] text-muted">
                      BS: {formatBsNp(downloadFrom) || formatBs(downloadFrom)}
                    </span>
                  ) : null}
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">Download to (AD)</span>
                  <input
                    className="input"
                    type="date"
                    value={downloadTo}
                    onChange={(e) => setDownloadTo(e.target.value)}
                  />
                  {downloadTo ? (
                    <span className="mt-1 block text-[11px] text-muted">
                      BS: {formatBsNp(downloadTo) || formatBs(downloadTo)}
                    </span>
                  ) : null}
                </label>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => downloadBackup("csv")}
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => downloadBackup("json")}
                >
                  Download JSON
                </button>
              </>
            )}
            {(tab === "monthly" || tab === "yearly") && (
              <button type="button" className="btn btn-ghost" onClick={printReport}>
                Print / PDF
              </button>
            )}
          </>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-700 print:hidden">{error}</p>}
      {message && (
        <p className="mb-3 text-sm text-green-800 print:hidden">{message}</p>
      )}

      {!data ? (
        <p className="text-muted">Loading finance data…</p>
      ) : tab === "accounts" ? (
        <AccountsPanel
          categories={data.categories}
          openingInput={openingInput}
          setOpeningInput={setOpeningInput}
          onSaveOpening={saveOpening}
          onAdd={() => setCatOpen(true)}
          onReload={load}
        />
      ) : tab === "import" ? (
        <FinanceImportPanel
          onImported={() => {
            setTab("saved");
            setMessage(
              "Excel imported. Open Audit Reports → Yearly (Nepal FY) to generate auditor report.",
            );
            load().catch(() => undefined);
          }}
        />
      ) : tab === "audit" ? (
        <AuditReportsPanel />
      ) : tab === "saved" ? (
        <SavedEntriesPanel
          data={data}
          onEdit={openEdit}
          onDelete={removeEntry}
          onAdd={openCreate}
          onDownload={downloadBackup}
          downloadFrom={downloadFrom}
          downloadTo={downloadTo}
          setDownloadFrom={setDownloadFrom}
          setDownloadTo={setDownloadTo}
        />
      ) : (
        <div className="print-area space-y-6">
          <div className="hidden print:block">
            <h1 className="font-display text-2xl">
              School of Social Development (SOSD) — Bodgaun
            </h1>
            <p className="text-sm">Indrawati-11, Sindhupalchowk</p>
            <h2 className="mt-2 text-lg font-bold">{reportTitle}</h2>
            {sector && <p className="text-sm">Sector filter: {sector}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Opening balance" value={npr(data.openingBalance)} />
            <Stat
              label="Total credit (income)"
              value={npr(data.totals.credit)}
              tone="green"
            />
            <Stat
              label="Total debit (expense)"
              value={npr(data.totals.debit)}
              tone="red"
            />
            <Stat
              label="Closing balance"
              value={npr(data.closingBalance)}
              tone="blue"
            />
          </div>

          {(tab === "monthly" || tab === "yearly") && (
            <>
              {/* —— Head-wise yearly/monthly detail (print-friendly) —— */}
              <section className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl text-brand-ink">
                    {tab === "yearly" ? `वर्ष ${year}` : `${MONTHS[month - 1]} ${year}`}{" "}
                    — शिर्षक अनुसार खर्च विवरण
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    एउटै शिर्षक (जस्तै Salary) अन्तर्गत वर्षभरिका सबै खर्च मिति सहित,
                    अन्त्यमा त्यस शिर्षकको जम्मा।
                  </p>
                </div>

                {headwiseGroups.expenses.length === 0 && (
                  <p className="text-muted">यस अवधिमा कुनै खर्च रेकर्ड छैन।</p>
                )}

                {headwiseGroups.expenses.map((g) => (
                  <div
                    key={g.categoryId}
                    className="break-inside-avoid rounded-xl border border-stone bg-white overflow-hidden"
                  >
                    <div className="border-b border-stone bg-mist px-4 py-3">
                      <h3 className="font-display text-lg text-brand-ink">
                        खर्च शिर्षक: {g.categoryName}
                      </h3>
                      <p className="text-xs text-muted">
                        Sector: {g.sector} · Entries: {g.rows.length}
                      </p>
                    </div>
                    <div className="table-wrap border-0 rounded-none">
                      <table className="data">
                        <thead>
                          <tr>
                            <th>मिति (AD / BS)</th>
                            <th>Voucher</th>
                            <th>Particular / विवरण</th>
                            <th className="text-right">रकम (Debit)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((row) => (
                            <tr key={row.id}>
                              <td className="whitespace-nowrap"><DualDate iso={row.date} /></td>
                              <td>{row.voucherNo || "—"}</td>
                              <td>
                                {row.particular}
                                {row.notes && (
                                  <div className="text-xs text-muted">
                                    {row.notes}
                                  </div>
                                )}
                              </td>
                              <td className="text-right font-mono">
                                {npr(row.debit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-red-50 font-bold">
                            <td colSpan={3}>
                              जम्मा — {g.categoryName}
                              {tab === "yearly"
                                ? ` (वर्ष ${year} भरि)`
                                : ` (${MONTHS[month - 1]} ${year})`}
                            </td>
                            <td className="text-right font-mono text-red-800">
                              {npr(g.totalDebit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border-2 border-brand bg-white px-4 py-3">
                  <p className="font-display text-lg text-brand-ink">
                    सबै खर्च शिर्षकको जम्मा (Total expenses)
                    {tab === "yearly" ? ` — ${year}` : ""}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-red-800">
                    NPR {npr(data.totals.debit)}
                  </p>
                </div>
              </section>

              <section className="space-y-8">
                <h2 className="font-display text-2xl text-brand-ink">
                  शिर्षक अनुसार आम्दानी विवरण
                </h2>

                {headwiseGroups.incomes.length === 0 && (
                  <p className="text-muted">यस अवधिमा कुनै आम्दानी रेकर्ड छैन।</p>
                )}

                {headwiseGroups.incomes.map((g) => (
                  <div
                    key={g.categoryId}
                    className="break-inside-avoid rounded-xl border border-stone bg-white overflow-hidden"
                  >
                    <div className="border-b border-stone bg-green-50 px-4 py-3">
                      <h3 className="font-display text-lg text-brand-ink">
                        आम्दानी शिर्षक: {g.categoryName}
                      </h3>
                      <p className="text-xs text-muted">
                        Sector: {g.sector} · Entries: {g.rows.length}
                      </p>
                    </div>
                    <div className="table-wrap border-0 rounded-none">
                      <table className="data">
                        <thead>
                          <tr>
                            <th>मिति (AD / BS)</th>
                            <th>Voucher</th>
                            <th>Particular / विवरण</th>
                            <th className="text-right">रकम (Credit)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((row) => (
                            <tr key={row.id}>
                              <td className="whitespace-nowrap"><DualDate iso={row.date} /></td>
                              <td>{row.voucherNo || "—"}</td>
                              <td>
                                {row.particular}
                                {row.notes && (
                                  <div className="text-xs text-muted">
                                    {row.notes}
                                  </div>
                                )}
                              </td>
                              <td className="text-right font-mono">
                                {npr(row.credit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-green-50 font-bold">
                            <td colSpan={3}>
                              जम्मा — {g.categoryName}
                              {tab === "yearly"
                                ? ` (वर्ष ${year} भरि)`
                                : ` (${MONTHS[month - 1]} ${year})`}
                            </td>
                            <td className="text-right font-mono text-green-800">
                              {npr(g.totalCredit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border-2 border-green-700 bg-white px-4 py-3">
                  <p className="font-display text-lg text-brand-ink">
                    सबै आम्दानी शिर्षकको जम्मा (Total income)
                    {tab === "yearly" ? ` — ${year}` : ""}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-green-800">
                    NPR {npr(data.totals.credit)}
                  </p>
                </div>
              </section>

              {/* Compact summary table for auditor overview */}
              <section>
                <h2 className="font-display mb-3 text-xl text-brand-ink">
                  शिर्षक सारांश तालिका (Summary)
                </h2>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>शिर्षक (Account head)</th>
                        <th>Sector</th>
                        <th>प्रकार</th>
                        <th>पटक</th>
                        <th className="text-right">खर्च जम्मा</th>
                        <th className="text-right">आम्दानी जम्मा</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCategory.map((c) => (
                        <tr key={c.categoryId}>
                          <td>
                            <strong>{c.categoryName}</strong>
                          </td>
                          <td>{c.sector}</td>
                          <td className="capitalize">{c.type}</td>
                          <td>{c.count}</td>
                          <td className="text-right font-mono">
                            {c.debit ? npr(c.debit) : "—"}
                          </td>
                          <td className="text-right font-mono">
                            {c.credit ? npr(c.credit) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-mist font-semibold">
                        <td colSpan={4}>कुल जम्मा</td>
                        <td className="text-right font-mono">
                          {npr(data.totals.debit)}
                        </td>
                        <td className="text-right font-mono">
                          {npr(data.totals.credit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* Chronological cash book — screen only on yearly (print uses head-wise) */}
          <section className={tab === "yearly" ? "print:hidden" : ""}>
            <h2 className="font-display mb-3 text-xl text-brand-ink">
              Detailed ledger (मिति क्रम)
            </h2>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date (AD / BS)</th>
                    <th>Voucher</th>
                    <th>Particular</th>
                    <th>Account head</th>
                    <th>Sector</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                    <th className="text-right">Balance</th>
                    <th className="print:hidden" />
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-mist/50">
                    <td colSpan={5}>
                      <em>Opening balance</em>
                    </td>
                    <td className="text-right font-mono">—</td>
                    <td className="text-right font-mono">—</td>
                    <td className="text-right font-mono font-semibold">
                      {npr(data.openingBalance)}
                    </td>
                    <td className="print:hidden" />
                  </tr>
                  {data.entries.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap"><DualDate iso={row.date} /></td>
                      <td>{row.voucherNo || "—"}</td>
                      <td>
                        <strong>{row.particular}</strong>
                        {row.notes && (
                          <div className="text-xs text-muted">{row.notes}</div>
                        )}
                      </td>
                      <td>{row.categoryName}</td>
                      <td>{row.sector}</td>
                      <td className="text-right font-mono">
                        {row.debit ? npr(row.debit) : "—"}
                      </td>
                      <td className="text-right font-mono">
                        {row.credit ? npr(row.credit) : "—"}
                      </td>
                      <td className="text-right font-mono font-semibold">
                        {npr(row.balance)}
                      </td>
                      <td className="space-x-2 whitespace-nowrap print:hidden">
                        <button
                          type="button"
                          className="text-sm font-semibold text-brand"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-semibold text-red-700"
                          onClick={() => removeEntry(row.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.entries.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-muted">
                        No entries yet. Click “Add entry” to record income or
                        expense.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-mist font-semibold">
                    <td colSpan={5}>Period totals / Closing</td>
                    <td className="text-right font-mono">
                      {npr(data.totals.debit)}
                    </td>
                    <td className="text-right font-mono">
                      {npr(data.totals.credit)}
                    </td>
                    <td className="text-right font-mono">
                      {npr(data.closingBalance)}
                    </td>
                    <td className="print:hidden" />
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              Note: Debit = खर्च (money out). Credit = आम्दानी (money in).
              Balance = Opening + Credit − Debit (cash position).
            </p>
          </section>

          {(tab === "monthly" || tab === "yearly") && (
            <section className="rounded-xl border border-dashed border-stone p-4 text-sm text-muted print:hidden">
              <p className="font-semibold text-brand-ink">
                Auditor year-end checklist
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>All vouchers entered with date, particular and account head</li>
                <li>
                  Same-type expenses (e.g. salary, electricity) appear under one
                  account head with dates and yearly total
                </li>
                <li>Closing balance agrees with bank / cash count</li>
              </ul>
            </section>
          )}
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Edit ledger entry" : "Add income / expense"}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={saveEntry} className="grid gap-3">
          <Field label="Date (AD)">
            <input
              className="input"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            {form.date ? (
              <p className="mt-1 text-xs text-muted">
                English (AD): {formatAd(form.date)}
                <br />
                नेपाली (BS): {formatBsNp(form.date) || formatBs(form.date)}
              </p>
            ) : null}
          </Field>
          <Field label="Voucher no. (optional)">
            <input
              className="input"
              value={form.voucherNo}
              onChange={(e) => setForm({ ...form, voucherNo: e.target.value })}
            />
          </Field>
          <Field label="Particular (विवरण)">
            <input
              className="input"
              required
              placeholder="e.g. NEA electricity bill — March 2026"
              value={form.particular}
              onChange={(e) => setForm({ ...form, particular: e.target.value })}
            />
          </Field>
          <Field label="Account head / sector">
            <select
              className="input"
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select…</option>
              <optgroup label="Income (Credit)">
                {activeCategories
                  .filter((c) => c.type === "income")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.sector}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Expense (Debit)">
                {activeCategories
                  .filter((c) => c.type === "expense")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.sector}
                    </option>
                  ))}
              </optgroup>
            </select>
          </Field>
          <Field label="Amount (NPR)">
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <button type="submit" className="btn btn-dark w-full">
            Save & keep permanently
          </button>
        </form>
      </Modal>

      <Modal
        open={catOpen}
        title="Add account head"
        onClose={() => setCatOpen(false)}
      >
        <form onSubmit={saveCategory} className="grid gap-3">
          <Field label="Code">
            <input
              className="input"
              placeholder="EXP-12"
              value={catForm.code}
              onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
            />
          </Field>
          <Field label="Name">
            <input
              className="input"
              required
              placeholder="Electricity"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <select
              className="input"
              value={catForm.type}
              onChange={(e) =>
                setCatForm({
                  ...catForm,
                  type: e.target.value as "income" | "expense",
                })
              }
            >
              <option value="expense">Expense (Debit)</option>
              <option value="income">Income (Credit)</option>
            </select>
          </Field>
          <Field label="Sector group">
            <input
              className="input"
              required
              placeholder="Utilities"
              value={catForm.sector}
              onChange={(e) =>
                setCatForm({ ...catForm, sector: e.target.value })
              }
            />
          </Field>
          <button type="submit" className="btn btn-dark w-full">
            Add account head
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SavedEntriesPanel({
  data,
  onEdit,
  onDelete,
  onAdd,
  onDownload,
  downloadFrom,
  downloadTo,
  setDownloadFrom,
  setDownloadTo,
}: {
  data: FinancePayload;
  onEdit: (row: LedgerRow) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onDownload: (kind: "json" | "csv") => void;
  downloadFrom: string;
  downloadTo: string;
  setDownloadFrom: (v: string) => void;
  setDownloadTo: (v: string) => void;
}) {
  const from = downloadFrom || "0000-01-01";
  const to = downloadTo || "9999-12-31";
  const filtered = data.entries.filter(
    (e) => e.date >= from && e.date <= to,
  );
  const incomes = filtered.filter((e) => e.type === "income");
  const expenses = filtered.filter((e) => e.type === "expense");
  const incomeTotal = incomes.reduce((s, e) => s + (e.credit || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + (e.debit || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-brand/30 bg-white p-5">
        <h2 className="font-display text-2xl text-brand-ink">
          Saved Income & Expense Entries
        </h2>
        <p className="mt-2 text-sm text-muted">
          Date filter लगाएर हेर्नुहोस् र सोही मिति दायराको data download गर्नुहोस्।
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-stone bg-mist/50 p-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium">From date (AD)</span>
            <input
              className="input"
              type="date"
              value={downloadFrom}
              onChange={(e) => setDownloadFrom(e.target.value)}
            />
            {downloadFrom ? (
              <span className="mt-1 block text-[11px] text-muted">
                BS: {formatBsNp(downloadFrom) || formatBs(downloadFrom)}
              </span>
            ) : null}
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">To date (AD)</span>
            <input
              className="input"
              type="date"
              value={downloadTo}
              onChange={(e) => setDownloadTo(e.target.value)}
            />
            {downloadTo ? (
              <span className="mt-1 block text-[11px] text-muted">
                BS: {formatBsNp(downloadTo) || formatBs(downloadTo)}
              </span>
            ) : null}
          </label>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => {
              const y = new Date().getFullYear();
              setDownloadFrom(`${y}-01-01`);
              setDownloadTo(new Date().toISOString().slice(0, 10));
            }}
          >
            This year
          </button>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => {
              setDownloadFrom("");
              setDownloadTo("");
            }}
          >
            All dates
          </button>
          <button
            type="button"
            className="btn btn-brand"
            onClick={() => onDownload("csv")}
          >
            Download CSV ({filtered.length})
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => onDownload("json")}
          >
            Download JSON ({filtered.length})
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn btn-dark" onClick={onAdd}>
            + नयाँ entry save गर्नुहोस्
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Entries in date range"
            value={String(filtered.length)}
          />
          <Stat
            label="Income in range"
            value={npr(incomeTotal)}
            tone="green"
          />
          <Stat
            label="Expense in range"
            value={npr(expenseTotal)}
            tone="red"
          />
        </div>
      </div>

      <section>
        <h3 className="font-display mb-3 text-xl text-green-800">
          Saved Income (आम्दानी) — {incomes.length}
        </h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date (AD / BS)</th>
                <th>Voucher</th>
                <th>Particular</th>
                <th>Account head</th>
                <th className="text-right">Credit (रकम)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {incomes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted">
                    यो मिति दायरामा income छैन। Date filter बदल्नुहोस् वा नयाँ entry
                    थप्नुहोस्।
                  </td>
                </tr>
              )}
              {incomes.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap"><DualDate iso={row.date} /></td>
                  <td>{row.voucherNo || "—"}</td>
                  <td>
                    <strong>{row.particular}</strong>
                  </td>
                  <td>{row.categoryName}</td>
                  <td className="text-right font-mono text-green-800">
                    {npr(row.credit)}
                  </td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand"
                      onClick={() => onEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700"
                      onClick={() => onDelete(row.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-green-50 font-semibold">
                <td colSpan={4}>जम्मा आम्दानी (filtered)</td>
                <td className="text-right font-mono">{npr(incomeTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-display mb-3 text-xl text-red-800">
          Saved Expense (खर्च) — {expenses.length}
        </h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Date (AD / BS)</th>
                <th>Voucher</th>
                <th>Particular</th>
                <th>Account head</th>
                <th className="text-right">Debit (रकम)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted">
                    यो मिति दायरामा expense छैन। Date filter बदल्नुहोस् वा नयाँ entry
                    थप्नुहोस्।
                  </td>
                </tr>
              )}
              {expenses.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap"><DualDate iso={row.date} /></td>
                  <td>{row.voucherNo || "—"}</td>
                  <td>
                    <strong>{row.particular}</strong>
                  </td>
                  <td>{row.categoryName}</td>
                  <td className="text-right font-mono text-red-800">
                    {npr(row.debit)}
                  </td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand"
                      onClick={() => onEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700"
                      onClick={() => onDelete(row.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-red-50 font-semibold">
                <td colSpan={4}>जम्मा खर्च (filtered)</td>
                <td className="text-right font-mono">{npr(expenseTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "red" | "blue";
}) {
  const color =
    tone === "green"
      ? "text-green-800"
      : tone === "red"
        ? "text-red-800"
        : tone === "blue"
          ? "text-brand"
          : "text-brand-ink";
  return (
    <div className="rounded-xl border border-stone bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-display mt-1 text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function AccountsPanel({
  categories,
  openingInput,
  setOpeningInput,
  onSaveOpening,
  onAdd,
  onReload,
}: {
  categories: FinanceCategory[];
  openingInput: string;
  setOpeningInput: (v: string) => void;
  onSaveOpening: () => void;
  onAdd: () => void;
  onReload: () => Promise<void>;
}) {
  async function toggleActive(c: FinanceCategory) {
    await apiJson("/api/finance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateCategory",
        id: c.id,
        active: !c.active,
      }),
    });
    await onReload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">
            Opening cash / bank balance (NPR)
          </span>
          <input
            className="input"
            type="number"
            step="0.01"
            value={openingInput}
            onChange={(e) => setOpeningInput(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-dark" onClick={onSaveOpening}>
          Save opening
        </button>
        <button type="button" className="btn btn-brand" onClick={onAdd}>
          + Account head
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Account head</th>
              <th>Sector</th>
              <th>Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.code || "—"}</td>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>{c.sector}</td>
                <td className="capitalize">{c.type}</td>
                <td>
                  <span
                    className={`badge ${c.active ? "badge-green" : "badge-amber"}`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand"
                    onClick={() => toggleActive(c)}
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
