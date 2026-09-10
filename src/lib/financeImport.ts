import * as XLSX from "xlsx";
import { newId, nowIso } from "./db";
import { buildEntry } from "./finance";
import type { FinanceCategory, FinanceDatabase, FinanceEntry } from "./types";

export type ImportRowInput = {
  date: string;
  type: "income" | "expense";
  accountHead: string;
  particular: string;
  amount: number;
  voucherNo?: string;
  sector?: string;
  notes?: string;
  rowNumber: number;
};

export type ImportPreviewRow = ImportRowInput & {
  ok: boolean;
  error?: string;
  matchedCategory?: string;
};

const HEADER_MAP: Record<string, keyof Omit<ImportRowInput, "rowNumber" | "amount" | "type"> | "amount" | "type"> = {
  date: "date",
  miti: "date",
  "मिति": "date",
  type: "type",
  "income/expense": "type",
  "income_expense": "type",
  "प्रकार": "type",
  accounthead: "accountHead",
  "account head": "accountHead",
  account: "accountHead",
  head: "accountHead",
  category: "accountHead",
  "शिर्षक": "accountHead",
  "शीर्षक": "accountHead",
  particular: "particular",
  description: "particular",
  narration: "particular",
  "विवरण": "particular",
  amount: "amount",
  "रकम": "amount",
  debit: "amount",
  credit: "amount",
  voucherno: "voucherNo",
  voucher: "voucherNo",
  "voucher no": "voucherNo",
  "voucher no.": "voucherNo",
  sector: "sector",
  notes: "notes",
  remark: "notes",
  remarks: "notes",
};

function normHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function parseAmount(v: unknown): number {
  if (typeof v === "number") return Math.abs(v);
  const s = String(v ?? "")
    .replace(/,/g, "")
    .replace(/npr/gi, "")
    .replace(/rs\.?/gi, "")
    .trim();
  const n = Number(s);
  return Number.isFinite(n) ? Math.abs(n) : NaN;
}

/** Accept YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, Excel serial */
function parseDate(v: unknown): string {
  if (typeof v === "number" && v > 20000) {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m1 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m1) {
    const dd = m1[1].padStart(2, "0");
    const mm = m1[2].padStart(2, "0");
    const yyyy = m1[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return "";
}

function parseType(v: unknown): "income" | "expense" | "" {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (!s) return "";
  if (
    ["income", "credit", "receipt", "donation", "aamdani", "आम्दानी", "in"].includes(
      s,
    ) ||
    s.startsWith("inc")
  ) {
    return "income";
  }
  if (
    ["expense", "debit", "payment", "kharcha", "खर्च", "exp", "out"].includes(s) ||
    s.startsWith("exp")
  ) {
    return "expense";
  }
  return "";
}

export function sheetToObjects(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });
}

export function mapRawRows(
  rawRows: Record<string, unknown>[],
): ImportPreviewRow[] {
  if (rawRows.length === 0) return [];

  const sampleKeys = Object.keys(rawRows[0] || {});
  const keyMap: Record<string, string> = {};
  for (const k of sampleKeys) {
    const nk = normHeader(k);
    const mapped = HEADER_MAP[nk];
    if (mapped) keyMap[k] = mapped;
  }

  // Require at least date, amount, and (type or account)
  const mappedFields = new Set(Object.values(keyMap));
  if (!mappedFields.has("date") || !mappedFields.has("amount")) {
    throw new Error(
      "Excel must have Date and Amount columns. Also add Type, Account Head, Particular.",
    );
  }

  return rawRows.map((raw, i) => {
    const rowNumber = i + 2; // header is row 1
    const get = (field: string) => {
      const sourceKey = Object.keys(keyMap).find((k) => keyMap[k] === field);
      return sourceKey ? raw[sourceKey] : "";
    };

    const date = parseDate(get("date"));
    let type = parseType(get("type"));
    const accountHead = String(get("accountHead") || "").trim();
    const particular = String(get("particular") || "").trim();
    const amount = parseAmount(get("amount"));
    const voucherNo = String(get("voucherNo") || "").trim();
    const sector = String(get("sector") || "").trim();
    const notes = String(get("notes") || "").trim();

    // Infer type from debit/credit columns if present
    if (!type) {
      const debitKey = sampleKeys.find((k) => normHeader(k) === "debit");
      const creditKey = sampleKeys.find((k) => normHeader(k) === "credit");
      if (debitKey && parseAmount(raw[debitKey]) > 0) type = "expense";
      else if (creditKey && parseAmount(raw[creditKey]) > 0) type = "income";
    }

    const errors: string[] = [];
    if (!date) errors.push("Invalid date");
    if (!type) errors.push("Type must be income or expense");
    if (!accountHead) errors.push("Account head required");
    if (!particular) errors.push("Particular required");
    if (!amount || amount <= 0) errors.push("Amount must be > 0");

    return {
      rowNumber,
      date,
      type: type || "expense",
      accountHead,
      particular,
      amount: amount || 0,
      voucherNo,
      sector,
      notes,
      ok: errors.length === 0,
      error: errors.join("; ") || undefined,
    };
  });
}

