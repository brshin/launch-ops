import React, { useState, useEffect } from "react";
import { Launch } from "../types/launch";

interface LaunchCardProps {
    launch: Launch;
}

export default function LaunchCard({ launch }: LaunchCardProps) {
    const imageUrl = launch.image?.image_url || null;

    const calculateTimeLeft = () => {
        const target = new Date(launch.net).getTime();
        const now = new Date().getTime();
        const difference = target - now;
        const absDiff = Math.abs(difference);

        return {
            difference,
            hours: Math.floor((absDiff / (1000 * 60 * 60))),
            minutes: Math.floor((absDiff / 1000 / 60) % 60),
            seconds: Math.floor((absDiff / 1000) % 60)
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

    return (
        <div className="h-full w-full flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/60 rounded-xl sm:rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.08)] p-4 sm:p-6 md:p-8 relative animate-[pulse_0.4s_ease-in-out_1] overflow-hidden">
            
            <div className="absolute top-0 left-6 right-6 sm:left-12 sm:right-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_10px_#22d3ee]"></div>

            {/* CARD HEADER - Stacks on mobile, inline on tablet+ */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 sm:mb-8 shrink-0">
                <div className="group cursor-default w-full md:w-auto">
                    <p className="text-[9px] sm:text-[10px] font-mono text-cyan-600 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1 sm:mb-2 transition-all group-hover:text-cyan-400">
                        OP-SYS // {launch.launch_service_provider?.name || 'UNKNOWN'}
                    </p>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-slate-100 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:text-cyan-50 line-clamp-2">
                        {launch.name}
                    </h2>
                </div>
                
                {/* Status & Countdown Badges */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 border-t border-cyan-900/40 md:border-t-0 pt-3 md:pt-0">
                    <div className={`flex items-center gap-2.5 bg-[#020617]/80 border border-cyan-800/60 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-sm backdrop-blur-sm cursor-help hover:bg-cyan-950/60 ${statusColors.borderHover} transition-all duration-300`}>
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColors.dot} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot} ${statusColors.glow}`}></span>
                        </span>
                        <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-widest ${statusColors.text}`}>
                            SYS STAT: {status || 'UNK'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 px-1">
                        {status === 'Hold' ? (
                            <span className="text-sm sm:text-lg md:text-xl font-mono font-bold text-amber-500 tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                                COUNTDOWN HOLD
                            </span>
                        ) : status === 'Failure' || status === 'Partial Failure' ? (
                            <span className="text-sm sm:text-lg md:text-xl font-mono font-bold text-red-500 tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                                MISSION FAILURE
                            </span>
                        ) : status === 'TBD' || status === 'TBC' ? (
                            <span className="text-xs sm:text-sm md:text-base font-mono font-bold text-slate-500 tracking-widest uppercase">
                                Awaiting Target Time
                            </span>
                        ) : status === 'In Flight' || status === 'Success' ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-[10px] sm:text-xs font-mono text-cyan-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                                    T-Plus
                                </span>
                                <span className="text-base sm:text-lg md:text-xl font-mono font-bold text-cyan-400 tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                                    {String(time.hours).padStart(2, '0')}:
                                    {String(time.minutes).padStart(2, '0')}:
                                    {String(time.seconds).padStart(2, '0')}
                                </span>
                            </div>
                        ) : time.difference <= 0 ? (
                            <span className="text-sm sm:text-lg md:text-xl font-mono font-bold text-cyan-600 tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(8,145,178,0.4)]">
                                AWAITING TELEMETRY
                            </span>
                        ) : (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-[10px] sm:text-xs font-mono text-cyan-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                                    T-Minus
                                </span>
                                <span className="text-base sm:text-lg md:text-xl font-mono font-bold text-cyan-400 tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                                    {String(time.hours).padStart(2, '0')}:
                                    {String(time.minutes).padStart(2, '0')}:
                                    {String(time.seconds).padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CARD BODY - Stacks vertically on tablet/mobile, splits horizontally on wide desktop (xl) */}
            <div className="flex-1 flex flex-col xl:flex-row gap-6 sm:gap-8 min-h-0 overflow-y-auto xl:overflow-hidden pr-1 -mr-1">
                
                {/* Details Column */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-4 shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        
                        <div className="bg-black/40 border border-cyan-900/50 p-3.5 sm:p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors"></div>
                            <h3 className="text-[8px] sm:text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 transition-colors">T-Zero Target</h3>
                            <p className="text-xs sm:text-sm text-cyan-50 font-mono tracking-wider">
                                {new Date(launch.net).toLocaleString("en-US", {
                                    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
                                })}
                            </p>
                        </div>

                        <div className="bg-black/40 border border-cyan-900/50 p-3.5 sm:p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors"></div>
                            <h3 className="text-[8px] sm:text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 transition-colors">Window Range</h3>
                            <p className="text-xs sm:text-sm text-cyan-50 font-mono tracking-wider">
                                {launch.window_start ? new Date(launch.window_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA'} - {launch.window_end ? new Date(launch.window_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA'}
                            </p>
                        </div>

                        <div className="sm:col-span-2 bg-black/40 border border-cyan-900/50 p-3.5 sm:p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors group-hover:shadow-[0_0_8px_#22d3ee]"></div>
                            <h3 className="text-[8px] sm:text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 transition-colors">
                                Launch Coordinates
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base text-cyan-50 font-mono tracking-wider truncate group-hover:text-white transition-colors leading-tight">
                                {launch.pad?.name || 'TBA'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-cyan-500 font-mono uppercase tracking-[0.15em] mt-1 truncate group-hover:text-cyan-300 transition-colors">
                                {launch.pad?.location?.name || 'LOCATION DATA UNAVAILABLE'}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 bg-black/40 border border-cyan-900/50 p-4 sm:p-6 rounded-lg flex flex-col overflow-hidden hover:border-cyan-700/50 transition-all duration-300 group relative min-h-[140px]">
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-800 m-2 group-hover:border-cyan-400 transition-colors pointer-events-none"></div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-3 sm:mb-4 border-b border-cyan-900/50 pb-2.5 sm:pb-3 shrink-0">
                            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                                Directive: {launch.mission?.name || 'Classified'}
                            </h3>
                            <span className="text-[8px] sm:text-[9px] font-mono text-cyan-300 uppercase bg-cyan-950/50 px-2 py-1 rounded-sm border border-cyan-800/50 shrink-0">
                                ORBIT: {launch.mission?.orbit?.name || 'UNK'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono line-clamp-4 sm:line-clamp-6 group-hover:text-cyan-100 transition-colors overflow-y-auto pr-1">
                            {launch.mission?.description || 'No mission details available at this time.'}
                        </p>
                    </div>
                </div>

                {/* Image Panel - Fluid height on mobile/tablet, fixed width & full height on wide desktop */}
                <div className="w-full xl:w-[45%] h-[200px] sm:h-[280px] md:h-[340px] xl:h-full shrink-0 relative rounded-lg border border-cyan-900/60 overflow-hidden bg-[#020617] group cursor-crosshair shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
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
                            <div className="relative flex items-center justify-center mb-4 sm:mb-6">
                                <div className="absolute w-16 h-16 sm:w-24 sm:h-24 border border-cyan-900/40 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                <div className="absolute w-12 h-12 sm:w-16 sm:h-16 border border-cyan-800/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                <div className="absolute w-6 h-6 sm:w-8 sm:h-8 border border-cyan-700/50 rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                            </div>
                            <span className="text-cyan-700 font-mono text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] uppercase z-10 group-hover:text-cyan-500 transition-colors text-center px-4">
                                NO VISUAL FEED
                            </span>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,1)] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(8,145,178,0.05)_50%)] bg-[size:100%_4px] pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] pointer-events-none animate-[bounce_3s_infinite_linear]"></div>
                    
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-4 h-4 sm:w-6 sm:h-6 border-t border-l border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-4 h-4 sm:w-6 sm:h-6 border-t border-r border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-4 h-4 sm:w-6 sm:h-6 border-b border-l border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-4 h-4 sm:w-6 sm:h-6 border-b border-r border-cyan-500/60 transition-all duration-300 group-hover:w-3 group-hover:h-3 group-hover:border-cyan-300"></div>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none flex items-center justify-center">
                        <div className="w-full h-[1px] bg-cyan-400 absolute"></div>
                        <div className="h-full w-[1px] bg-cyan-400 absolute"></div>
                    </div>
                </div>
            </div>

            {/* CARD FOOTER - Stacks on mobile, inline on tablet+ */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-cyan-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[8px] sm:text-[9px] text-cyan-600 font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] shrink-0">
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e] shrink-0"></span>
                    SECURE SAT-LINK ACTIVE
                </span>
                <span className="truncate w-full sm:w-auto text-left sm:text-right">
                    DATA TIMESTAMP: {launch.last_updated ? new Date(launch.last_updated).toLocaleString() : 'N/A'}
                </span>
            </div>
            
        </div>
    );
}