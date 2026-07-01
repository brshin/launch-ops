import { useState, useEffect } from "react";

export default function LaunchCard({ launch }) {
    
    const imageUrl = launch.image?.image_url || 'https://via.placeholder.com/800x800/000000/0891b2/?text=NO+VISUAL';

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


    return (
        <div className="h-full w-full flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/60 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.08)] p-8 relative animate-[pulse_0.4s_ease-in-out_1]">
            
            <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_10px_#22d3ee]"></div>

            <div className="flex justify-between items-start mb-8">
                <div className="group cursor-default">
                    <p className="text-[10px] font-mono text-cyan-600 uppercase tracking-[0.4em] mb-2 transition-all group-hover:text-cyan-400">
                        OP-SYS // {launch.launch_service_provider?.name || 'UNKNOWN'}
                    </p>
                    <h2 className="text-2xl font-mono font-bold text-slate-100 uppercase tracking-[0.2em] text-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:text-cyan-50">
                        {launch.name}
                    </h2>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                    
                    <div className="flex items-center gap-3 bg-[#020617]/80 border border-cyan-800/60 px-5 py-2.5 rounded-sm backdrop-blur-sm cursor-help hover:bg-cyan-950/60 hover:border-cyan-500/80 transition-all duration-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
                            SYS STAT: {launch.status?.abbrev || 'UNK'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 px-2">
                        {status === 'Hold' ? (
                            <span className="text-lg md:text-xl font-mono font-bold text-amber-500 tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                                COUNTDOWN HOLD
                            </span>
                        ) : status === 'Failure' || status === 'Partial Failure' ? (
                            <span className="text-lg md:text-xl font-mono font-bold text-red-500 tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                                MISSION FAILURE
                            </span>
                        ) : status === 'TBD' || status === 'TBC' ? (
                            <span className="text-sm md:text-base font-mono font-bold text-slate-500 tracking-widest uppercase">
                                Awaiting Target Time
                            </span>
                        ) : status === 'In Flight' || status === 'Success' ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-cyan-600 uppercase tracking-[0.3em]">
                                    T-Plus
                                </span>
                                <span className="text-lg md:text-xl font-mono font-bold text-cyan-400 tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                                    {String(time.hours).padStart(2, '0')}:
                                    {String(time.minutes).padStart(2, '0')}:
                                    {String(time.seconds).padStart(2, '0')}
                                </span>
                            </div>
                        ) : time.difference <= 0 ? (
                            <span className="text-lg md:text-xl font-mono font-bold text-cyan-600 tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(8,145,178,0.4)]">
                                AWAITING TELEMETRY
                            </span>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-cyan-600 uppercase tracking-[0.3em]">
                                    T-Minus
                                </span>
                                <span className="text-lg md:text-xl font-mono font-bold text-cyan-400 tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                                    {String(time.hours).padStart(2, '0')}:
                                    {String(time.minutes).padStart(2, '0')}:
                                    {String(time.seconds).padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <div className="flex-1 flex gap-8 min-h-0">
                
                <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 border border-cyan-900/50 p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors"></div>
                            <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 transition-colors">T-Zero Target</h3>
                            <p className="text-sm text-cyan-50 font-mono tracking-wider">
                                {new Date(launch.net).toLocaleString("en-US", {
                                    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
                                })}
                            </p>
                        </div>
                        <div className="bg-black/40 border border-cyan-900/50 p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors"></div>
                            <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 transition-colors">Window Range</h3>
                            <p className="text-sm text-cyan-50 font-mono tracking-wider">
                                {launch.window_start ? new Date(launch.window_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA'} - {launch.window_end ? new Date(launch.window_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA'}
                            </p>
                        </div>
                        <div className="col-span-2 bg-black/40 border border-cyan-900/50 p-4 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 transition-colors"></div>
                            <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 transition-colors">Launch Coordinates</h3>
                            <p className="text-sm text-cyan-50 font-mono tracking-wider truncate">{launch.pad?.name || 'TBA'}</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-black/40 border border-cyan-900/50 p-6 rounded-lg flex flex-col overflow-hidden hover:border-cyan-700/50 transition-all duration-300 group relative">
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-800 m-2 group-hover:border-cyan-400 transition-colors pointer-events-none"></div>
                        
                        <div className="flex justify-between items-end mb-4 border-b border-cyan-900/50 pb-3">
                            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                                Directive: {launch.mission?.name || 'Classified'}
                            </h3>
                            <span className="text-[9px] font-mono text-cyan-300 uppercase bg-cyan-950/50 px-2 py-1 rounded-sm border border-cyan-800/50">
                                ORBIT: {launch.mission?.orbit?.name || 'UNK'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono line-clamp-6 group-hover:text-cyan-100 transition-colors">
                            {launch.mission?.description || 'No mission details available at this time.'}
                        </p>
                    </div>
                </div>

                <div className="w-[45%] h-full relative rounded-lg border border-cyan-900/60 overflow-hidden bg-[#020617] group cursor-crosshair shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
                    
                    <img 
                        src={imageUrl}
                        className="w-full h-full object-cover opacity-80 mix-blend-screen transition-all duration-[3000ms] group-hover:scale-105 group-hover:opacity-100"
                        alt="Launch Visual"
                    />
                    
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
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-cyan-900/50 flex justify-between items-center text-[9px] text-cyan-600 font-mono uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span>
                    SECURE SAT-LINK ACTIVE
                </span>
                <span>DATA TIMESTAMP: {launch.last_updated ? new Date(launch.last_updated).toLocaleString() : 'N/A'}</span>
            </div>
            
        </div>
    );
}