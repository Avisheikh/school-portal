import NepaliDate from "nepali-date-converter";

const BS_MONTHS_EN = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const d = new Date(day + "T12:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

/** English (AD) short date, e.g. 16 Jul 2024 */
export function formatAd(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return iso || "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Nepali (BS) date in Latin script, e.g. 01 Shrawan 2081 */
export function formatBs(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return "";
  try {
    const nd = new NepaliDate(d);
    const y = nd.getYear();
    const m = nd.getMonth(); // 0-indexed
    const day = nd.getDate();
    const monthName = BS_MONTHS_EN[m] || `M${m + 1}`;
    return `${String(day).padStart(2, "0")} ${monthName} ${y}`;
  } catch {
    return "";
  }
}

/** Nepali (BS) with Devanagari digits/month names when available */
export function formatBsNp(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return "";
  try {
    const nd = new NepaliDate(d);
    return nd.format("DD MMMM YYYY", "np");
  } catch {
    return formatBs(iso);
  }
}

/**
 * Dual calendar label for finance / audit reports.
 * Example: "16 Jul 2024 (AD) · 01 Shrawan 2081 (BS)"
 */
export function formatAdBs(iso: string): string {
  if (!iso) return "—";
  const ad = formatAd(iso);
  const bs = formatBs(iso);
  const bsNp = formatBsNp(iso);
  if (!bs) return `${ad} (AD)`;
  return `${ad} (AD) · ${bsNp || bs} (BS)`;
}

/** Compact two-line friendly parts for table cells */
export function dualDateParts(iso: string): { ad: string; bs: string; bsNp: string } {
  return {
    ad: formatAd(iso),
    bs: formatBs(iso) || "—",
    bsNp: formatBsNp(iso) || formatBs(iso) || "—",
  };
}

export function formatAdBsRange(from: string, to: string): string {
  return `${formatAdBs(from)} → ${formatAdBs(to)}`;
}
