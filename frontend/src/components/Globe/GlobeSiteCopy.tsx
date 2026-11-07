/**
 * Shared site / place / stat stack used by hover tips and the site preview chip.
 */
export function GlobeSiteCopy({
  siteLabel,
  placeLabel = null,
  statLine,
  compact = false,
}: {
  siteLabel: string;
  placeLabel?: string | null;
  statLine: string;
  /** Tighter leading for the floating hover tip. */
  compact?: boolean;
}) {
  const lead = compact ? "leading-none" : "leading-snug";
  return (
    <>
      <p
        className={`truncate text-[10px] uppercase tracking-[0.14em] text-slate-100 ${lead}`}
      >
        {siteLabel}
      </p>
      {placeLabel ? (
        <p
          className={`mt-1 truncate text-[9px] uppercase tracking-[0.14em] text-cyan-600 ${lead}`}
        >
          {placeLabel}
        </p>
      ) : null}
      <p
        className={`truncate text-[9px] uppercase tracking-[0.16em] text-cyan-400 ${lead} ${
          placeLabel ? "mt-1.5" : "mt-1"
        }`}
      >
        {statLine}
      </p>
    </>
  );
}
