import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LaunchCard from './components/LaunchCard';
import { Starfield } from './components/Starfield';
import { ConsoleHeader, type SysClock } from './components/ConsoleHeader';
import { LaunchQueue } from './components/LaunchQueue';
import { io } from 'socket.io-client';
import { Launch } from "./types/launch";
import { findQueueFocusIndex, pickDefaultApiId } from "./utils/queueFocus";
import { transitions, travel } from "./lib/motionTokens";
import { useConsoleBoot } from "./hooks/useConsoleBoot";
import { useCompactMotion } from "./hooks/useCompactMotion";
import { useShortViewportBand } from "./hooks/useShortViewportBand";
import { useConsoleScrollbarActivity } from "./hooks/useConsoleScrollbarActivity";
import { formatLocalDate, formatLocalTime, getLocalUtcOffsetLabel } from "./utils/localTime";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const socket = io(API_URL);

export default function App() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [feedLive, setFeedLive] = useState(socket.connected);
  const [sysClock, setSysClock] = useState<SysClock | null>(null);

  const compactMotion = useCompactMotion();
  const shortBand = useShortViewportBand();
  useConsoleScrollbarActivity();
  const cardEnterY = compactMotion ? travel.compact.cardY : travel.desktop.cardY;

  const { bootComplete, isBooting } = useConsoleBoot(launches.length > 0);

  useEffect(() => {
    fetch(`${API_URL}/launches`)
      .then((res) => res.json())
      .then((data) => setLaunches(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (launches.length === 0) return;
    if (selectedApiId && launches.some((launch) => launch.apiId === selectedApiId)) {
      return;
    }
    setSelectedApiId(pickDefaultApiId(launches));
  }, [launches, selectedApiId]);

  useEffect(() => {
    const onConnect = () => setFeedLive(true);
    const onDisconnect = () => setFeedLive(false);

    setFeedLive(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('live-launch-data', (freshData) => {
      console.log('🚀 Real-time telemetry received from server!', freshData);
      setLaunches(freshData);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('live-launch-data');
    };
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setSysClock({
        date: formatLocalDate(now),
        time: formatLocalTime(now, { includeSeconds: true }),
        offset: getLocalUtcOffsetLabel(now),
        nowMs: now.getTime(),
      });
    };

    updateClock(); 
    const timer = setInterval(updateClock, 1000); 

    return () => clearInterval(timer); 
  }, []);

  const nowMs = sysClock?.nowMs ?? Date.now();
  const selectedIndex = useMemo(() => {
    if (!launches.length) return 0;
    const byId = launches.findIndex((launch) => launch.apiId === selectedApiId);
    if (byId >= 0) return byId;
    const focus = findQueueFocusIndex(launches, nowMs);
    return focus >= 0 ? focus : 0;
  }, [launches, selectedApiId, nowMs]);

  const activeLaunch = launches[selectedIndex];
  // Hold the detail card until boot settles so cold load feels staged
  const showLaunchCard = Boolean(activeLaunch && bootComplete);

  return (
    <div className="relative w-screen h-dvh overflow-hidden bg-[#020617] text-cyan-50 font-sans select-none flex cursor-default">
      
      <Starfield />

      {/* MAIN CONTENT WRAPPER — soft short bands via data-short + CSS / class maps */}
      <div
        data-short={shortBand}
        className={`console-inset relative z-10 flex flex-col w-full h-full min-h-0 density-ease${
          shortBand === "short" ? " console-short" : shortBand === "mid" ? " console-short-mid" : ""
        }`}
      >

        <ConsoleHeader sysClock={sysClock} shortBand={shortBand} />

        {/* PANELS WRAPPER */}
        <div
          className={`flex-1 flex flex-col lg:flex-row min-h-0 w-full relative z-10 density-ease ${
            shortBand === "short"
              ? "gap-1.5 lg:gap-8"
              : shortBand === "mid"
                ? "gap-2 sm:gap-3 md:gap-4 lg:gap-8"
                : "gap-3 sm:gap-4 md:gap-6 lg:gap-8"
          }`}
        >
          
          <LaunchQueue
            launches={launches}
            selectedIndex={selectedIndex}
            nowMs={nowMs}
            onSelect={setSelectedApiId}
            feedLive={feedLive}
            isBooting={isBooting}
            shortBand={shortBand}
            utcOffset={sysClock?.offset}
          />

          {/* RIGHT PANEL: Main Display */}
          <div className="flex-1 w-full lg:w-auto lg:h-full min-h-0 flex flex-col max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overscroll-y-contain console-scrollbar console-scrollbar-y">
            <AnimatePresence mode="wait">
              {showLaunchCard && activeLaunch ? (
                <motion.div
                  key={activeLaunch.apiId}
                  className="w-full flex flex-col max-lg:h-auto max-lg:shrink-0 lg:h-full lg:min-h-0"
                  initial={{ opacity: 0, y: cardEnterY }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -cardEnterY }}
                  transition={transitions.soft}
                >
                  <LaunchCard
                    launch={activeLaunch}
                    feedLive={feedLive}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="awaiting-telemetry"
                  className="w-full h-full flex flex-col items-center justify-center gap-4 border border-cyan-900/50 rounded-2xl bg-black/10 backdrop-blur-sm shadow-[0_0_35px_rgba(8,145,178,0.12)] px-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitions.soft}
                >
                  <motion.p
                    className="text-cyan-600 font-mono text-sm uppercase tracking-[0.3em] text-center"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Awaiting Telemetry Sync...
                  </motion.p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-700 text-center">
                    {feedLive
                      ? launches.length > 0
                        ? 'Telemetry locked · bringing systems online'
                        : 'Uplink live · hydrating queue'
                      : 'Arming live feed'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        
        </div>
        
      </div>
    </div>
  );
}
