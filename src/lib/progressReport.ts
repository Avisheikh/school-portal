import {
  summarizeByCategory,
  summarizeBySector,
  totals,
  withRunningBalance,
} from "@/lib/finance";
import { STUDENT_CLASSES } from "@/lib/studentClasses";
import {
  filterByDateRange,
  nepalFyRange,
  nepalFyStartYear,
  openingBalanceBefore,
  yearRange,
} from "@/lib/nepalPeriods";
import type {
  Activity,
  Database,
  FinanceDatabase,
  FinanceEntry,
  Program,
  SchoolInfo,
  SectorSummary,
  Staff,
  Student,
  Teacher,
} from "@/lib/types";

export type ProgressYearMode = "nepal_fy" | "calendar";

export type TimelineItem = {
  kind: "activity" | "program";
  id: string;
  date: string;
  title: string;
  description: string;
  meta: string;
  imageUrl?: string;
  published?: boolean;
  status?: string;
};

export type ClassCount = {
  classLevel: string;
  total: number;
  male: number;
  female: number;
  other: number;
};

export type FinanceHeadLine = {
  head: string;
  sector: string;
  amount: number;
  count: number;
};

export type ProgressFinance = {
  currency: string;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpenditure: number;
  surplusDeficit: number;
  entryCount: number;
  income: FinanceHeadLine[];
  expenditure: FinanceHeadLine[];
  bySector: SectorSummary[];
  /** Date-wise cash book lines for the period */
  cashBook: Array<{
    date: string;
    voucherNo: string;
    particular: string;
    categoryName: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
};

export type ProgressReport = {
  meta: {
    title: string;
    mode: ProgressYearMode;
    label: string;
    from: string;
    to: string;
    generatedAt: string;
  };
  school: SchoolInfo;
  summary: {
    studentsActive: number;
    studentsInactive: number;
    studentsGraduated: number;
    studentsEnrolledInPeriod: number;
    teachersActive: number;
    staffActive: number;
    activitiesInPeriod: number;
    programsInPeriod: number;
    photosInPeriod: number;
    totalIncome: number;
    totalExpenditure: number;
    surplusDeficit: number;
  };
  studentsByClass: ClassCount[];
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  programs: Program[];
  activities: Activity[];
  /** Activities + dated programs, oldest → newest */
  timeline: TimelineItem[];
  finance: ProgressFinance;
};

function buildFinanceSection(
  finance: FinanceDatabase,
  from: string,
  to: string,
): ProgressFinance {
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

  const income: FinanceHeadLine[] = byCategory
    .filter((c) => c.type === "income" || c.credit > 0)
    .map((h) => ({
      head: h.categoryName,
      sector: h.sector,
      amount: h.credit,
      count: h.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expenditure: FinanceHeadLine[] = byCategory
    .filter((c) => c.type === "expense" || c.debit > 0)
    .map((h) => ({
      head: h.categoryName,
      sector: h.sector,
      amount: h.debit,
      count: h.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    currency: "NPR",
    openingBalance: opening,
    closingBalance: closing,
    totalIncome: t.credit,
    totalExpenditure: t.debit,
    surplusDeficit: t.net,
    entryCount: periodEntries.length,
    income,
    expenditure,
    bySector: summarizeBySector(periodEntries),
    cashBook: ledger.map((e: FinanceEntry & { balance: number }) => ({
      date: e.date,
      voucherNo: e.voucherNo,
      particular: e.particular,
      categoryName: e.categoryName,
      debit: e.debit,
      credit: e.credit,
      balance: e.balance,
    })),
  };
}

function programDate(p: Program): string {
  if (p.date && /^\d{4}-\d{2}-\d{2}/.test(p.date)) return p.date.slice(0, 10);
  return (p.createdAt || "").slice(0, 10);
}

export function resolveProgressPeriod(
  mode: ProgressYearMode,
  year: number,
): { from: string; to: string; label: string } {
  if (mode === "nepal_fy") {
    const fy = nepalFyRange(year);
    return {
      from: fy.from,
      to: fy.to,
      label: `Annual Progress Report — ${fy.label}`,
    };
  }
  const y = yearRange(year);
  return { from: y.from, to: y.to, label: `Annual Progress Report — ${y.label}` };
}

export function defaultProgressYear(mode: ProgressYearMode, date = new Date()): number {
  return mode === "nepal_fy" ? nepalFyStartYear(date) : date.getFullYear();
}

export function buildProgressReport(
  db: Database,
  mode: ProgressYearMode,
  year: number,
  financeDb: FinanceDatabase,
): ProgressReport {
  const period = resolveProgressPeriod(mode, year);
  const { from, to, label } = period;
  const finance = buildFinanceSection(financeDb, from, to);

  const activities = db.activities
    .filter((a) => a.date >= from && a.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));

  const programsInPeriod = db.programs
    .filter((p) => {
      const d = programDate(p);
      return d && d >= from && d <= to;
    })
    .sort((a, b) => programDate(a).localeCompare(programDate(b)));

  // Also list active/upcoming programs even if date outside range (ongoing offerings)
  const programIds = new Set(programsInPeriod.map((p) => p.id));
  const ongoing = db.programs.filter(
    (p) =>
      (p.status === "active" || p.status === "upcoming") && !programIds.has(p.id),
  );
  const programs = [...programsInPeriod, ...ongoing];

  const timeline: TimelineItem[] = [
    ...activities.map(
      (a): TimelineItem => ({
        kind: "activity",
        id: a.id,
        date: a.date,
        title: a.title,
        description: a.description,
        meta: a.category || "Activity",
        imageUrl: a.imageUrl || undefined,
        published: a.published,
      }),
    ),
    ...programsInPeriod.map(
      (p): TimelineItem => ({
        kind: "program",
        id: p.id,
        date: programDate(p),
        title: p.title,
        description: p.description,
        meta: [p.level, p.duration, p.status].filter(Boolean).join(" · "),
        imageUrl: p.imageUrl || undefined,
        status: p.status,
      }),
    ),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const students = [...db.students].sort((a, b) => {
    const byClass = a.classLevel.localeCompare(b.classLevel);
    return byClass !== 0 ? byClass : a.name.localeCompare(b.name);
  });
  const activeStudents = students.filter((s) => s.status === "active");
  const enrolledInPeriod = students.filter(
    (s) => s.enrollmentDate >= from && s.enrollmentDate <= to,
  );

  const studentsByClass: ClassCount[] = STUDENT_CLASSES.map((classLevel) => {
    const inClass = activeStudents.filter((s) => s.classLevel === classLevel);
    return {
      classLevel,
      total: inClass.length,
      male: inClass.filter((s) => s.gender === "male").length,
      female: inClass.filter((s) => s.gender === "female").length,
      other: inClass.filter((s) => s.gender === "other").length,
    };
  }).filter((c) => c.total > 0);

  // Include any custom class levels not in the standard list
  for (const s of activeStudents) {
    if (!STUDENT_CLASSES.includes(s.classLevel as (typeof STUDENT_CLASSES)[number])) {
      let row = studentsByClass.find((c) => c.classLevel === s.classLevel);
      if (!row) {
        row = { classLevel: s.classLevel, total: 0, male: 0, female: 0, other: 0 };
        studentsByClass.push(row);
      }
      row.total += 1;
      if (s.gender === "male") row.male += 1;
      else if (s.gender === "female") row.female += 1;
      else row.other += 1;
    }
  }

  const teachers = db.teachers
    .filter((t) => t.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
  const staff = db.staff
    .filter((s) => s.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));

  const photosInPeriod = timeline.filter((t) => Boolean(t.imageUrl)).length;

  return {
    meta: {
      title: "Annual School Progress Report",
      mode,
      label,
      from,
      to,
      generatedAt: new Date().toISOString(),
    },
    school: db.school,
    summary: {
      studentsActive: activeStudents.length,
      studentsInactive: students.filter((s) => s.status === "inactive").length,
      studentsGraduated: students.filter((s) => s.status === "graduated").length,
      studentsEnrolledInPeriod: enrolledInPeriod.length,
      teachersActive: teachers.length,
      staffActive: staff.length,
      activitiesInPeriod: activities.length,
      programsInPeriod: programsInPeriod.length,
      photosInPeriod,
      totalIncome: finance.totalIncome,
      totalExpenditure: finance.totalExpenditure,
      surplusDeficit: finance.surplusDeficit,
    },
    studentsByClass,
    students: activeStudents,
    teachers,
    staff,
    programs,
    activities,
    timeline,
    finance,
  };
}
