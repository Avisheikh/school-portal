import { formatAd, formatAdBs, formatBs, formatBsNp } from "@/lib/bilingualDate";

/**
 * Finance date cell: English AD + Nepali BS (Devanagari) both shown.
 * Example:
 *   16 Jul 2024 AD
 *   ०१ श्रावण २०८१ BS
 */
export function DualDate({
  iso,
  stacked = true,
  className = "",
}: {
  iso: string;
  stacked?: boolean;
  className?: string;
}) {
  if (!iso) return <span className={className}>—</span>;
  const ad = formatAd(iso);
  const bsEn = formatBs(iso);
  const bsNp = formatBsNp(iso) || bsEn;

  if (!stacked) {
    return (
      <span className={className}>
        {ad} AD · {bsNp} BS
      </span>
    );
  }

  return (
    <span className={`inline-block min-w-[8rem] leading-snug ${className}`}>
      <span className="block whitespace-nowrap text-xs font-semibold text-brand-ink">
        {ad}{" "}
        <span className="font-normal text-muted">AD</span>
      </span>
      <span className="mt-0.5 block whitespace-nowrap text-[11px] font-medium text-brand-ink">
        {bsNp}{" "}
        <span className="font-normal text-muted">BS</span>
      </span>
    </span>
  );
}

export { formatAdBs };
