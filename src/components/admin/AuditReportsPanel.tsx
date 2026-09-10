"use client";

import { useCallback, useEffect, useState } from "react";
import { DualDate } from "@/components/admin/DualDate";
import { apiJson } from "@/components/admin/ui";
import { formatAdBs, formatAdBsRange } from "@/lib/bilingualDate";
import {
  calendarQuarterRange,
  monthRange,
  nepalFyStartYear,
  nepalTrimesterRange,
  nepalYearlyRange,
  weekRangeFromDate,
  yearRange,
  type PeriodKind,
  type PeriodRange,
} from "@/lib/nepalPeriods";

function npr(n: number) {
  return new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

type AuditReport = {
  report: {
    title: string;
    organization: string;
    shortName: string;
    location: string;
    preparedUnder: string;
    currency: string;
    kind: PeriodKind;
    label: string;
    from: string;
    to: string;
    generatedAt: string;
  };
  openingBalance: number;
  closingBalance: number;
  totals: { debit: number; credit: number; net: number };
  surplusDeficit: number;
  receiptsAndPayments: {
    openingBalance: number;
    receipts: { head: string; sector: string; amount: number; count: number }[];
    totalReceipts: number;
    payments: { head: string; sector: string; amount: number; count: number }[];
    totalPayments: number;
    closingBalance: number;
    check: boolean;
  };
  statementIncomeExpenditure: {
    income: { head: string; amount: number }[];
    totalIncome: number;
    expenditure: { head: string; amount: number }[];
    totalExpenditure: number;
    surplusDeficit: number;
  };
  schedules: Array<{
    categoryId: string;
    categoryName: string;
    sector: string;
    type: string;
    debit: number;
    credit: number;
    lines: Array<{
      date: string;
      voucherNo: string;
      particular: string;
      debit: number;
      credit: number;
      notes: string;
    }>;
  }>;
};

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

export default function AuditReportsPanel() {
  const today = new Date();
  const [kind, setKind] = useState<PeriodKind>("monthly");
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(
    (Math.floor(today.getMonth() / 3) + 1) as 1 | 2 | 3 | 4,
  );
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [useNepalFy, setUseNepalFy] = useState(true);
  const [fyStart, setFyStart] = useState(nepalFyStartYear(today));
  const [weekAnchor, setWeekAnchor] = useState(
    today.toISOString().slice(0, 10),
  );
  const [period, setPeriod] = useState<PeriodRange | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const buildPeriod = useCallback((): PeriodRange => {
    if (kind === "weekly") return weekRangeFromDate(weekAnchor);
    if (kind === "monthly") return monthRange(calendarYear, month);
    if (kind === "quarterly") {
      if (useNepalFy) return nepalTrimesterRange(fyStart, trimester);
      return calendarQuarterRange(calendarYear, quarter);
    }
    // yearly
    if (useNepalFy) return nepalYearlyRange(fyStart);
    return yearRange(calendarYear);
  }, [
    kind,
    weekAnchor,
    calendarYear,
    month,
    useNepalFy,
    fyStart,
    trimester,
    quarter,
  ]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = buildPeriod();
      setPeriod(p);
      const params = new URLSearchParams({
        from: p.from,
        to: p.to,
        kind: p.kind,
        label: p.label,
      });
      const data = await apiJson<AuditReport>(
        `/api/finance/audit-report?${params}`,
      );
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [buildPeriod]);

  useEffect(() => {
    generate().catch(() => undefined);
  }, [generate]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand/30 bg-white p-5 print:hidden">
        <h2 className="font-display text-2xl text-brand-ink">
          Nepal Audit Reports (Auto-generate)
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Weekly, monthly, quarterly/trimester र yearly report स्वतः तयार हुन्छ —
          Receipts & Payments र Income & Expenditure (cash basis), NAS for NPOs
          / school audit अभ्यासअनुसार। Print गरेर auditor लाई दिन सकिन्छ।
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["weekly", "Weekly"],
              ["monthly", "Monthly"],
              ["quarterly", "Quarterly / Trimester"],
              ["yearly", "Yearly (Annual)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`btn text-sm ${kind === id ? "btn-brand" : "btn-ghost"}`}
              onClick={() => setKind(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          {kind === "weekly" && (
            <label className="text-sm">
              <span className="mb-1 block font-medium">Week of date</span>
              <input
                className="input"
                type="date"
                value={weekAnchor}
                onChange={(e) => setWeekAnchor(e.target.value)}
              />
            </label>
          )}

          {kind === "monthly" && (
            <>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Year</span>
                <select
                  className="input"
                  value={calendarYear}
                  onChange={(e) => setCalendarYear(Number(e.target.value))}
                >
                  {[calendarYear - 1, calendarYear, calendarYear + 1].map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ),
                  )}
                </select>
              </label>
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
            </>
          )}

          {(kind === "quarterly" || kind === "yearly") && (
            <label className="flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                checked={useNepalFy}
                onChange={(e) => setUseNepalFy(e.target.checked)}
              />
              Nepal Fiscal Year (Shrawan–Ashad)
            </label>
          )}

          {kind === "quarterly" && useNepalFy && (
            <>
              <label className="text-sm">
                <span className="mb-1 block font-medium">FY start (AD)</span>
                <select
                  className="input"
                  value={fyStart}
                  onChange={(e) => setFyStart(Number(e.target.value))}
                >
                  {[fyStart - 1, fyStart, fyStart + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}/{String(y + 1).slice(2)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Trimester</span>
                <select
                  className="input"
                  value={trimester}
                  onChange={(e) =>
                    setTrimester(Number(e.target.value) as 1 | 2 | 3)
                  }
                >
                  <option value={1}>1st — Shrawan–Kartik</option>
                  <option value={2}>2nd — Manshir–Falgun</option>
                  <option value={3}>3rd — Chaitra–Ashad</option>
                </select>
              </label>
            </>
          )}

          {kind === "quarterly" && !useNepalFy && (
            <>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Year</span>
                <select
                  className="input"
                  value={calendarYear}
                  onChange={(e) => setCalendarYear(Number(e.target.value))}
                >
                  {[calendarYear - 1, calendarYear, calendarYear + 1].map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Quarter</span>
                <select
                  className="input"
                  value={quarter}
                  onChange={(e) =>
                    setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)
                  }
                >
                  <option value={1}>Q1 Jan–Mar</option>
                  <option value={2}>Q2 Apr–Jun</option>
                  <option value={3}>Q3 Jul–Sep</option>
                  <option value={4}>Q4 Oct–Dec</option>
                </select>
              </label>
            </>
          )}

          {kind === "yearly" && useNepalFy && (
            <label className="text-sm">
              <span className="mb-1 block font-medium">Nepal FY start (AD)</span>
              <select
                className="input"
                value={fyStart}
                onChange={(e) => setFyStart(Number(e.target.value))}
              >
                {[fyStart - 1, fyStart, fyStart + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}/{String(y + 1).slice(2)} (≈ Jul 16–Jul 15)
                  </option>
                ))}
              </select>
            </label>
          )}

          {kind === "yearly" && !useNepalFy && (
            <label className="text-sm">
              <span className="mb-1 block font-medium">Calendar year</span>
              <select
                className="input"
                value={calendarYear}
                onChange={(e) => setCalendarYear(Number(e.target.value))}
              >
                {[calendarYear - 1, calendarYear, calendarYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            className="btn btn-dark"
            onClick={generate}
            disabled={loading}
          >
            {loading ? "Generating…" : "Auto-generate report"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            disabled={!report}
          >
            Print / PDF
          </button>
        </div>

        {period && (
          <p className="mt-3 text-sm text-brand-ink">
            Period: <strong>{period.label}</strong> (
            {formatAdBsRange(period.from, period.to)})
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>

      {report && <AuditReportDocument report={report} />}
    </div>
  );
}

function AuditReportDocument({ report }: { report: AuditReport }) {
  const r = report.report;
  const rp = report.receiptsAndPayments;
  const ie = report.statementIncomeExpenditure;

  return (
    <div className="print-area space-y-8 rounded-xl border border-stone bg-white p-6">
      <header className="border-b border-stone pb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-muted">
          For statutory / internal audit use
        </p>
        <h1 className="font-display mt-2 text-2xl text-brand-ink sm:text-3xl">
          {r.organization}
        </h1>
        <p className="text-sm text-muted">{r.location}</p>
        <h2 className="mt-4 text-lg font-bold text-brand-ink">{r.label}</h2>
        <p className="text-sm">
          Period: <strong>{formatAdBs(r.from)}</strong>
          {" → "}
          <strong>{formatAdBs(r.to)}</strong> · Currency: {r.currency}
        </p>
        <p className="mt-2 text-xs text-muted">{r.preparedUnder}</p>
        <p className="text-xs text-muted">
          Auto-generated: {new Date(r.generatedAt).toLocaleString()}
        </p>
      </header>

      {/* 1. Receipts & Payments */}
      <section>
        <h3 className="font-display text-xl text-brand-ink">
          1. Receipts and Payments Account
        </h3>
        <p className="mb-3 text-xs text-muted">
          (Cash basis — opening cash/bank + receipts − payments = closing)
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Particulars</th>
                <th className="text-right">Amount (NPR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Opening balance (Cash / Bank)</strong>
                </td>
                <td className="text-right font-mono">
                  {npr(rp.openingBalance)}
                </td>
              </tr>
              <tr className="bg-mist/40">
                <td colSpan={2}>
                  <strong>Receipts (Income)</strong>
                </td>
              </tr>
              {rp.receipts.map((x) => (
                <tr key={`r-${x.head}`}>
                  <td className="pl-6">
                    {x.head}{" "}
                    <span className="text-xs text-muted">({x.count})</span>
                  </td>
                  <td className="text-right font-mono">{npr(x.amount)}</td>
                </tr>
              ))}
              {rp.receipts.length === 0 && (
                <tr>
                  <td className="pl-6 text-muted">No receipts in period</td>
                  <td className="text-right">—</td>
                </tr>
              )}
              <tr className="font-semibold">
                <td>Total receipts</td>
                <td className="text-right font-mono text-green-800">
                  {npr(rp.totalReceipts)}
                </td>
              </tr>
              <tr className="bg-mist/40">
                <td colSpan={2}>
                  <strong>Payments (Expenditure)</strong>
                </td>
              </tr>
              {rp.payments.map((x) => (
                <tr key={`p-${x.head}`}>
                  <td className="pl-6">
                    {x.head}{" "}
                    <span className="text-xs text-muted">({x.count})</span>
                  </td>
                  <td className="text-right font-mono">{npr(x.amount)}</td>
                </tr>
              ))}
              {rp.payments.length === 0 && (
                <tr>
                  <td className="pl-6 text-muted">No payments in period</td>
                  <td className="text-right">—</td>
                </tr>
              )}
              <tr className="font-semibold">
                <td>Total payments</td>
                <td className="text-right font-mono text-red-800">
                  {npr(rp.totalPayments)}
                </td>
              </tr>
              <tr className="bg-mist font-bold">
                <td>Closing balance (Cash / Bank)</td>
                <td className="text-right font-mono">
                  {npr(rp.closingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Balance check: Opening + Receipts − Payments = Closing →{" "}
          {rp.check ? "OK ✓" : "Mismatch — review entries"}
        </p>
      </section>

      {/* 2. Income & Expenditure */}
      <section>
        <h3 className="font-display text-xl text-brand-ink">
          2. Statement of Income and Expenditure
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Income</th>
                  <th className="text-right">NPR</th>
                </tr>
              </thead>
              <tbody>
                {ie.income.map((x) => (
                  <tr key={`i-${x.head}`}>
                    <td>{x.head}</td>
                    <td className="text-right font-mono">{npr(x.amount)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-green-50">
                  <td>Total income</td>
                  <td className="text-right font-mono">
                    {npr(ie.totalIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Expenditure</th>
                  <th className="text-right">NPR</th>
                </tr>
              </thead>
              <tbody>
                {ie.expenditure.map((x) => (
                  <tr key={`e-${x.head}`}>
                    <td>{x.head}</td>
                    <td className="text-right font-mono">{npr(x.amount)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-red-50">
                  <td>Total expenditure</td>
                  <td className="text-right font-mono">
                    {npr(ie.totalExpenditure)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-stone bg-mist px-4 py-3">
          <p className="font-display text-lg text-brand-ink">
            Surplus / (Deficit) for the period:{" "}
            <span
              className={
                ie.surplusDeficit >= 0 ? "text-green-800" : "text-red-800"
              }
            >
              NPR {npr(ie.surplusDeficit)}
            </span>
          </p>
        </div>
      </section>

      {/* 3. Schedules */}
      <section className="space-y-6">
        <h3 className="font-display text-xl text-brand-ink">
          3. Schedules — Account-head wise (dates + totals)
        </h3>
        {report.schedules.length === 0 && (
          <p className="text-muted">No transactions in this period.</p>
        )}
        {report.schedules.map((s) => (
          <div key={s.categoryId} className="break-inside-avoid">
            <h4 className="font-semibold text-brand-ink">
              {s.type === "income" ? "Income" : "Expense"} head: {s.categoryName}{" "}
              <span className="text-sm font-normal text-muted">
                ({s.sector})
              </span>
            </h4>
            <div className="table-wrap mt-2">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date (AD / BS)</th>
                    <th>Voucher</th>
                    <th>Particular</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {s.lines.map((line, i) => (
                    <tr key={`${s.categoryId}-${i}`}>
                      <td className="whitespace-nowrap">
                        <DualDate iso={line.date} />
                      </td>
                      <td>{line.voucherNo || "—"}</td>
                      <td>{line.particular}</td>
                      <td className="text-right font-mono">
                        {line.debit ? npr(line.debit) : "—"}
                      </td>
                      <td className="text-right font-mono">
                        {line.credit ? npr(line.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-mist font-bold">
                    <td colSpan={3}>
                      Total — {s.categoryName} ({formatAdBs(r.from)} to{" "}
                      {formatAdBs(r.to)})
                    </td>
                    <td className="text-right font-mono">
                      {s.debit ? npr(s.debit) : "—"}
                    </td>
                    <td className="text-right font-mono">
                      {s.credit ? npr(s.credit) : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </section>

      <footer className="border-t border-stone pt-6 text-sm text-muted">
        <p>
          Declaration: This report is auto-generated from the school ledger for
          the stated period on a cash basis for audit review. Supporting
          vouchers should be attached as per auditor requirement.
        </p>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <div>
            <div className="h-10 border-b border-stone" />
            <p className="mt-2">Prepared by</p>
          </div>
          <div>
            <div className="h-10 border-b border-stone" />
            <p className="mt-2">Verified by</p>
          </div>
          <div>
            <div className="h-10 border-b border-stone" />
            <p className="mt-2">Auditor / Management</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
