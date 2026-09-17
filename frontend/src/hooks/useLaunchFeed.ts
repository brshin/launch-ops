import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Launch } from "../types/launch";
import { pickDefaultApiId } from "../utils/queueFocus";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Launch list + live uplink. Owns REST hydrate, Socket.IO, and sticky apiId.
 * Socket is created on mount (not at module load) and torn down on unmount.
 */
export function useLaunchFeed() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [feedLive, setFeedLive] = useState(false);

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
    const socket = io(API_URL);

    const onConnect = () => setFeedLive(true);
    const onDisconnect = () => setFeedLive(false);

    setFeedLive(socket.connected);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("live-launch-data", (freshData: Launch[]) => {
      console.log("🚀 Real-time telemetry received from server!", freshData);
      setLaunches(freshData);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("live-launch-data");
      socket.disconnect();
    };
  }, []);

  return { launches, selectedApiId, setSelectedApiId, feedLive };
}
