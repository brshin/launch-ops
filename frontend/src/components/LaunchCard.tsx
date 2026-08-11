import React, { useState, useEffect, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Launch } from "../types/launch";
import { getLaunchTitle, getRocketName } from "../utils/launchTitle";
import { transitions, travel } from "../lib/motionTokens";
import {
    AwaitingTelemetryLabel,
    CountdownFailureLabel,
    CountdownHoldLabel,
    TickingCountdown,
} from "./CountdownReadout";
import { FeedStatus } from "./FeedStatus";
import { useCompactMotion } from "../hooks/useCompactMotion";
import {
    formatLocalDateTime,
    formatLocalTime,
    getLocalUtcOffsetLabel,
} from "../utils/localTime";

interface LaunchCardProps {
    launch: Launch;
    feedLive: boolean;
}

const customScrollbar = "console-scrollbar console-scrollbar-y";

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

export default function LaunchCard({ launch, feedLive }: LaunchCardProps) {
    const compactMotion = useCompactMotion();

    const sectionVariants: Variants = useMemo(() => {
        const y = compactMotion ? travel.compact.sectionY : travel.desktop.sectionY;
        return {
            hidden: { opacity: 0, y },
            show: {
                opacity: 1,
                y: 0,
                transition: transitions.soft,
            },
        };
    }, [compactMotion]);

    const visualImageVariants: Variants = useMemo(
        () => ({
            rest: { scale: 1, opacity: 0.82 },
            focus: { scale: compactMotion ? 1.02 : 1.04, opacity: 1 },
        }),
        [compactMotion],
    );
    const imageUrl = launch.image?.image_url || null;

    const calculateTimeLeft = () => {
        const target = new Date(launch.net).getTime();
        const now = new Date().getTime();
        const difference = target - now;

        const absDiff = Math.abs(difference);

        return {
            difference,
            days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((absDiff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((absDiff / 1000 / 60) % 60),
            seconds: Math.floor((absDiff / 1000) % 60),
        };
    };

    const [time, setTime] = useState(calculateTimeLeft());

    const status = launch.status.abbrev;

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(calculateTimeLeft());

        }, 1000);

        return () => clearInterval(timer);

    }, [launch.net]);

    const getStatusColors = (status: string) => {
        switch (status) {
            case 'Success':
            case 'In Flight':
            case 'Go':
                return {
                    dot: 'bg-cyan-400',
                    glow: 'shadow-[0_0_5px_#22d3ee]',
                    text: 'text-cyan-300',
                    borderHover: 'hover:border-cyan-500/80 active:border-cyan-500/80',
                };
            case 'Hold':
            case 'TBD':
            case 'TBC':
                return {
                    dot: 'bg-amber-400',
                    glow: 'shadow-[0_0_5px_#fbbf24]',
                    text: 'text-amber-300',
                    borderHover: 'hover:border-amber-500/80 active:border-amber-500/80',
                };
            case 'Failure':
            case 'Partial Failure':
                return {
                    dot: 'bg-red-500',
                    glow: 'shadow-[0_0_5px_#ef4444]',
                    text: 'text-red-400',
                    borderHover: 'hover:border-red-500/80 active:border-red-500/80',
                };
            default:
                return {
                    dot: 'bg-slate-400',
                    glow: 'shadow-[0_0_5px_#94a3b8]',
                    text: 'text-slate-300',
                    borderHover: 'hover:border-slate-500/80 active:border-slate-500/80',
                };
        }
    };

    const statusColors = getStatusColors(status);
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
            className="h-full w-full flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/60 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.15)] p-3 sm:p-4 lg:p-8 relative overflow-hidden min-h-0"
            variants={cardVariants}
            initial="hidden"
            animate="show"
        >
            
            <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_10px_#22d3ee]"></div>

            {/* Identity + status/countdown — stays above the fold on phone */}
            <motion.div
                variants={sectionVariants}
                className="flex flex-col sm:flex-row justify-between items-start mb-2.5 sm:mb-3 lg:mb-8 shrink-0 gap-2 sm:gap-3"
            >
                <div className="group cursor-default min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] font-mono text-cyan-500 uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 sm:mb-2 transition-all group-hover:text-cyan-400 line-clamp-1">
                        {launch.launch_service_provider?.name || 'UNKNOWN'}
                    </p>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-slate-100 uppercase tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[0.2em] text-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:text-cyan-50 line-clamp-2">
                        {title}
                    </h2>
                    {showRocketSubtitle && (
                        <p className="mt-1 text-[10px] sm:text-xs font-mono text-cyan-500 uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors group-hover:text-cyan-300 truncate">
                            {rocketName}
                        </p>
                    )}
                </div>
                
                <div className="flex flex-col items-start sm:items-end gap-1.5 sm:gap-3 w-full sm:w-auto shrink-0">
                    
                    <div className={`flex items-center gap-2 sm:gap-3 bg-[#020617]/80 border border-cyan-800/60 px-3 py-2 sm:px-5 sm:py-2.5 min-h-9 rounded-sm backdrop-blur-sm cursor-help hover:bg-cyan-950/60 active:bg-cyan-950/60 ${statusColors.borderHover} transition-all duration-300`}>
                        <span className="relative flex h-2 w-2">
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot} ${statusColors.glow}`}></span>
                        </span>
                        <span className={`text-[10px] font-mono uppercase tracking-wider sm:tracking-widest ${statusColors.text}`}>
                            Status: {status || 'Unk'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 px-0 sm:px-2 min-w-0">
                        {status === 'Hold' ? (
                            <CountdownHoldLabel />
                        ) : status === 'Failure' || status === 'Partial Failure' ? (
                            <CountdownFailureLabel />
                        ) : status === 'TBD' || status === 'TBC' ? (
                            <div className="flex flex-col items-start sm:items-end gap-0.5">
                                <span className="text-[10px] font-mono text-amber-500/90 uppercase tracking-[0.3em]">
                                    Net · Provisional
                                </span>
                                <span className="text-base sm:text-lg md:text-xl font-mono font-bold text-slate-300 tracking-wider sm:tracking-widest tabular-nums">
                                    <span>{tZero.date}</span>
                                    <span className="mx-1.5 text-slate-600">·</span>
                                    <span>{tZero.time}</span>
                                </span>
                            </div>
                        ) : status === 'In Flight' || status === 'Success' ? (
                            <TickingCountdown
                                days={time.days}
                                hours={time.hours}
                                minutes={time.minutes}
                                seconds={time.seconds}
                                difference={time.difference}
                                mode="plus"
                            />
                        ) : time.difference <= 0 ? (
                            <AwaitingTelemetryLabel />
                        ) : (
                            <TickingCountdown
                                days={time.days}
                                hours={time.hours}
                                minutes={time.minutes}
                                seconds={time.seconds}
                                difference={time.difference}
                                mode="minus"
                            />
                        )}
                    </div>

                </div>
            </motion.div>

            {/*
              Nested stagger: this region is a motion child of the card, and also
              a stagger parent. Meta blocks must be direct motion children to cascade.
              Below lg: visual feed first (order), meta/brief after.
              At lg+: meta left, feed right (desktop HUD).
            */}
            <motion.div
                variants={cardVariants}
                className={`flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-8 min-h-0 overflow-y-auto lg:overflow-hidden pr-1 lg:pr-0 ${customScrollbar}`}
            >
                {/* Visual feed — first on phone, right column on desktop */}
                <motion.div
                    variants={sectionVariants}
                    className="order-1 lg:order-2 w-full aspect-[16/10] max-h-[min(32dvh,14rem)] sm:max-h-[min(36dvh,17.5rem)] shrink-0 lg:aspect-auto lg:max-h-none lg:w-[45%] lg:h-full lg:shrink relative rounded-lg border border-cyan-900/60 overflow-hidden bg-[#020617] cursor-crosshair shadow-[inset_0_0_30px_rgba(0,0,0,1)]"
                >
                    <motion.div
                        className="absolute inset-0"
                        variants={visualFrameVariants}
                        initial="rest"
                        animate="rest"
                        whileHover="focus"
                        whileTap="focus"
                    >
                        {imageUrl ? (
                            <motion.img
                                src={imageUrl}
                                variants={visualImageVariants}
                                transition={{ duration: 0.85, ease: "easeOut" }}
                                className="w-full h-full object-cover mix-blend-screen"
                                alt="Launch Visual"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ) : (
                            <motion.div
                                variants={visualImageVariants}
                                transition={{ duration: 0.45, ease: "easeOut" }}
                                className="w-full h-full flex flex-col items-center justify-center bg-[#020617] mix-blend-screen"
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

                        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,1)] pointer-events-none"></div>

                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(8,145,178,0.05)_50%)] bg-[size:100%_4px] pointer-events-none"></div>

                        <motion.div
                            variants={visualCornerVariants}
                            transition={transitions.snappy}
                            className="absolute top-4 left-4 border-t border-l pointer-events-none"
                        />
                        <motion.div
                            variants={visualCornerVariants}
                            transition={transitions.snappy}
                            className="absolute top-4 right-4 border-t border-r pointer-events-none"
                        />
                        <motion.div
                            variants={visualCornerVariants}
                            transition={transitions.snappy}
                            className="absolute bottom-4 left-4 border-b border-l pointer-events-none"
                        />
                        <motion.div
                            variants={visualCornerVariants}
                            transition={transitions.snappy}
                            className="absolute bottom-4 right-4 border-b border-r pointer-events-none"
                        />

                        <motion.div
                            variants={visualCrosshairVariants}
                            transition={transitions.soft}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none flex items-center justify-center"
                        >
                            <div className="w-full h-[1px] bg-cyan-400 absolute"></div>
                            <div className="h-full w-[1px] bg-cyan-400 absolute"></div>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Meta + brief — below feed on phone; left column on desktop */}
                <motion.div
                    variants={cardVariants}
                    className="order-2 lg:order-1 w-full shrink-0 lg:w-auto lg:flex-1 lg:shrink lg:h-full grid grid-cols-2 lg:grid-rows-[auto_1fr] gap-2 sm:gap-3 lg:gap-4 min-h-0 content-start"
                >
                        <motion.div
                            variants={sectionVariants}
                            className="bg-black/40 border border-cyan-900/50 p-2.5 sm:p-3 lg:p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 group-active:bg-cyan-400 transition-colors"></div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
                                    T-Zero Target
                                </h3>
                                <span
                                    className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider shrink-0"
                                    title="Times shown in your local timezone"
                                >
                                    {localOffsetLabel}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-cyan-50 font-mono tracking-wider tabular-nums">
                                <span>{tZero.date}</span>
                                <span className="mx-1.5 text-cyan-700">·</span>
                                <span>{tZero.time}</span>
                            </p>
                            <p className="mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-mono font-light text-cyan-500 uppercase tracking-wide group-hover:text-cyan-300 group-active:text-cyan-300 transition-colors">
                                <span className="mr-1.5">Window</span>
                                <span className="tabular-nums tracking-normal">
                                    {windowStart ?? 'TBA'}
                                    {' – '}
                                    {windowEnd ?? 'TBA'}
                                </span>
                            </p>
                        </motion.div>
                        <motion.div
                            variants={sectionVariants}
                            className="bg-black/40 border border-cyan-900/50 p-2.5 sm:p-3 lg:p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden min-w-0 flex flex-col justify-center"
                        >
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 group-active:bg-cyan-400 transition-colors group-hover:shadow-[0_0_8px_#22d3ee] group-active:shadow-[0_0_8px_#22d3ee]"></div>
                            <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
                                Launch Coordinates
                            </h3>
                            <p className="text-xs sm:text-sm text-cyan-50 font-mono tracking-wider break-words leading-tight group-hover:text-white group-active:text-white transition-colors line-clamp-2">
                                {launch.pad?.name || 'TBA'}
                            </p>
                            <p className="mt-1 text-[10px] sm:text-[11px] text-cyan-500 font-mono uppercase tracking-[0.15em] break-words leading-snug group-hover:text-cyan-300 group-active:text-cyan-300 transition-colors line-clamp-2">
                                {launch.pad?.location?.name || 'LOCATION DATA UNAVAILABLE'}
                            </p>
                        </motion.div>

                    <motion.div
                        variants={sectionVariants}
                        className="col-span-2 w-full min-h-0 max-h-[7.5rem] lg:max-h-none lg:h-full flex flex-col bg-black/40 border border-cyan-900/50 p-2.5 sm:p-3 lg:p-4 rounded-lg overflow-hidden hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 group relative"
                    >
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-800 m-2 group-hover:border-cyan-400 group-active:border-cyan-400 transition-colors pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-2 lg:mb-3 border-b border-cyan-900/50 pb-2 shrink-0 gap-2 sm:gap-3">
                            <h3 className="text-[10px] sm:text-xs text-cyan-500 uppercase font-mono tracking-[0.15em] leading-tight min-w-0 group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
                                Mission Brief
                            </h3>
                            {(missionType || missionOrbit) && (
                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
                                    {missionType && (
                                        <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider truncate px-1.5 py-0.5 border border-cyan-900/50 rounded-sm">
                                            {missionType}
                                        </span>
                                    )}
                                    {missionOrbit && (
                                        <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider truncate px-1.5 py-0.5 border border-cyan-900/50 rounded-sm">
                                            {missionOrbit}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className={`flex-1 min-h-0 text-[12px] sm:text-[13px] text-slate-300 leading-relaxed font-mono group-hover:text-cyan-50 group-active:text-cyan-50 transition-colors overflow-y-auto pr-1 ${customScrollbar}`}>
                            {launch.mission?.description || 'No mission details available at this time.'}
                        </p>
                    </motion.div>
                </motion.div>
            </motion.div>

            <motion.div
                variants={sectionVariants}
                className="mt-2.5 sm:mt-4 lg:mt-6 pt-2.5 sm:pt-4 border-t border-cyan-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 text-[9px] font-mono uppercase tracking-[0.2em] shrink-0"
            >
                <FeedStatus
                    live={feedLive}
                    className="tracking-[0.2em]"
                />
                <span
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-cyan-500"
                    title="When the launch provider last updated this record (local time)"
                >
                    <span className="tracking-[0.25em]">Last Updated</span>
                    <span className="text-cyan-600 tracking-wider">
                        {localOffsetLabel}
                    </span>
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
            </motion.div>
            
        </motion.div>
    );
}
