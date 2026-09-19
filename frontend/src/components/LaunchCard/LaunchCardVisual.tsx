import { useMemo } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { transitions } from "../../lib/motionTokens";
import type { WatchTarget } from "../../utils/watchTarget";

/** Visual feed: rest = always-on HUD; focus = hover or tap intensify. */
const visualFrameVariants: Variants = {
  rest: {},
  focus: {},
};

const visualCornerVariants: Variants = {
  rest: { width: 18, height: 18, borderColor: "rgba(6,182,212,0.55)" },
  focus: { width: 12, height: 12, borderColor: "rgba(103,232,249,0.95)" },
};

const visualCrosshairVariants: Variants = {
  rest: { opacity: 0.18 },
  focus: { opacity: 0.35 },
};

interface LaunchCardVisualProps {
  imageUrl: string | null;
  compactTravel: boolean;
  watchTarget: WatchTarget | null;
  playing: boolean;
  onPlay: () => void;
  onClose: () => void;
}

function watchCtaLabel(target: WatchTarget): string {
  if (target.kind === "x") {
    return target.mode === "replay" ? "Replay on X" : "Watch on X";
  }
  if (target.kind === "other") {
    return target.mode === "replay" ? "Open replay" : "Open webcast";
  }
  return target.mode === "replay" ? "Replay" : "Watch";
}

function watchSourceLabel(target: WatchTarget): string {
  if (target.publisher) return target.publisher;
  if (target.kind === "youtube") return "YouTube";
  if (target.kind === "x") return "X";
  return "Webcast";
}

function youtubePlayerSrc(
  embedUrl: string,
  opts: { autoplay: boolean; mute: boolean },
): string {
  const src = new URL(embedUrl);
  src.searchParams.set("rel", "0");
  src.searchParams.set("modestbranding", "1");
  src.searchParams.set("playsinline", "1");
  if (opts.autoplay) src.searchParams.set("autoplay", "1");
  if (opts.mute) src.searchParams.set("mute", "1");
  return src.toString();
}

function openOutbound(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * HUD image (or no-feed placeholder) plus scanlines, corners, and crosshair.
 * When a watch target exists, this pane is Watch / in-app YouTube / outbound X.
 * Motion wrapper stays on LaunchCard so card stagger still sees a motion child.
 */
export function LaunchCardVisual({
  imageUrl,
  compactTravel,
  watchTarget,
  playing,
  onPlay,
  onClose,
}: LaunchCardVisualProps) {
  const visualImageVariants: Variants = useMemo(
    () => ({
      rest: { scale: 1, opacity: 0.82 },
      focus: { scale: compactTravel ? 1.02 : 1.04, opacity: 1 },
    }),
    [compactTravel],
  );

  const showPlayer = Boolean(playing && watchTarget?.embedUrl);
  const showHudFx = !showPlayer;
  const canEmbed = Boolean(watchTarget?.embedUrl);
  const iframeSrc =
    showPlayer && watchTarget?.embedUrl
      ? youtubePlayerSrc(watchTarget.embedUrl, {
          autoplay: true,
          mute: watchTarget.mode === "live",
        })
      : null;

  const onWatch = () => {
    if (!watchTarget) return;
    if (canEmbed) {
      onPlay();
      return;
    }
    openOutbound(watchTarget.url);
  };

  return (
    <motion.div
      className="absolute inset-0"
      variants={visualFrameVariants}
      initial="rest"
      animate="rest"
      whileHover={showPlayer ? undefined : "focus"}
      whileTap={showPlayer ? undefined : "focus"}
    >
      {imageUrl ? (
        <motion.img
          src={imageUrl}
          variants={visualImageVariants}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className={`w-full h-full object-cover ${showPlayer ? "" : "mix-blend-screen"}`}
          alt="Launch Visual"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <motion.div
          variants={visualImageVariants}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={`w-full h-full flex flex-col items-center justify-center bg-[#020617] ${showPlayer ? "" : "mix-blend-screen"}`}
        >
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 border border-cyan-900/40 rounded-full"></div>
            <div className="absolute w-16 h-16 border border-cyan-800/50 rounded-full"></div>
            <div className="absolute w-8 h-8 border border-cyan-700/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
          </div>
          <span className="text-cyan-600 font-mono text-[10px] tracking-[0.5em] uppercase z-10">
            NO VISUAL FEED
          </span>
        </motion.div>
      )}

      {iframeSrc && (
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          title="Launch webcast"
          className="absolute inset-0 z-10 h-full w-full border-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}

      {showHudFx && (
        <>
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,1)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(8,145,178,0.05)_50%)] bg-[size:100%_4px] pointer-events-none"></div>
          <motion.div
            variants={visualCornerVariants}
            transition={transitions.snappy}
            className="absolute top-4 left-4 z-20 border-t border-l pointer-events-none"
          />
          <motion.div
            variants={visualCornerVariants}
            transition={transitions.snappy}
            className="absolute top-4 right-4 z-20 border-t border-r pointer-events-none"
          />
          <motion.div
            variants={visualCornerVariants}
            transition={transitions.snappy}
            className="absolute bottom-4 left-4 z-20 border-b border-l pointer-events-none"
          />
          <motion.div
            variants={visualCornerVariants}
            transition={transitions.snappy}
            className="absolute bottom-4 right-4 z-20 border-b border-r pointer-events-none"
          />
          <motion.div
            variants={visualCrosshairVariants}
            transition={transitions.soft}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none flex items-center justify-center"
          >
            <div className="w-full h-[1px] bg-cyan-400 absolute"></div>
            <div className="h-full w-[1px] bg-cyan-400 absolute"></div>
          </motion.div>
        </>
      )}

      {watchTarget?.live && !showPlayer && (
        <div className="absolute top-3 left-1/2 z-30 -translate-x-1/2 pointer-events-none flex items-center gap-1.5 bg-[#020617]/80 border border-cyan-800/60 rounded-sm backdrop-blur-sm px-2.5 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-cyan-300">
            STREAM LIVE
          </span>
        </div>
      )}

      {showPlayer && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 cursor-pointer touch-manipulation flex items-center bg-[#020617]/80 border border-cyan-800/60 rounded-sm backdrop-blur-sm px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.28em] text-cyan-300 hover:border-cyan-500/80 hover:bg-cyan-950/60 active:border-cyan-500/80"
        >
          Close
        </button>
      )}

      <AnimatePresence>
        {watchTarget && !showPlayer && (
          <motion.button
            key="watch-cta"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.soft}
            onClick={onWatch}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/30 cursor-pointer touch-manipulation pointer-events-auto group/watch"
          >
            <span className="flex items-center gap-2 bg-[#020617]/80 border border-cyan-800/60 rounded-sm backdrop-blur-sm px-3 py-2 font-mono text-[10px] uppercase tracking-wider sm:tracking-widest text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.12)] transition-all duration-300 group-hover/watch:border-cyan-500/80 group-hover/watch:bg-cyan-950/60 group-active/watch:border-cyan-500/80">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>
              </span>
              {watchCtaLabel(watchTarget)}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-cyan-500 group-hover/watch:text-cyan-400">
              {watchSourceLabel(watchTarget)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
