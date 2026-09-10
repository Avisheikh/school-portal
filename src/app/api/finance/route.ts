import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso } from "@/lib/db";
import {
  buildEntry,
  filterByMonth,
  filterByYear,
  formatNpr,
  readFinance,
  summarizeByCategory,
  summarizeBySector,
  totals,
  withRunningBalance,
  writeFinance,
} from "@/lib/finance";
import type { FinanceCategory, FinanceEntry } from "@/lib/types";

export async function GET(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "ledger";
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const month = Number(searchParams.get("month") || 0);
  const sector = searchParams.get("sector") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const db = await readFinance();
  let entries = db.entries;

  if (view === "monthly" && month >= 1 && month <= 12) {
    entries = filterByMonth(entries, year, month);
  } else if (view === "yearly") {
    entries = filterByYear(entries, year);
  }
  // view === "all" | "ledger" | "saved" → keep all entries (no year filter)

  if (sector) {
    entries = entries.filter(
      (e) => e.sector.toLowerCase() === sector.toLowerCase(),
    );
  }
  if (categoryId) {
    entries = entries.filter((e) => e.categoryId === categoryId);
  }

  const ledger = withRunningBalance(entries, db.openingBalance);
  const t = totals(entries);
  const closing =
    ledger.length > 0
      ? ledger[ledger.length - 1].balance
      : db.openingBalance;

  return jsonOk({
    openingBalance: db.openingBalance,
    closingBalance: closing,
    categories: db.categories,
    entries: ledger,
    totals: t,
    bySector: summarizeBySector(entries),
    byCategory: summarizeByCategory(entries),
    meta: { view, year, month: month || null, sector: sector || null },
    formatHint: formatNpr(0),
  });
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = await request.json();

  // Opening balance update
  if (body.action === "setOpeningBalance") {
    const db = await readFinance();
    db.openingBalance = Number(body.openingBalance) || 0;
    await writeFinance(db);
    return jsonOk({ openingBalance: db.openingBalance });
  }

  // Category create
  if (body.action === "addCategory") {
    const db = await readFinance();
    const cat: FinanceCategory = {
      id: newId(),
      code: body.code || "",
      name: body.name,
      type: body.type === "income" ? "income" : "expense",
      sector: body.sector || body.name,
      active: true,
      createdAt: nowIso(),
    };
    if (!cat.name) return jsonError("Category name required");
    db.categories.push(cat);
    await writeFinance(db);
    return jsonOk(cat, 201);
  }

  // Ledger entry
  const db = await readFinance();
  const category = db.categories.find((c) => c.id === body.categoryId);
  if (!category) return jsonError("Select a valid account head / category");
  if (!body.particular || !body.date) {
    return jsonError("Particular and date are required");
  }
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return jsonError("Amount must be greater than 0");

  const entry = buildEntry(
    {
      date: body.date,
      particular: body.particular,
      categoryId: body.categoryId,
      amount,
      voucherNo: body.voucherNo,
      notes: body.notes,
    },
    category,
  );
  db.entries.push(entry);
  await writeFinance(db);
  return jsonOk(entry, 201);
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = await request.json();
  const db = await readFinance();

  if (body.action === "updateCategory") {
    const idx = db.categories.findIndex((c) => c.id === body.id);
    if (idx < 0) return jsonError("Category not found", 404);
    db.categories[idx] = {
      ...db.categories[idx],
      code: body.code ?? db.categories[idx].code,
      name: body.name ?? db.categories[idx].name,
      type: body.type ?? db.categories[idx].type,
      sector: body.sector ?? db.categories[idx].sector,
      active: body.active ?? db.categories[idx].active,
    };
    await writeFinance(db);
    return jsonOk(db.categories[idx]);
  }

  if (!body.id) return jsonError("id required");
  const idx = db.entries.findIndex((e) => e.id === body.id);
  if (idx < 0) return jsonError("Entry not found", 404);
  const category = db.categories.find(
    (c) => c.id === (body.categoryId || db.entries[idx].categoryId),
  );
  if (!category) return jsonError("Category not found");

  const amount =
    body.amount !== undefined
      ? Number(body.amount)
      : db.entries[idx].debit || db.entries[idx].credit;

  const updated = buildEntry(
    {
      id: db.entries[idx].id,
      date: body.date || db.entries[idx].date,
      particular: body.particular || db.entries[idx].particular,
      categoryId: category.id,
      amount,
      voucherNo:
        body.voucherNo !== undefined
          ? body.voucherNo
          : db.entries[idx].voucherNo,
      notes: body.notes !== undefined ? body.notes : db.entries[idx].notes,
      createdAt: db.entries[idx].createdAt,
    },
    category,
  );
  db.entries[idx] = updated;
  await writeFinance(db);
  return jsonOk(updated);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const categoryId = searchParams.get("categoryId");
  const db = await readFinance();

  if (categoryId) {
    const used = db.entries.some((e) => e.categoryId === categoryId);
    if (used) {
      return jsonError(
        "Cannot delete account head that has transactions. Mark inactive instead.",
      );
    }
    db.categories = db.categories.filter((c) => c.id !== categoryId);
    await writeFinance(db);
    return jsonOk({ ok: true });
  }

  if (!id) return jsonError("id required");
  db.entries = db.entries.filter((e) => e.id !== id);
  await writeFinance(db);
  return jsonOk({ ok: true });
}
