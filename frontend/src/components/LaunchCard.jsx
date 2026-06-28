import { useState } from 'react';

export default function LaunchCard({ launch }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="flex flex-col bg-neutral-900 border border-white/10 rounded-lg overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/30">

                <div className="relative h-48 w-full bg-black">
                    <img 
                        src={launch.image.image_url}
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-xs font-mono text-white uppercase tracking-wider">
                        <p>Status: {launch.status.abbrev}</p>
                    </div>
                </div>

                {/* Overview Section */}
                <div className="p-6 flex-grow flex flex-col">
                    <div className="mb-4">
                        <p className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">
                            {launch.launch_service_provider.name}
                        </p>
                        <h2 className="text-xl font-bold text-white leading-tight uppercase tracking-wide">
                            {launch.name}
                        </h2>
                    </div>

                    <div className="flex-grow">
                        <p className="text-sm text-slate-400 font-mono bg-black/40 p-3 rounded border border-white/5 mb-6 inline-block w-full">
                            <span className="text-slate-500 mr-2">T-ZERO:</span> 
                            <span className="text-white">
                                {new Date(launch.net).toLocaleString("en-US", {
                                    month: "short", day: "numeric", year: "numeric",
                                    hour: "2-digit", minute: "2-digit", timeZoneName: "short"
                                })}
                            </span>
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono text-white uppercase tracking-widest transition-colors"
                    >
                        {isExpanded ? 'Close' : 'More'}
                    </button>
                </div>
                


            {/* Expanded Section */}
            {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-white/10 bg-black/50">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <h3 className="text-xs text-slate-500 uppercase font-mono mb-1">Launch Pad</h3>
                            <p className="text-sm text-white">{launch.pad.name}</p>
                        </div>
                        <div>
                            <h3 className="text-xs text-slate-500 uppercase font-mono mb-1">Window</h3>
                            <p className="text-sm text-white break-words">
                                {launch.window_start ? new Date(launch.window_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA'} - 
                                {launch.window_end ? new Date(launch.window_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-neutral-800 border border-white/5 p-4 rounded mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                                Mission: {launch.mission?.name || 'Classified'}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 border border-slate-600 px-2 py-0.5 rounded">
                                {launch.mission?.orbit?.name || 'UNK ORBIT'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {launch.mission?.description || 'No mission details available at this time.'}
                        </p>
                    </div>

                    <p className="text-[10px] text-slate-600 font-mono text-right uppercase">
                    Last Updated: {launch.last_updated ? new Date(launch.last_updated).toLocaleString() : 'N/A'}
                    </p>
                </div>
            )}
        </div>
    );
}

/*
    apiId: launch.id,
    //name: launch.name,
    //status: launch.status,
    //last_updated: launch.last_updated,
    //net: launch.net,
    net_precision: launch.net_precision,
    //window_start: launch.window_start,
    //window_end: launch.window_end,
    //image: launch.image,
    //launch_service_provider: launch.launch_service_provider,
    //rocket: launch.rocket,
    //mission: launch.mission,
    pad: launch.pad
*/