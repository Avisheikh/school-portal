"use client";

import { useCallback, useState } from "react";
import { DualDate } from "@/components/admin/DualDate";
import { apiJson } from "@/components/admin/ui";
import { formatAdBs } from "@/lib/bilingualDate";
import { nepalFyStartYear } from "@/lib/nepalPeriods";
import type { ProgressReport, ProgressYearMode } from "@/lib/progressReport";

function npr(n: number) {
  return new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" },
    );
  } catch {
    return iso;
  }
}

export default function ProgressReportManager() {
  const today = new Date();
  const [mode, setMode] = useState<ProgressYearMode>("nepal_fy");
  const [year, setYear] = useState(nepalFyStartYear(today));
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiJson<ProgressReport>(
        `/api/progress-report?mode=${mode}&year=${year}`,
      );
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [mode, year]);

  function printPdf() {
    window.print();
  }

  const yearOptions = Array.from({ length: 8 }, (_, i) => {
    const base = nepalFyStartYear(today);
    return base - 3 + i;
  });

  return (
    <div>
      <div className="print:hidden mb-6 rounded-xl border border-stone bg-white p-5">
        <p className="mb-4 text-sm text-muted">
          School, students, teachers, staff, activities, programs (text + photos),
          ra financial ledger bata annual progress report auto-generate garchha.
          Browser ma <strong>Save as PDF</strong> chhannus.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-brand-ink">Year type</span>
            <select
              className="input"
              value={mode}
              onChange={(e) => {
                const m = e.target.value as ProgressYearMode;
                setMode(m);
                setYear(
                  m === "nepal_fy"
                    ? nepalFyStartYear(today)
                    : today.getFullYear(),
                );
              }}
            >
              <option value="nepal_fy">Nepal FY (Shrawan–Ashad)</option>
              <option value="calendar">Calendar year (Jan–Dec)</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-brand-ink">
              {mode === "nepal_fy" ? "FY start year" : "Calendar year"}
            </span>
            <select
              className="input"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {mode === "nepal_fy"
                    ? `${y}/${String(y + 1).slice(2)}`
                    : String(y)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-dark"
            disabled={loading}
            onClick={() => void generate()}
          >
            {loading ? "Generating…" : "Generate report"}
          </button>
          {report ? (
            <button type="button" className="btn btn-primary" onClick={printPdf}>
              Print / Save PDF
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {report ? <ReportDocument report={report} /> : null}
    </div>
  );
}

function ReportDocument({ report }: { report: ProgressReport }) {
  const { school, meta, summary } = report;

  return (
    <div className="print-area space-y-8 rounded-xl border border-stone bg-white p-6 text-brand-ink">
      {/* Cover / header */}
      <header className="border-b border-stone pb-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/logo.jpg"
          alt=""
          className="mx-auto mb-3 h-16 w-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <p className="text-xs uppercase tracking-widest text-muted">
          School of Social Development
        </p>
        <h2 className="font-display mt-2 text-3xl">{school.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {school.location}
          {school.ward ? `, Ward ${school.ward}` : ""}
          {school.municipality ? `, ${school.municipality}` : ""}
          {school.district ? `, ${school.district}` : ""}
        </p>
        <h3 className="mt-5 text-xl font-semibold">{meta.title}</h3>
        <p className="mt-1 text-sm">{meta.label}</p>
        <p className="mt-1 text-xs text-muted">
          Period: {formatAdBs(meta.from)} — {formatAdBs(meta.to)} · Generated{" "}
          {formatAdBs(meta.generatedAt.slice(0, 10))}
        </p>
        {(school.phone || school.email) && (
          <p className="mt-2 text-xs text-muted">
            {[school.phone, school.email].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      {/* School profile */}
      <section className="break-inside-avoid space-y-3">
        <h3 className="border-b border-stone pb-1 text-lg font-semibold">
          1. School profile
        </h3>
        {school.established ? (
          <p className="text-sm">
            <strong>Established:</strong> {school.established}
          </p>
        ) : null}
        {school.about ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{school.about}</p>
        ) : null}
        {school.mission ? (
          <div>
            <p className="text-sm font-semibold">Mission</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {school.mission}
            </p>
          </div>
        ) : null}
      </section>

      {/* Snapshot */}
      <section className="break-inside-avoid">
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          2. Year snapshot
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[
            ["Active students", summary.studentsActive],
            ["New enrollments", summary.studentsEnrolledInPeriod],
            ["Teachers", summary.teachersActive],
            ["Staff", summary.staffActive],
            ["Activities", summary.activitiesInPeriod],
            ["Programs (dated)", summary.programsInPeriod],
            ["Photos in timeline", summary.photosInPeriod],
            ["Graduated", summary.studentsGraduated],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-stone px-3 py-2 text-center"
            >
              <p className="font-display text-2xl">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["Total income (NPR)", npr(summary.totalIncome)],
            ["Total expenditure (NPR)", npr(summary.totalExpenditure)],
            [
              summary.surplusDeficit >= 0 ? "Surplus (NPR)" : "Deficit (NPR)",
              npr(Math.abs(summary.surplusDeficit)),
            ],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-stone px-3 py-2 text-center"
            >
              <p className="font-display text-xl">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Students by class */}
      <section className="break-inside-avoid">
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          3. Student enrollment by class
        </h3>
        {report.studentsByClass.length === 0 ? (
          <p className="text-sm text-muted">No active students recorded.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Total</th>
                  <th>Male</th>
                  <th>Female</th>
                  <th>Other</th>
                </tr>
              </thead>
              <tbody>
                {report.studentsByClass.map((c) => (
                  <tr key={c.classLevel}>
                    <td>{c.classLevel}</td>
                    <td>{c.total}</td>
                    <td>{c.male}</td>
                    <td>{c.female}</td>
                    <td>{c.other}</td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td>
                    <strong>
                      {report.studentsByClass.reduce((s, c) => s + c.total, 0)}
                    </strong>
                  </td>
                  <td>
                    <strong>
                      {report.studentsByClass.reduce((s, c) => s + c.male, 0)}
                    </strong>
                  </td>
                  <td>
                    <strong>
                      {report.studentsByClass.reduce((s, c) => s + c.female, 0)}
                    </strong>
                  </td>
                  <td>
                    <strong>
                      {report.studentsByClass.reduce((s, c) => s + c.other, 0)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Student roster */}
      <section>
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          4. Active student register
        </h3>
        {report.students.length === 0 ? (
          <p className="text-sm text-muted">No students.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Father / Mother</th>
                  <th>Phone</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((s, i) => (
                  <tr key={s.id} className="break-inside-avoid">
                    <td>{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.classLevel}</td>
                    <td className="capitalize">{s.gender}</td>
                    <td className="text-xs">
                      {[s.fatherName, s.motherName].filter(Boolean).join(" / ") ||
                        "—"}
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {s.parentPhone || "—"}
                    </td>
                    <td className="whitespace-nowrap text-xs">
                      {fmtDate(s.enrollmentDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Teachers */}
      <section>
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          5. Teaching staff
        </h3>
        {report.teachers.length === 0 ? (
          <p className="text-sm text-muted">No teachers recorded.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {report.teachers.map((t) => (
              <div
                key={t.id}
                className="break-inside-avoid flex gap-3 rounded-lg border border-stone p-3"
              >
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photoUrl}
                    alt={t.name}
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-mist text-xs text-muted">
                    Photo
                  </div>
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-muted">{t.role}</p>
                  {t.qualification ? (
                    <p className="text-xs">{t.qualification}</p>
                  ) : null}
                  {t.subjects ? (
                    <p className="text-xs">Subjects: {t.subjects}</p>
                  ) : null}
                  <p className="text-xs text-muted">
                    Joined {fmtDate(t.joinDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Non-teaching staff */}
      <section className="break-inside-avoid">
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          6. Non-teaching staff
        </h3>
        {report.staff.length === 0 ? (
          <p className="text-sm text-muted">No staff recorded.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Phone</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {report.staff.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.position}</td>
                    <td>{s.phone || "—"}</td>
                    <td>{fmtDate(s.joinDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Programs overview */}
      <section>
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          7. Programs
        </h3>
        {report.programs.length === 0 ? (
          <p className="text-sm text-muted">No programs in this period.</p>
        ) : (
          <div className="space-y-4">
            {report.programs.map((p) => (
              <article
                key={p.id}
                className="break-inside-avoid rounded-lg border border-stone p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold">{p.title}</h4>
                    <p className="text-xs text-muted">
                      {[p.date && fmtDate(p.date), p.level, p.duration, p.status]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-24 w-36 rounded object-cover"
                    />
                  ) : null}
                </div>
                {p.description ? (
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {p.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Date-wise timeline */}
      <section>
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          8. Date-wise progress timeline (activities &amp; programs)
        </h3>
        {report.timeline.length === 0 ? (
          <p className="text-sm text-muted">
            Yas period ma koi activity/program date record chaina. Activities ra
            Programs ma date + photo upload gari generate garnus.
          </p>
        ) : (
          <ol className="space-y-5">
            {report.timeline.map((item, idx) => (
              <li
                key={`${item.kind}-${item.id}`}
                className="break-inside-avoid border-l-2 border-sky pl-4"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-semibold text-muted">
                    {idx + 1}. {fmtDate(item.date)}
                  </span>
                  <span className="rounded bg-mist px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    {item.kind}
                  </span>
                  {item.meta ? (
                    <span className="text-xs text-muted">{item.meta}</span>
                  ) : null}
                </div>
                <h4 className="mt-1 font-semibold">{item.title}</h4>
                {item.description ? (
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                ) : null}
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="mt-3 max-h-64 w-full max-w-xl rounded object-cover"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Financial report */}
      <section>
        <h3 className="mb-3 border-b border-stone pb-1 text-lg font-semibold">
          9. Financial report (cash basis · NPR)
        </h3>
        <p className="mb-3 text-xs text-muted">
          Receipts &amp; Payments / Income &amp; Expenditure for the same period
          as this progress report. Source: Finance ledger.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Opening balance", npr(report.finance.openingBalance)],
            ["Total receipts", npr(report.finance.totalIncome)],
            ["Total payments", npr(report.finance.totalExpenditure)],
            ["Closing balance", npr(report.finance.closingBalance)],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="break-inside-avoid rounded-lg border border-stone px-3 py-2 text-center"
            >
              <p className="font-display text-lg">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>

        <p className="mb-4 text-sm">
          <strong>
            {report.finance.surplusDeficit >= 0 ? "Surplus" : "Deficit"}:
          </strong>{" "}
          NPR {npr(Math.abs(report.finance.surplusDeficit))} ·{" "}
          {report.finance.entryCount} ledger entries in period
        </p>

        <h4 className="mb-2 text-base font-semibold">
          9.1 Income &amp; Expenditure by account head
        </h4>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="break-inside-avoid">
            <p className="mb-1 text-sm font-semibold">Income / Receipts</p>
            {report.finance.income.length === 0 ? (
              <p className="text-sm text-muted">No income entries.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Head</th>
                      <th>Sector</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.finance.income.map((r) => (
                      <tr key={r.head}>
                        <td>{r.head}</td>
                        <td className="text-xs">{r.sector}</td>
                        <td className="text-right whitespace-nowrap">
                          {npr(r.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2}>
                        <strong>Total income</strong>
                      </td>
                      <td className="text-right">
                        <strong>{npr(report.finance.totalIncome)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="break-inside-avoid">
            <p className="mb-1 text-sm font-semibold">Expenditure / Payments</p>
            {report.finance.expenditure.length === 0 ? (
              <p className="text-sm text-muted">No expense entries.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Head</th>
                      <th>Sector</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.finance.expenditure.map((r) => (
                      <tr key={r.head}>
                        <td>{r.head}</td>
                        <td className="text-xs">{r.sector}</td>
                        <td className="text-right whitespace-nowrap">
                          {npr(r.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2}>
                        <strong>Total expenditure</strong>
                      </td>
                      <td className="text-right">
                        <strong>{npr(report.finance.totalExpenditure)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {report.finance.bySector.length > 0 ? (
          <div className="mb-6 break-inside-avoid">
            <h4 className="mb-2 text-base font-semibold">9.2 Sector summary</h4>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {report.finance.bySector.map((s) => (
                    <tr key={s.sector}>
                      <td>{s.sector}</td>
                      <td className="text-right">{npr(s.debit)}</td>
                      <td className="text-right">{npr(s.credit)}</td>
                      <td className="text-right">{npr(s.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div>
          <h4 className="mb-2 text-base font-semibold">
            9.3 Cash book (date-wise)
          </h4>
          {report.finance.cashBook.length === 0 ? (
            <p className="text-sm text-muted">
              Yas period ma finance entry chaina. Finance module ma ledger
              entries thapera feri generate garnus.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher</th>
                    <th>Particular</th>
                    <th>Head</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6}>
                      <em>Opening balance</em>
                    </td>
                    <td className="text-right">
                      {npr(report.finance.openingBalance)}
                    </td>
                  </tr>
                  {report.finance.cashBook.map((e, i) => (
                    <tr key={`${e.date}-${e.voucherNo}-${i}`}>
                      <td className="whitespace-nowrap text-xs">
                        <DualDate iso={e.date} />
                      </td>
                      <td className="text-xs">{e.voucherNo || "—"}</td>
                      <td className="text-xs">{e.particular}</td>
                      <td className="text-xs">{e.categoryName}</td>
                      <td className="text-right text-xs">
                        {e.debit ? npr(e.debit) : "—"}
                      </td>
                      <td className="text-right text-xs">
                        {e.credit ? npr(e.credit) : "—"}
                      </td>
                      <td className="text-right text-xs">{npr(e.balance)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={6}>
                      <strong>Closing balance</strong>
                    </td>
                    <td className="text-right">
                      <strong>{npr(report.finance.closingBalance)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-stone pt-4 text-center text-xs text-muted">
        <p>
          This report was auto-generated from SOSD Bodgaun school portal records
          for the selected year — including school profile, students, staff,
          programs, activities, and the finance ledger (cash basis, NPR).
        </p>
        <p className="mt-1">
          {school.shortName || "SOSD"} · {school.location}
        </p>
      </footer>
    </div>
  );
}
