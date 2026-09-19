import { FeedStatus } from "./FeedStatus";

type LocalDateTime = {
  date: string;
  time: string;
};

interface LaunchCardFooterProps {
  feedLive: boolean;
  lastUpdated: LocalDateTime | null;
  localOffsetLabel: string;
}

/**
 * Live-feed pill and last-updated stamp.
 * Motion wrapper stays on LaunchCard so card stagger still sees a motion child.
 */
export function LaunchCardFooter({
  feedLive,
  lastUpdated,
  localOffsetLabel,
}: LaunchCardFooterProps) {
  return (
    <>
      <FeedStatus live={feedLive} className="tracking-[0.2em]" />
      <span
        className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-cyan-500"
        title="When the launch provider last updated this record (local time)"
      >
        <span className="tracking-[0.25em]">Last Updated</span>
        <span className="text-cyan-600 tracking-wider">{localOffsetLabel}</span>
        {lastUpdated ? (
          <span className="flex items-baseline gap-1.5 text-cyan-400 tabular-nums tracking-[0.15em]">
            <span>{lastUpdated.date}</span>
            <span className="text-cyan-700">·</span>
            <span>{lastUpdated.time}</span>
          </span>
        ) : (
          <span className="text-cyan-700 tracking-[0.15em]">—</span>
        )}
      </span>
    </>
  );
}
