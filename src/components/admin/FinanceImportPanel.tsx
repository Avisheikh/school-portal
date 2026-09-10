"use client";

import { useState } from "react";
import { apiJson } from "@/components/admin/ui";

type PreviewRow = {
  rowNumber: number;
  date: string;
  type: "income" | "expense";
  accountHead: string;
  particular: string;
  amount: number;
  voucherNo?: string;
  sector?: string;
  notes?: string;
  ok: boolean;
  error?: string;
  matchedCategory?: string;
};

function npr(n: number) {
  return new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export default function FinanceImportPanel({
  onImported,
}: {
  onImported: () => void;
}) {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [okCount, setOkCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [createMissing, setCreateMissing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sampleHeads, setSampleHeads] = useState<string[]>([]);

  async function onFile(file: File | null) {
    if (!file) return;
    setError("");
    setMessage("");
    setLoading(true);
    setPreview(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/finance/import", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFileName(data.fileName || file.name);
      setPreview(data.rows || []);
      setOkCount(data.okCount || 0);
      setErrorCount(data.errorCount || 0);
      setSampleHeads(data.sampleHeads || []);
      setMessage(
        `Preview: ${data.okCount} OK, ${data.errorCount} with errors. Review then Import.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!preview) return;
    const rows = preview.filter((r) => r.ok);
    if (!rows.length) {
      setError("No valid rows to import");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiJson<{
        imported: number;
        createdHeads: string[];
        totalEntries: number;
      }>("/api/finance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          rows,
          createMissingHeads: createMissing,
        }),
      });
      setMessage(
        `Imported ${data.imported} entries. Total ledger entries: ${data.totalEntries}.${
          data.createdHeads.length
            ? ` New account heads: ${data.createdHeads.join(", ")}.`
            : ""
        } Now open Audit Reports → Yearly.`,
      );
      setPreview(null);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  const incomeTotal = (preview || [])
    .filter((r) => r.ok && r.type === "income")
    .reduce((s, r) => s + r.amount, 0);
  const expenseTotal = (preview || [])
    .filter((r) => r.ok && r.type === "expense")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4 rounded-xl border border-brand/30 bg-white p-5">
      <div>
        <h2 className="font-display text-2xl text-brand-ink">
          Excel / CSV Import (Previous FY)
        </h2>
        <p className="mt-2 text-sm text-muted">
          सालभरिको income–expense Excel upload गर्नुहोस्। Import पछि{" "}
          <strong>Audit Reports</strong> बाट Nepal FY yearly / trimester report
          generate गर्न सकिन्छ।
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href="/api/finance/import" className="btn btn-ghost text-sm">
          Download Excel template
        </a>
        <label className="btn btn-dark text-sm cursor-pointer">
          {loading ? "Reading…" : "Choose Excel / CSV"}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={loading}
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <div className="rounded-lg bg-mist/60 p-3 text-xs text-muted">
        <p className="font-semibold text-brand-ink">Required columns</p>
        <p className="mt-1">
          Date · Type (income/expense) · Account Head · Particular · Amount ·
          Voucher No (optional) · Sector (optional) · Notes (optional)
        </p>
        {sampleHeads.length > 0 && (
          <p className="mt-2">
            Existing heads: {sampleHeads.slice(0, 8).join(", ")}
            {sampleHeads.length > 8 ? "…" : ""}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={createMissing}
          onChange={(e) => setCreateMissing(e.target.checked)}
        />
        Create new account head if name not found
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-green-800">{message}</p>}

      {preview && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-stone p-3">
              <p className="text-xs text-muted">File</p>
              <p className="font-semibold text-sm">{fileName}</p>
            </div>
            <div className="rounded-lg border border-stone p-3">
              <p className="text-xs text-muted">Valid rows</p>
              <p className="font-display text-xl text-green-800">{okCount}</p>
            </div>
            <div className="rounded-lg border border-stone p-3">
              <p className="text-xs text-muted">Income total</p>
              <p className="font-mono text-green-800">{npr(incomeTotal)}</p>
            </div>
            <div className="rounded-lg border border-stone p-3">
              <p className="text-xs text-muted">Expense total</p>
              <p className="font-mono text-red-800">{npr(expenseTotal)}</p>
            </div>
          </div>

          {errorCount > 0 && (
            <p className="text-sm text-amber-800">
              {errorCount} row(s) have errors and will be skipped.
            </p>
          )}

          <div className="table-wrap max-h-80 overflow-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Account head</th>
                  <th>Particular</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 100).map((r) => (
                  <tr key={r.rowNumber}>
                    <td>{r.rowNumber}</td>
                    <td>
                      {r.ok ? (
                        <span className="badge badge-green">OK</span>
                      ) : (
                        <span className="badge badge-red" title={r.error}>
                          Error
                        </span>
                      )}
                    </td>
                    <td>{r.date || "—"}</td>
                    <td className="capitalize">{r.type}</td>
                    <td>
                      {r.accountHead}
                      {r.matchedCategory &&
                        r.matchedCategory !== r.accountHead && (
                          <div className="text-xs text-muted">
                            → {r.matchedCategory}
                          </div>
                        )}
                      {!r.matchedCategory && r.ok && createMissing && (
                        <div className="text-xs text-amber-700">new head</div>
                      )}
                    </td>
                    <td>{r.particular}</td>
                    <td className="text-right font-mono">{npr(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 100 && (
            <p className="text-xs text-muted">
              Showing first 100 of {preview.length} rows.
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || okCount === 0}
            onClick={confirmImport}
          >
            {loading
              ? "Importing…"
              : `Import ${okCount} valid rows into ledger`}
          </button>
        </>
      )}
    </div>
  );
}
