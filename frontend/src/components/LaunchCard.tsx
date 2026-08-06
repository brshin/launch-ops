import React, { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { Launch } from "../types/launch";
import { getLaunchTitle, getRocketName } from "../utils/launchTitle";
import { transitions } from "../lib/motionTokens";
import {
    AwaitingTelemetryLabel,
    CountdownFailureLabel,
    CountdownHoldLabel,
    TickingCountdown,
} from "./CountdownReadout";
import { FeedStatus } from "./FeedStatus";
import {
    formatLocalDateTime,
    formatLocalTime,
    getLocalUtcOffsetLabel,
} from "../utils/localTime";

interface LaunchCardProps {
    launch: Launch;
    feedLive: boolean;
}

const customScrollbar = `
  [&::-webkit-scrollbar]:w-1.5 
  [&::-webkit-scrollbar-track]:bg-black/20 
  [&::-webkit-scrollbar-track]:border-l 
  [&::-webkit-scrollbar-track]:border-cyan-900/30 
  [&::-webkit-scrollbar-thumb]:bg-cyan-800/80 
  [&::-webkit-scrollbar-thumb]:rounded-sm 
  hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500 
  hover:[&::-webkit-scrollbar-thumb]:shadow-[0_0_10px_#22d3ee]
`;

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

/** Each section fades/slides up when the parent hits "show". */
const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
        opacity: 1,
        y: 0,
        transition: transitions.soft,
    },
};

