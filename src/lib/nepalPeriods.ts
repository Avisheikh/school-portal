/** Nepal audit / fiscal period helpers (cash-basis school / NPO reporting). */

export type PeriodKind = "weekly" | "monthly" | "quarterly" | "yearly";

export type PeriodRange = {
  kind: PeriodKind;
  label: string;
  from: string; // YYYY-MM-DD
  to: string;
  fiscalLabel?: string;
  notes?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Nepal FY typically starts mid-July (~16 Shrawan / ~16 July). */
export function nepalFyStartYear(date = new Date()): number {
  // If on/after July 16, FY started this calendar year; else previous
  const y = date.getFullYear();
  const start = new Date(y, 6, 16); // Jul 16
  return date >= start ? y : y - 1;
}

export function nepalFyRange(startYear: number): { from: string; to: string; label: string } {
  const from = `${startYear}-07-16`;
  const to = `${startYear + 1}-07-15`;
  // Approximate BS year labels commonly used (2081/82 etc.) — display Gregorian FY too
  const bsApprox = 2081 + (startYear - 2024);
  return {
    from,
    to,
    label: `Nepal FY ${startYear}/${String(startYear + 1).slice(2)} (approx. BS ${bsApprox}/${bsApprox + 1})`,
  };
}

/** SWC-style trimesters within Nepal FY (Shrawan–Ashad). */
export function nepalTrimesterRange(
  startYear: number,
  trimester: 1 | 2 | 3,
): PeriodRange {
  const fy = nepalFyRange(startYear);
  if (trimester === 1) {
    return {
      kind: "quarterly",
      label: `1st Trimester (Shrawan–Kartik) · ${fy.label}`,
      from: `${startYear}-07-16`,
      to: `${startYear}-11-15`,
      fiscalLabel: fy.label,
      notes: "SWC-style 1st trimester for Nepal fiscal year reporting",
    };
  }
  if (trimester === 2) {
    return {
      kind: "quarterly",
      label: `2nd Trimester (Manshir–Falgun) · ${fy.label}`,
      from: `${startYear}-11-16`,
      to: `${startYear + 1}-03-14`,
      fiscalLabel: fy.label,
      notes: "SWC-style 2nd trimester for Nepal fiscal year reporting",
    };
  }
  return {
    kind: "quarterly",
    label: `3rd Trimester (Chaitra–Ashad) · ${fy.label}`,
    from: `${startYear + 1}-03-15`,
    to: `${startYear + 1}-07-15`,
    fiscalLabel: fy.label,
    notes: "SWC-style 3rd trimester for Nepal fiscal year reporting",
  };
}

export function calendarQuarterRange(
  year: number,
  quarter: 1 | 2 | 3 | 4,
): PeriodRange {
  const starts = ["01-01", "04-01", "07-01", "10-01"];
  const ends = ["03-31", "06-30", "09-30", "12-31"];
  return {
    kind: "quarterly",
    label: `Calendar Q${quarter} ${year}`,
    from: `${year}-${starts[quarter - 1]}`,
    to: `${year}-${ends[quarter - 1]}`,
  };
}

export function monthRange(year: number, month: number): PeriodRange {
  const last = new Date(year, month, 0).getDate();
  const names = [
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
  return {
    kind: "monthly",
    label: `Monthly Report — ${names[month - 1]} ${year}`,
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(last)}`,
  };
}

/** ISO week: Monday–Sunday containing the given date (or week of year). */
export function weekRangeFromDate(dateStr: string): PeriodRange {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    kind: "weekly",
    label: `Weekly Report — ${isoDate(monday)} to ${isoDate(sunday)}`,
    from: isoDate(monday),
    to: isoDate(sunday),
  };
}

export function yearRange(year: number): PeriodRange {
  return {
    kind: "yearly",
    label: `Calendar Year ${year}`,
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

export function nepalYearlyRange(startYear: number): PeriodRange {
  const fy = nepalFyRange(startYear);
  return {
    kind: "yearly",
    label: `Annual Audit Report — ${fy.label}`,
    from: fy.from,
    to: fy.to,
    fiscalLabel: fy.label,
    notes:
      "Prepared for annual audit (cash basis) aligned with Nepal FY Shrawan–Ashad",
  };
}

export function filterByDateRange<T extends { date: string }>(
  entries: T[],
  from: string,
  to: string,
): T[] {
  return entries.filter((e) => e.date >= from && e.date <= to);
}

/** Opening cash before period = baseOpening + prior credits − prior debits */
export function openingBalanceBefore(
  entries: { date: string; debit: number; credit: number }[],
  from: string,
  baseOpening: number,
): number {
  let bal = baseOpening;
  for (const e of entries) {
    if (e.date < from) {
      bal += (e.credit || 0) - (e.debit || 0);
    }
  }
  return Math.round(bal * 100) / 100;
}
