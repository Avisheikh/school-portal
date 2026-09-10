import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type {
  FinanceCategory,
  FinanceDatabase,
  FinanceEntry,
  LedgerRow,
  SectorSummary,
} from "./types";
import { newId, nowIso } from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const FINANCE_PATH = path.join(DATA_DIR, "finance.json");

function seedCategories(): FinanceCategory[] {
  const now = nowIso();
  const rows: Array<Omit<FinanceCategory, "id" | "createdAt">> = [
    { code: "INC-01", name: "Donations / Sponsorship", type: "income", sector: "Donations", active: true },
    { code: "INC-02", name: "Grants & Partners", type: "income", sector: "Grants", active: true },
    { code: "INC-03", name: "Other Income", type: "income", sector: "Other Income", active: true },
    { code: "EXP-01", name: "Electricity", type: "expense", sector: "Utilities", active: true },
    { code: "EXP-02", name: "Water & Sanitation", type: "expense", sector: "Utilities", active: true },
    { code: "EXP-03", name: "Internet / Phone", type: "expense", sector: "Utilities", active: true },
    { code: "EXP-04", name: "Teacher & Staff Salary", type: "expense", sector: "Salaries", active: true },
    { code: "EXP-05", name: "Teaching Materials", type: "expense", sector: "Education", active: true },
    { code: "EXP-06", name: "Stationeries", type: "expense", sector: "Education", active: true },
    { code: "EXP-07", name: "Food Expense", type: "expense", sector: "Food & Meals", active: true },
    { code: "EXP-08", name: "Student Support / Meals", type: "expense", sector: "Food & Meals", active: true },
    { code: "EXP-09", name: "Campus Maintenance", type: "expense", sector: "Maintenance", active: true },
    { code: "EXP-10", name: "Transport / Travel", type: "expense", sector: "Transport", active: true },
    { code: "EXP-11", name: "Events & Activities", type: "expense", sector: "Programs", active: true },
    { code: "EXP-12", name: "Admin & Office", type: "expense", sector: "Administration", active: true },
    { code: "EXP-13", name: "Miscellaneous Expense", type: "expense", sector: "Miscellaneous", active: true },
  ];
  return rows.map((r) => ({ ...r, id: uuid(), createdAt: now }));
}

const defaultFinance: FinanceDatabase = {
  openingBalance: 50000,
  categories: seedCategories(),
  entries: [],
};

// Populate demo entries after categories exist
function withDemoEntries(db: FinanceDatabase): FinanceDatabase {
  if (db.entries.length > 0) return db;
  const elec = db.categories.find((c) => c.name === "Electricity");
  const donate = db.categories.find((c) => c.name === "Donations / Sponsorship");
  const salary = db.categories.find((c) => c.name === "Teacher & Staff Salary");
  if (!elec || !donate || !salary) return db;
  const y = new Date().getFullYear();
  db.entries = [
    buildEntry(
      {
        date: `${y}-01-10`,
        particular: "Donation received — village project support",
        categoryId: donate.id,
        amount: 100000,
        voucherNo: "R-001",
      },
      donate,
    ),
    buildEntry(
      {
        date: `${y}-01-15`,
        particular: "NEA electricity bill — January",
        categoryId: elec.id,
        amount: 4500,
        voucherNo: "E-001",
      },
      elec,
    ),
    buildEntry(
      {
        date: `${y}-02-15`,
        particular: "NEA electricity bill — February",
        categoryId: elec.id,
        amount: 4200,
        voucherNo: "E-002",
      },
      elec,
    ),
    buildEntry(
      {
        date: `${y}-02-28`,
        particular: "Teacher & staff salary — February",
        categoryId: salary.id,
        amount: 45000,
        voucherNo: "S-002",
      },
      salary,
    ),
    buildEntry(
      {
        date: `${y}-03-15`,
        particular: "NEA electricity bill — March",
        categoryId: elec.id,
        amount: 4800,
        voucherNo: "E-003",
      },
      elec,
    ),
  ];
  return db;
}


async function ensureFinance(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FINANCE_PATH);
  } catch {
    await fs.writeFile(
      FINANCE_PATH,
      JSON.stringify(withDemoEntries({ ...defaultFinance, categories: seedCategories() }), null, 2),
      "utf-8",
    );
  }
}

