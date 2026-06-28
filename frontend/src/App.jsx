import { useState, useEffect } from 'react';
import LaunchCard from './components/LaunchCard';

const starfield = Array.from({ length: 250 }).map(() => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5, // Varying star sizes
  opacity: Math.random() * 0.8 + 0.2,
  animationDelay: `${Math.random() * 5}s`,
  animationDuration: `${Math.random() * 3 + 2}s`
}));

export default function App() {
  const [launches, setLaunches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3000/launches')
      .then((res) => res.json())
      .then((data) => setLaunches(data))
      .catch((err) => console.error(err));
  }, []);

  const activeLaunch = launches[selectedIndex];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020617] text-cyan-50 font-sans select-none flex cursor-default">
      
      {/* Space Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#020617] to-[#020617]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-cyan-600/5 blur-[150px] animate-[pulse_6s_ease-in-out_infinite]"></div>
        
        <div className="absolute w-[150vw] h-[150vw] animate-[spin_240s_linear_infinite]">
          {starfield.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-100 animate-pulse"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDelay: star.animationDelay,
                animationDuration: star.animationDuration,
                boxShadow: star.size > 1.5 ? '0 0 6px 1px rgba(34,211,238,0.6)' : 'none'
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b215_1px,transparent_1px),linear-gradient(to_bottom,#0891b215_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_40%,transparent_100%)] opacity-50"></div>
      </div>

      <div className="relative z-10 flex w-full h-full p-8 md:p-12 gap-8">
        
        {/* Left Panel */}
        <div className="w-[320px] h-full flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/50 rounded-2xl shadow-[0_0_30px_rgba(8,145,178,0.05)] overflow-hidden">
          
          <div className="p-4 border-b border-cyan-800/50 bg-black/30 flex justify-between items-center shadow-lg z-20">
            <h2 className="text-cyan-400 font-mono tracking-[0.25em] text-xs uppercase flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_#22d3ee]"></span>
              </span>
              Telemetry Manifest
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 gap-2 flex flex-col relative z-10 custom-scrollbar">
            {launches.map((launch, index) => (
              <button
                key={launch.apiId || index}
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 flex flex-col relative overflow-hidden group hover:translate-x-1 cursor-pointer ${
                  selectedIndex === index 
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)]' 
                    : 'bg-black/20 border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-700/50'
                }`}
              >
                {selectedIndex === index && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                
                <span className="text-[10px] font-mono text-cyan-500 mb-1 tracking-widest group-hover:text-cyan-300 transition-colors">
                  {new Date(launch.net).toLocaleDateString()}
                </span>
                <span className={`font-mono text-xs uppercase tracking-widest truncate transition-colors ${selectedIndex === index ? 'text-cyan-100 font-bold' : 'text-slate-400 group-hover:text-cyan-50'}`}>
                  {launch.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 h-full">
          {activeLaunch ? (
            <LaunchCard key={activeLaunch.apiId} launch={activeLaunch} />
          ) : (
             <div className="w-full h-full flex items-center justify-center border border-cyan-900/50 rounded-2xl bg-black/10 backdrop-blur-sm text-cyan-600 font-mono text-sm uppercase tracking-[0.3em] animate-pulse">
               Awaiting Telemetry Sync...
             </div>
          )}
        </div>
      </div>
    </div>
  );
}