function findCategory(
  categories: FinanceCategory[],
  name: string,
  type: "income" | "expense",
): FinanceCategory | undefined {
  const n = name.trim().toLowerCase();
  return categories.find(
    (c) =>
      c.active &&
      c.type === type &&
      (c.name.toLowerCase() === n ||
        c.name.toLowerCase().includes(n) ||
        n.includes(c.name.toLowerCase())),
  );
}

export function previewImport(
  buffer: Buffer,
  db: FinanceDatabase,
): { rows: ImportPreviewRow[]; okCount: number; errorCount: number } {
  const raw = sheetToObjects(buffer);
  const rows = mapRawRows(raw).map((r) => {
    if (!r.ok) return r;
    const matched = findCategory(db.categories, r.accountHead, r.type);
    return {
      ...r,
      matchedCategory: matched?.name,
      ok: true,
    };
  });
  return {
    rows,
    okCount: rows.filter((r) => r.ok).length,
    errorCount: rows.filter((r) => !r.ok).length,
  };
}

export function applyImport(
  rows: ImportPreviewRow[],
  db: FinanceDatabase,
  options: { createMissingHeads: boolean },
): { db: FinanceDatabase; imported: number; createdHeads: string[] } {
  const createdHeads: string[] = [];
  const categories = [...db.categories];
  const entries = [...db.entries];
  let imported = 0;

  for (const r of rows) {
    if (!r.ok) continue;

    let cat = findCategory(categories, r.accountHead, r.type);
    if (!cat) {
      if (!options.createMissingHeads) continue;
      cat = {
        id: newId(),
        code: "",
        name: r.accountHead,
        type: r.type,
        sector: r.sector || (r.type === "income" ? "Other Income" : "Miscellaneous"),
        active: true,
        createdAt: nowIso(),
      };
      categories.push(cat);
      createdHeads.push(cat.name);
    }

    const entry: FinanceEntry = buildEntry(
      {
        date: r.date,
        particular: r.particular,
        categoryId: cat.id,
        amount: r.amount,
        voucherNo: r.voucherNo || "",
        notes: r.notes || `Imported from Excel`,
      },
      cat,
    );
    entries.push(entry);
    imported += 1;
  }

  return {
    db: { ...db, categories, entries },
    imported,
    createdHeads: Array.from(new Set(createdHeads)),
  };
}

export function buildTemplateWorkbook(): Buffer {
  const rows = [
    {
      Date: "2024-08-01",
      Type: "income",
      "Account Head": "Donations / Sponsorship",
      Particular: "Donation received for school support",
      Amount: 100000,
      "Voucher No": "R-001",
      Sector: "Donations",
      Notes: "Previous FY sample",
    },
    {
      Date: "2024-08-15",
      Type: "expense",
      "Account Head": "Teacher & Staff Salary",
      Particular: "Staff salary — Shrawan",
      Amount: 45000,
      "Voucher No": "S-001",
      Sector: "Salaries",
      Notes: "",
    },
    {
      Date: "2024-09-10",
      Type: "expense",
      "Account Head": "Electricity",
      Particular: "NEA bill — Bhadra",
      Amount: 4200,
      "Voucher No": "E-001",
      Sector: "Utilities",
      Notes: "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Income Expense");
  return Buffer.from(
    XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer,
  );
}
