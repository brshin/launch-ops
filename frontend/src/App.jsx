import { useState, useEffect } from 'react';
import LaunchCard from './components/LaunchCard';

export default function App() {
  const [launches, setLaunches] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/launches')
      .then((res) => res.json())
      .then((data) => setLaunches(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-300 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <header className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-widest uppercase mb-2">
          Mission Control
        </h1>
        <p className="text-blue-400 font-mono text-sm uppercase tracking-widest">
          Live Telemetry & Upcoming Launch Manifest
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {launches.map((launch) => (
          <LaunchCard key={launch.apiId} launch={launch} />
        ))}
      </div>
    </div>
  );
}