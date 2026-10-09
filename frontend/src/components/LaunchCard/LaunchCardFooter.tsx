type LocalDateTime = {
  date: string;
  time: string;
};

interface LaunchCardFooterProps {
  lastUpdated: LocalDateTime | null;
}

/**
 * When this record was last updated. The queue header owns the feed light,
 * and the sys clock owns the zone.
 * Motion wrapper stays on LaunchCard so card stagger still sees a motion child.
 */
export function LaunchCardFooter({ lastUpdated }: LaunchCardFooterProps) {
  return (
    <span
      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-cyan-600"
      title="When the launch provider last updated this record (local time)"
    >
      <span className="tracking-[0.25em]">Last Updated</span>
      {lastUpdated ? (
        <span className="flex items-baseline gap-1.5 text-cyan-600 tabular-nums tracking-[0.15em]">
          <span>{lastUpdated.date}</span>
          <span className="text-cyan-800">·</span>
          <span>{lastUpdated.time}</span>
        </span>
      ) : (
        <span className="text-cyan-800 tracking-[0.15em]">—</span>
      )}
    </span>
  );
}
