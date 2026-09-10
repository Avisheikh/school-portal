import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { readDb } from "@/lib/db";
import {
  filterByDateRange,
  openingBalanceBefore,
  type PeriodKind,
} from "@/lib/nepalPeriods";
import {
  readFinance,
  summarizeByCategory,
  summarizeBySector,
  totals,
  withRunningBalance,
} from "@/lib/finance";

/**
 * Auto-generate Nepal audit-oriented period report.
 * Query: from, to, kind (weekly|monthly|quarterly|yearly), label (optional)
 */
export async function GET(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const kind = (searchParams.get("kind") || "monthly") as PeriodKind;
  const label = searchParams.get("label") || `${from} to ${to}`;

  if (!from || !to || from > to) {
    return jsonError("Valid from and to dates are required");
  }

  const [finance, schoolDb] = await Promise.all([readFinance(), readDb()]);
  const periodEntries = filterByDateRange(finance.entries, from, to);
  const opening = openingBalanceBefore(
    finance.entries,
    from,
    finance.openingBalance,
  );
  const ledger = withRunningBalance(periodEntries, opening);
  const t = totals(periodEntries);
  const closing =
    ledger.length > 0 ? ledger[ledger.length - 1].balance : opening;

  const byCategory = summarizeByCategory(periodEntries);
  const incomeHeads = byCategory.filter(
    (c) => c.type === "income" || c.credit > 0,
  );
  const expenseHeads = byCategory.filter(
    (c) => c.type === "expense" || c.debit > 0,
  );

  // Receipts & Payments style
  const receipts = incomeHeads.map((h) => ({
    head: h.categoryName,
    sector: h.sector,
    amount: h.credit,
    count: h.count,
  }));
  const payments = expenseHeads.map((h) => ({
    head: h.categoryName,
    sector: h.sector,
    amount: h.debit,
    count: h.count,
  }));

  // Schedules: each head with dated lines
  const schedules = byCategory.map((h) => ({
    ...h,
    lines: periodEntries
      .filter((e) => e.categoryId === h.categoryId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: e.date,
        voucherNo: e.voucherNo,
        particular: e.particular,
        debit: e.debit,
        credit: e.credit,
        notes: e.notes,
      })),
  }));

  return jsonOk({
    report: {
      title: "Financial Report for Audit",
      organization: schoolDb.school.name,
      shortName: schoolDb.school.shortName,
      location: `${schoolDb.school.location}, ${schoolDb.school.ward}, ${schoolDb.school.district}`,
      preparedUnder:
        "Cash basis of accounting — aligned with NAS for NPOs principles (Receipts & Payments / Income & Expenditure) for school/NPO audit in Nepal",
      currency: "NPR",
      kind,
      label,
      from,
      to,
      generatedAt: new Date().toISOString(),
    },
    openingBalance: opening,
    closingBalance: closing,
    totals: t,
    surplusDeficit: t.net,
    receipts,
    payments,
    bySector: summarizeBySector(periodEntries),
    byCategory,
    schedules,
    entries: ledger,
    statementIncomeExpenditure: {
      income: receipts,
      totalIncome: t.credit,
      expenditure: payments,
      totalExpenditure: t.debit,
      surplusDeficit: t.net,
    },
    receiptsAndPayments: {
      openingBalance: opening,
      receipts,
      totalReceipts: t.credit,
      payments,
      totalPayments: t.debit,
      closingBalance: closing,
      check:
        Math.round((opening + t.credit - t.debit) * 100) / 100 === closing,
    },
  });
}
