import { useMemo, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { Launch } from "../../types/launch";
import { getLaunchTitle, getRocketName } from "../../utils/launchTitle";
import { transitions, travel } from "../../lib/motionTokens";
import { densityChrome } from "../../lib/cardDensityChrome";
import { LaunchCardFooter } from "./LaunchCardFooter";
import { LaunchCardIdentity } from "./LaunchCardIdentity";
import { LaunchCardMission } from "./LaunchCardMission";
import { LaunchCardVisual } from "./LaunchCardVisual";
import { useCountdown } from "../../hooks/useCountdown";
import { useCompactMotion } from "../../hooks/useCompactMotion";
import {
    useCardDensityBand,
    type CardDensity,
} from "../../hooks/useCardDensityBand";
import { useShortViewportBand } from "../../hooks/useShortViewportBand";
import {
    formatLocalDateTime,
    formatLocalTime,
    getLocalUtcOffsetLabel,
} from "../../utils/localTime";
import { getLaunchTime } from "../../utils/launchTime";

interface LaunchCardProps {
    launch: Launch;
    feedLive: boolean;
}

/** Parent orchestrates children; staggerChildren = delay between each direct motion child. */
const cardVariants: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.04,
        },
    },
};

export default function LaunchCard({
    launch,
    feedLive,
}: LaunchCardProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const compactMotion = useCompactMotion();
    const shortBand = useShortViewportBand();
    const cardBand = useCardDensityBand(rootRef, compactMotion);
    /**
     * Soft density: card-height bands + short-viewport bands (whichever is tighter).
     * Desktop width always stays roomy type.
     */
    const density: CardDensity = useMemo(() => {
        if (!compactMotion) return "roomy";
        const rank: Record<CardDensity, number> = { roomy: 0, mid: 1, dense: 2 };
        const fromShort: CardDensity =
            shortBand === "short" ? "dense" : shortBand === "mid" ? "mid" : "roomy";
        return rank[cardBand] >= rank[fromShort] ? cardBand : fromShort;
    }, [compactMotion, cardBand, shortBand]);
    const chrome = densityChrome[density];
    const showRocket = density !== "dense";
    const compactTravel = density !== "roomy" || compactMotion;

    const sectionVariants: Variants = useMemo(() => {
        const y = compactTravel ? travel.compact.sectionY : travel.desktop.sectionY;
        return {
            hidden: { opacity: 0, y },
            show: {
                opacity: 1,
                y: 0,
                transition: transitions.soft,
            },
        };
    }, [compactTravel]);

    const imageUrl = launch.image?.image_url || null;

    const time = useCountdown(launch.net);

    const status = launch.status.abbrev;
    const launchTime = getLaunchTime({
        net: launch.net,
        status,
        netPrecision: launch.net_precision,
        now: Date.now(),
    });
    const showProvisional =
        launchTime.phase === "provisional" ||
        (!launchTime.preciseEnough &&
            launchTime.phase !== "hold" &&
            launchTime.phase !== "failed" &&
            launchTime.phase !== "live");

    const title = getLaunchTitle(launch);
    const rocketName = getRocketName(launch);
    const showRocketSubtitle =
        !!rocketName && rocketName.toLowerCase() !== title.toLowerCase();

    const lastUpdated = launch.last_updated
        ? formatLocalDateTime(launch.last_updated, { includeSeconds: true })
        : null;
    const tZero = formatLocalDateTime(launch.net);
    const localOffsetLabel = getLocalUtcOffsetLabel();
    const windowStart = launch.window_start
        ? formatLocalTime(launch.window_start)
        : null;
    const windowEnd = launch.window_end
        ? formatLocalTime(launch.window_end)
        : null;

    const isKnownMeta = (value?: string | null) => {
        if (!value?.trim()) return false;
        const normalized = value.trim().toLowerCase();
        return normalized !== 'unknown' && normalized !== 'unk';
    };

    const missionType = isKnownMeta(launch.mission?.type)
        ? launch.mission!.type
        : null;
    const missionOrbit = isKnownMeta(launch.mission?.orbit?.abbrev)
        ? launch.mission!.orbit.abbrev
        : isKnownMeta(launch.mission?.orbit?.name)
          ? launch.mission!.orbit.name
          : null;

    return (
        <motion.div
            ref={rootRef}
            data-density={density}
            className={`launch-card w-full flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/60 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.15)] relative overflow-clip max-lg:h-auto max-lg:shrink-0 lg:h-full lg:min-h-0 density-ease ${chrome.rootPad}`}
            variants={cardVariants}
            initial="hidden"
            animate="show"
        >
            
            <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_10px_#22d3ee]"></div>

            {/* Identity + status/countdown
                Narrow stack (<sm): status top-right beside title; countdown below.
                Wider stack (sm+) + desktop: status + countdown right column (unchanged). */}
            <motion.div
                variants={sectionVariants}
                className={`flex flex-col gap-1.5 sm:gap-0 sm:flex-row sm:justify-between sm:items-start shrink-0 density-ease ${chrome.identity}`}
            >
                <LaunchCardIdentity
                    chrome={chrome}
                    providerName={launch.launch_service_provider?.name || "UNKNOWN"}
                    title={title}
                    rocketName={rocketName}
                    showRocketSubtitle={showRocketSubtitle}
                    showRocket={showRocket}
                    status={status}
                    launchTime={launchTime}
                    showProvisional={showProvisional}
                    tZero={tZero}
                    time={time}
                />
            </motion.div>

            {/*
              Stacked: hug content; scroll only on the App panel (no nested trap).
              Desktop: shell fills; brief / meta column scroll.
              overflow-clip (not hidden) on chrome so wheel/touch reach the scroller.
            */}
            <div
                className="flex flex-col min-h-0 max-lg:flex-none max-lg:overflow-visible lg:flex-1 lg:overflow-hidden"
            >
            <motion.div
                variants={cardVariants}
                className={`flex flex-col lg:flex-row min-h-0 max-lg:flex-none lg:flex-1 lg:min-h-0 lg:overflow-hidden density-ease ${chrome.panelsGap}`}
            >
                {/* Visual feed — capped when stacked; fills column on desktop */}
                <motion.div
                    variants={sectionVariants}
                    className="order-1 lg:order-2 relative w-full aspect-[16/10] max-h-[min(40dvh,13.5rem)] sm:max-h-[min(42dvh,15rem)] shrink-0 lg:w-[45%] lg:aspect-auto lg:max-h-none lg:h-full lg:min-h-0 lg:shrink rounded-lg border border-cyan-900/60 overflow-clip bg-[#020617] cursor-crosshair shadow-[inset_0_0_30px_rgba(0,0,0,1)]"
                >
                    <LaunchCardVisual
                        imageUrl={imageUrl}
                        compactTravel={compactTravel}
                    />
                </motion.div>

                {/* Meta + brief — stack: natural height; desktop: fill column */}
                <LaunchCardMission
                    chrome={chrome}
                    cardVariants={cardVariants}
                    sectionVariants={sectionVariants}
                    tZero={tZero}
                    localOffsetLabel={localOffsetLabel}
                    windowStart={windowStart}
                    windowEnd={windowEnd}
                    padName={launch.pad?.name || "TBA"}
                    padLocation={
                        launch.pad?.location?.name || "LOCATION DATA UNAVAILABLE"
                    }
                    missionType={missionType}
                    missionOrbit={missionOrbit}
                    description={
                        launch.mission?.description ||
                        "No mission details available at this time."
                    }
                />
            </motion.div>

            <motion.div
                variants={sectionVariants}
                className={`border-t border-cyan-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 shrink-0 text-[9px] font-mono uppercase tracking-[0.2em] density-ease ${chrome.footer}`}
            >
                <LaunchCardFooter
                    feedLive={feedLive}
                    lastUpdated={lastUpdated}
                    localOffsetLabel={localOffsetLabel}
                />
            </motion.div>
            </div>
            
        </motion.div>
    );
}