export async function readFinance(): Promise<FinanceDatabase> {
  await ensureFinance();
  const raw = await fs.readFile(FINANCE_PATH, "utf-8");
  const data = JSON.parse(raw) as FinanceDatabase;
  if (!data.categories) data.categories = defaultFinance.categories;
  if (!data.entries) data.entries = [];
  if (typeof data.openingBalance !== "number") data.openingBalance = 0;

  // Ensure new default heads (e.g. Stationeries, Food) exist on older data files
  const required = [
    { code: "EXP-06", name: "Stationeries", type: "expense" as const, sector: "Education" },
    { code: "EXP-07", name: "Food Expense", type: "expense" as const, sector: "Food & Meals" },
  ];
  let changed = false;
  for (const r of required) {
    const exists = data.categories.some(
      (c) => c.name.toLowerCase() === r.name.toLowerCase(),
    );
    if (!exists) {
      data.categories.push({
        ...r,
        id: newId(),
        active: true,
        createdAt: nowIso(),
      });
      changed = true;
    }
  }
  if (changed) await writeFinance(data);

  return data;
}

export async function writeFinance(db: FinanceDatabase): Promise<void> {
  await ensureFinance();
  await fs.writeFile(FINANCE_PATH, JSON.stringify(db, null, 2), "utf-8");

  // Permanent backup copy after every save
  const backupDir = path.join(DATA_DIR, "finance-backups");
  await fs.mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.writeFile(
    path.join(backupDir, `finance-${stamp}.json`),
    JSON.stringify(db, null, 2),
    "utf-8",
  );
  // Keep a stable latest file for easy restore
  await fs.writeFile(
    path.join(backupDir, "finance-latest.json"),
    JSON.stringify(db, null, 2),
    "utf-8",
  );
}

export function sortEntries(entries: FinanceEntry[]): FinanceEntry[] {
  return [...entries].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

/** Running cash balance: opening + credit − debit */
export function withRunningBalance(
  entries: FinanceEntry[],
  openingBalance = 0,
): LedgerRow[] {
  let balance = openingBalance;
  return sortEntries(entries).map((e) => {
    balance = balance + (e.credit || 0) - (e.debit || 0);
    return { ...e, balance: Math.round(balance * 100) / 100 };
  });
}

export function filterByMonth(
  entries: FinanceEntry[],
  year: number,
  month: number,
): FinanceEntry[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return entries.filter((e) => e.date.startsWith(prefix));
}

export function filterByYear(
  entries: FinanceEntry[],
  year: number,
): FinanceEntry[] {
  return entries.filter((e) => e.date.startsWith(`${year}-`));
}

export function summarizeBySector(entries: FinanceEntry[]): SectorSummary[] {
  const map = new Map<string, SectorSummary>();
  for (const e of entries) {
    const key = e.sector || "Uncategorized";
    const cur = map.get(key) || {
      sector: key,
      type: e.type,
      debit: 0,
      credit: 0,
      net: 0,
      count: 0,
    };
    cur.debit += e.debit || 0;
    cur.credit += e.credit || 0;
    cur.count += 1;
    if (cur.type !== e.type) cur.type = "mixed";
    cur.net = cur.credit - cur.debit;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.sector.localeCompare(b.sector),
  );
}

export function summarizeByCategory(entries: FinanceEntry[]) {
  const map = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      sector: string;
      type: "income" | "expense" | "mixed";
      debit: number;
      credit: number;
      net: number;
      count: number;
    }
  >();
  for (const e of entries) {
    const cur = map.get(e.categoryId) || {
      categoryId: e.categoryId,
      categoryName: e.categoryName,
      sector: e.sector,
      type: e.type,
      debit: 0,
      credit: 0,
      net: 0,
      count: 0,
    };
    cur.debit += e.debit || 0;
    cur.credit += e.credit || 0;
    cur.count += 1;
    if (cur.type !== e.type) cur.type = "mixed";
    cur.net = cur.credit - cur.debit;
    map.set(e.categoryId, cur);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName),
  );
}

export function totals(entries: FinanceEntry[]) {
  const debit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const credit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  return {
    debit: Math.round(debit * 100) / 100,
    credit: Math.round(credit * 100) / 100,
    net: Math.round((credit - debit) * 100) / 100,
  };
}

export function formatNpr(n: number): string {
  return new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export function buildEntry(
  body: Partial<FinanceEntry> & {
    categoryId: string;
    particular: string;
    date: string;
    amount: number;
  },
  category: FinanceCategory,
): FinanceEntry {
  const amount = Math.abs(Number(body.amount) || 0);
  const isIncome = category.type === "income";
  return {
    id: body.id || newId(),
    date: body.date,
    voucherNo: body.voucherNo || "",
    particular: body.particular.trim(),
    categoryId: category.id,
    categoryName: category.name,
    sector: category.sector,
    type: category.type,
    debit: isIncome ? 0 : amount,
    credit: isIncome ? amount : 0,
    notes: body.notes || "",
    createdAt: body.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}