export default function LaunchCard({ launch, feedLive }: LaunchCardProps) {
    
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
                    borderHover: 'hover:border-cyan-500/80',
                };
            case 'Hold':
            case 'TBD':
            case 'TBC':
                return {
                    dot: 'bg-amber-400',
                    glow: 'shadow-[0_0_5px_#fbbf24]',
                    text: 'text-amber-300',
                    borderHover: 'hover:border-amber-500/80',
                };
            case 'Failure':
            case 'Partial Failure':
                return {
                    dot: 'bg-red-500',
                    glow: 'shadow-[0_0_5px_#ef4444]',
                    text: 'text-red-400',
                    borderHover: 'hover:border-red-500/80',
                };
            default:
                return {
                    dot: 'bg-slate-400',
                    glow: 'shadow-[0_0_5px_#94a3b8]',
                    text: 'text-slate-300',
                    borderHover: 'hover:border-slate-500/80',
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
            className="h-full w-full flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/60 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.15)] p-4 sm:p-6 lg:p-8 relative overflow-hidden min-h-0"
            variants={cardVariants}
            initial="hidden"
            animate="show"
        >
            
            <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_10px_#22d3ee]"></div>

            <motion.div
                variants={sectionVariants}
                className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 lg:mb-8 shrink-0 gap-3"
            >
                <div className="group cursor-default">
                    <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.4em] mb-2 transition-all group-hover:text-cyan-400">
                        {launch.launch_service_provider?.name || 'UNKNOWN'}
                    </p>
                    <h2 className="text-xl sm:text-2xl font-mono font-bold text-slate-100 uppercase tracking-[0.2em] text-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:text-cyan-50">
                        {title}
                    </h2>
                    {showRocketSubtitle && (
                        <p className="mt-1.5 text-[11px] sm:text-xs font-mono text-cyan-500 uppercase tracking-[0.25em] transition-colors group-hover:text-cyan-300">
                            {rocketName}
                        </p>
                    )}
                </div>
                
                <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                    
                    <div className={`flex items-center gap-3 bg-[#020617]/80 border border-cyan-800/60 px-5 py-2.5 rounded-sm backdrop-blur-sm cursor-help hover:bg-cyan-950/60 ${statusColors.borderHover} transition-all duration-300`}>
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColors.dot} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot} ${statusColors.glow}`}></span>
                        </span>
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${statusColors.text}`}>
                            Status: {status || 'Unk'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 px-2">
                        {status === 'Hold' ? (
                            <CountdownHoldLabel />
                        ) : status === 'Failure' || status === 'Partial Failure' ? (
                            <CountdownFailureLabel />
                        ) : status === 'TBD' || status === 'TBC' ? (
                            <div className="flex flex-col items-start sm:items-end gap-0.5">
                                <span className="text-[10px] font-mono text-amber-500/90 uppercase tracking-[0.3em]">
                                    Net · Provisional
                                </span>
                                <span className="text-lg md:text-xl font-mono font-bold text-slate-300 tracking-widest tabular-nums">
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
            */}
            <motion.div
                variants={cardVariants}
                className={`flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0 overflow-y-auto lg:overflow-hidden pr-1 lg:pr-0 ${customScrollbar}`}
            >
                
                <motion.div
                    variants={cardVariants}
                    className="w-full shrink-0 lg:w-auto lg:flex-1 lg:shrink lg:h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-[auto_1fr] gap-4 min-h-0 content-start"
                >
                        <motion.div
                            variants={sectionVariants}
                            className="bg-black/40 border border-cyan-900/50 p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors"></div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] group-hover:text-cyan-400 transition-colors">
                                    T-Zero Target
                                </h3>
                                <span
                                    className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider shrink-0"
                                    title="Times shown in your local timezone"
                                >
                                    {localOffsetLabel}
                                </span>
                            </div>
                            <p className="text-sm text-cyan-50 font-mono tracking-wider tabular-nums">
                                <span>{tZero.date}</span>
                                <span className="mx-1.5 text-cyan-700">·</span>
                                <span>{tZero.time}</span>
                            </p>
                            <p className="mt-1.5 text-[10px] font-mono font-light text-cyan-500 uppercase tracking-wide group-hover:text-cyan-300 transition-colors">
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
                            className="bg-black/40 border border-cyan-900/50 p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden min-w-0 flex flex-col justify-center"
                        >
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors group-hover:shadow-[0_0_8px_#22d3ee]"></div>
                            <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 transition-colors">
                                Launch Coordinates
                            </h3>
                            <p className="text-sm text-cyan-50 font-mono tracking-wider break-words leading-tight group-hover:text-white transition-colors">
                                {launch.pad?.name || 'TBA'}
                            </p>
                            <p className="mt-1 text-[11px] text-cyan-500 font-mono uppercase tracking-[0.15em] break-words leading-snug group-hover:text-cyan-300 transition-colors">
                                {launch.pad?.location?.name || 'LOCATION DATA UNAVAILABLE'}
                            </p>
                        </motion.div>

                    <motion.div
                        variants={sectionVariants}
                        className="sm:col-span-2 w-full min-h-[180px] lg:min-h-0 lg:h-full flex flex-col bg-black/40 border border-cyan-900/50 p-4 rounded-lg overflow-hidden hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 group relative"
                    >
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-800 m-2 group-hover:border-cyan-400 transition-colors pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-3 border-b border-cyan-900/50 pb-2.5 shrink-0 gap-3">
                            <h3 className="text-xs text-cyan-500 uppercase font-mono tracking-[0.15em] leading-tight min-w-0 group-hover:text-cyan-400 transition-colors">
                                Mission Brief
                            </h3>
                            {(missionType || missionOrbit) && (
                                <div className="flex items-center gap-2 shrink-0 min-w-0">
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
                        <p className={`flex-1 min-h-0 text-[13px] text-slate-300 leading-relaxed font-mono group-hover:text-cyan-50 transition-colors overflow-y-auto pr-1 ${customScrollbar}`}>
                            {launch.mission?.description || 'No mission details available at this time.'}
                        </p>
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={sectionVariants}
                    className="w-full h-[220px] sm:h-[280px] shrink-0 lg:w-[45%] lg:h-full lg:shrink relative rounded-lg border border-cyan-900/60 overflow-hidden bg-[#020617] group cursor-crosshair shadow-[inset_0_0_30px_rgba(0,0,0,1)]"
                >
                    
                {imageUrl ? (
                    <img 
                        src={imageUrl}
                        className="w-full h-full object-cover opacity-80 mix-blend-screen transition-all duration-[3000ms] group-hover:scale-105 group-hover:opacity-100"
                        alt="Launch Visual"
                        onError={(e) => { 
                            e.currentTarget.style.display = 'none'; 
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#020617] mix-blend-screen opacity-80 transition-all duration-500 group-hover:opacity-100">
                        <div className="relative flex items-center justify-center mb-6">
                            <div className="absolute w-24 h-24 border border-cyan-900/40 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                            <div className="absolute w-16 h-16 border border-cyan-800/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                            <div className="absolute w-8 h-8 border border-cyan-700/50 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                        </div>
                        <span className="text-cyan-700 font-mono text-[10px] tracking-[0.5em] uppercase z-10 group-hover:text-cyan-500 transition-colors">
                            NO VISUAL FEED
                        </span>
                    </div>
                )}
                    
                    <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,1)] pointer-events-none"></div>
                    
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(8,145,178,0.05)_50%)] bg-[size:100%_4px] pointer-events-none"></div>
                    
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] pointer-events-none animate-[bounce_3s_infinite_linear]"></div>
                    
                    <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none flex items-center justify-center">
                        <div className="w-full h-[1px] bg-cyan-400 absolute"></div>
                        <div className="h-full w-[1px] bg-cyan-400 absolute"></div>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                variants={sectionVariants}
                className="mt-4 sm:mt-6 pt-4 border-t border-cyan-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] shrink-0"
            >
                <FeedStatus
                    live={feedLive}
                    className="tracking-[0.2em]"
                />
                <span
                    className="flex items-baseline gap-2 text-cyan-500"
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
