import React, { useState, useEffect } from 'react';
import LaunchCard from './components/LaunchCard';
import { io } from 'socket.io-client';
import { Launch } from "./types/launch";

const socket = io('http://localhost:3000');

const starfield = Array.from({ length: 250 }).map(() => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5, // Varying star sizes
  opacity: Math.random() * 0.8 + 0.2,
  animationDelay: `${Math.random() * 5}s`,
  animationDuration: `${Math.random() * 3 + 2}s`
}));

export default function App() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3000/launches')
      .then((res) => res.json())
      .then((data) => setLaunches(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    // WebSocket
    socket.on('live-launch-data', (freshData) => {
      console.log('🚀 Real-time telemetry received from server!', freshData);

      setLaunches(freshData);
    });

    return () => {
      socket.off('live-launch-data');
    };
    
  }, []);

  const activeLaunch = launches[selectedIndex];

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -new Date().getTimezoneOffset() / 60;

  const timeInfo =
  `${Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_', ' ')} (UTC${-new Date().getTimezoneOffset() / 60 >= 0 ? '+' : ''}${-new Date().getTimezoneOffset() / 60})`;


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

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative z-10 flex flex-col w-full h-full p-6 md:p-10">

        {/* TOP NAVIGATION / HEADER */}
        <header className="w-full flex justify-between items-end mb-6 border-b border-cyan-900/60 pb-4 relative z-20">
          
          {/* Left Side: Brand & Subtitle */}
          <div className="flex flex-col cursor-default">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              Launch<span className="text-cyan-500">Ops</span>
            </h1>
            <p className="text-[10px] md:text-xs font-mono text-cyan-400 uppercase tracking-[0.4em] mt-1 opacity-80">
              Global Launch Tracking Network
            </p>
          </div>

          {/* Right Side: Local Time / System Status */}
          <div className="hidden sm:flex items-center gap-3 bg-black/20 border border-cyan-800/50 px-4 py-2 rounded-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>
            </span>
            <p className="text-[10px] md:text-xs font-mono text-cyan-300 uppercase tracking-widest">
              SYS TIME: {timeInfo}
            </p>
          </div>
          
        </header>

        {/* PANELS WRAPPER */}
        <div className="flex-1 flex gap-8 min-h-0 w-full relative z-10">
          
          {/* LEFT PANEL: The Manifest */}
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
            
            <div className="flex-1 overflow-y-auto p-3 gap-2 flex flex-col relative z-10 
  [&::-webkit-scrollbar]:w-1.5 
  [&::-webkit-scrollbar-track]:bg-black/20 
  [&::-webkit-scrollbar-track]:border-l 
  [&::-webkit-scrollbar-track]:border-cyan-900/30 
  [&::-webkit-scrollbar-thumb]:bg-cyan-800/80 
  [&::-webkit-scrollbar-thumb]:rounded-sm 
  hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500 
  hover:[&::-webkit-scrollbar-thumb]:shadow-[0_0_10px_#22d3ee]">
              {launches.map((launch, index) => (
                <button
                  key={launch.apiId || index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full shrink-0 text-left py-2.5 px-3 md:py-3 md:px-4 rounded-lg border transition-all duration-300 flex flex-col relative overflow-hidden group hover:translate-x-1 cursor-pointer ${
                    selectedIndex === index 
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)]' 
                      : 'bg-black/20 border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-700/50'
                  }`}
                >
                  {selectedIndex === index && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                  
                  <div className="flex justify-between items-center mb-1 w-full">
                    
                    <span className="text-[9px] md:text-[10px] leading-tight font-mono text-cyan-500 tracking-widest group-hover:text-cyan-300 transition-colors">
                      {new Date(launch.net).toLocaleDateString()}
                    </span>

                    <span className="text-[8px] md:text-[9px] leading-tight font-mono text-cyan-700 tracking-widest group-hover:text-cyan-400 transition-colors">
                      {new Date(launch.net).toLocaleTimeString([], { 
                        hour: "2-digit", 
                        minute: "2-digit",
                        hour12: false
                      })}
                    </span>

                  </div>

                  <span className={`block w-full font-mono text-[11px] md:text-xs leading-tight uppercase tracking-widest truncate transition-colors ${selectedIndex === index ? 'text-cyan-100 font-bold' : 'text-slate-400 group-hover:text-cyan-50'}`}>
                    {launch.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: Main Display */}
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
    </div>
  );
}