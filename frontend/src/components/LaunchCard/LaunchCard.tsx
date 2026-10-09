import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Launch } from "../../types/launch";
import { agencyMarkUrl, getLaunchTitle, getMissionBrief, getMissionCustomers, getMissionOrbitLabel, getMissionTypeLabel, getRocketName } from "../../utils/launchTitle";
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
} from "../../utils/localTime";
import { getLaunchTime, getNetPrecisionCaption, hasLaunchWindow, isNetPreciseEnough } from "../../utils/launchTime";
import { pickWatchTarget } from "../../utils/watchTarget";

interface LaunchCardProps {
    launch: Launch;
    hour12: boolean;
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
    hour12,
}: LaunchCardProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const compactMotion = useCompactMotion();
    const shortBand = useShortViewportBand();
    const cardBand = useCardDensityBand(rootRef, compactMotion);
    /**
     * Below lg, height and short-viewport bands tighten type.
     * At lg the inspector is a narrow column, so roomy tokens stay, with smaller lg sizes.
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
    const [userPlaying, setUserPlaying] = useState(false);
    const [feedDismissed, setFeedDismissed] = useState(false);
    const watchTarget = useMemo(
        () =>
            pickWatchTarget({
                vidUrls: launch.vid_urls,
                webcastLive: launch.webcast_live,
                net: launch.net,
                status: launch.status?.abbrev,
                now: Date.now(),
            }),
        [launch.vid_urls, launch.webcast_live, launch.net, launch.status, time.difference],
    );
    const playing = Boolean(
        watchTarget?.embedUrl &&
            !feedDismissed &&
            (userPlaying || watchTarget.mode === "live"),
    );

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
        ? formatLocalDateTime(launch.last_updated, { hour12 })
        : null;
    const tZero = formatLocalDateTime(launch.net, { hour12 });
    const showNetTime = isNetPreciseEnough(launch.net_precision);
    const netCaption = getNetPrecisionCaption(launch.net_precision);
    const showWindow = hasLaunchWindow(launch.window_start, launch.window_end);
    const windowStart = showWindow ? formatLocalTime(launch.window_start, { hour12 }) : null;
    const windowEnd = showWindow ? formatLocalTime(launch.window_end, { hour12 }) : null;

    const missionType = getMissionTypeLabel(launch.mission?.type);
    const missionOrbit = getMissionOrbitLabel(launch.mission?.orbit);

    return (
        <motion.div
            ref={rootRef}
            data-density={density}
            className={`launch-card w-full flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/60 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.15)] relative overflow-clip max-lg:h-auto max-lg:shrink-0 lg:h-full lg:min-h-0 density-ease ${chrome.rootPad}`}
            variants={cardVariants}
            initial="hidden"
            animate="show"
        >
            
            <motion.div
                className="card-hairline absolute top-0 left-12 right-12 h-3 overflow-hidden"
                style={{ originX: 0 }}
                initial={reduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={transitions.soft}
            >
                <div className="card-hairline-gleam" />
            </motion.div>

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
                    providerMarkUrl={agencyMarkUrl(launch.launch_service_provider)}
                    customers={getMissionCustomers(launch)}
                    title={title}
                    rocketName={rocketName}
                    showRocketSubtitle={showRocketSubtitle}
                    showRocket={showRocket}
                    status={status}
                    launchTime={launchTime}
                    showProvisional={showProvisional}
                    tZero={tZero}
                    hour12={hour12}
                    time={time}
                />
            </motion.div>

            {/*
              Always stacked. The picture keeps an aspect ratio so it cannot
              collapse. On desktop the mission region is what scrolls.
            */}
            <div
                className="flex flex-col min-h-0 max-lg:flex-none max-lg:overflow-visible lg:flex-1 lg:overflow-hidden"
            >
            <motion.div
                variants={cardVariants}
                className={`flex flex-col min-h-0 max-lg:flex-none lg:flex-1 lg:min-h-0 lg:overflow-hidden density-ease ${chrome.panelsGap}`}
            >
                <motion.div
                    layout="size"
                    variants={sectionVariants}
                    transition={transitions.soft}
                    className={`relative w-full aspect-[16/10] shrink-0 rounded-lg border border-cyan-900/60 overflow-clip bg-[#020617] shadow-[inset_0_0_30px_rgba(0,0,0,1)] density-ease ${
                        playing
                            ? "max-h-[min(50dvh,22rem)] sm:max-h-[min(52dvh,24rem)] lg:max-h-48 cursor-default"
                            : watchTarget
                              ? "max-h-[min(40dvh,13.5rem)] sm:max-h-[min(42dvh,15rem)] lg:max-h-36 cursor-pointer"
                              : "max-h-[min(40dvh,13.5rem)] sm:max-h-[min(42dvh,15rem)] lg:max-h-36 cursor-crosshair"
                    }`}
                >
                    <LaunchCardVisual
                        imageUrl={imageUrl}
                        compactTravel={compactTravel}
                        watchTarget={watchTarget}
                        playing={playing}
                        onPlay={() => {
                            setFeedDismissed(false);
                            setUserPlaying(true);
                        }}
                        onClose={() => {
                            setUserPlaying(false);
                            setFeedDismissed(true);
                        }}
                    />
                </motion.div>

                {/* Meta + brief — stack: natural height; desktop: fill column */}
                <LaunchCardMission
                    chrome={chrome}
                    cardVariants={cardVariants}
                    sectionVariants={sectionVariants}
                    tZero={tZero}
                    showNetTime={showNetTime}
                    netCaption={netCaption}
                    windowStart={windowStart}
                    windowEnd={windowEnd}
                    padName={launch.pad?.name || "TBA"}
                    padLocation={
                        launch.pad?.location?.name || "LOCATION DATA UNAVAILABLE"
                    }
                    missionType={missionType}
                    missionOrbit={missionOrbit}
                    description={getMissionBrief(launch.mission?.description)}
                    phase={launchTime.phase}
                    hour12={hour12}
                />
            </motion.div>

            <motion.div
                variants={sectionVariants}
                className={`border-t border-cyan-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 shrink-0 text-[9px] font-mono uppercase tracking-[0.2em] density-ease ${chrome.footer}`}
            >
                <LaunchCardFooter lastUpdated={lastUpdated} hour12={hour12} />
            </motion.div>
            </div>
            
        </motion.div>
    );
}
