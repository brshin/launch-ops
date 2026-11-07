import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Launch } from "../types/launch";
import {
  mergeConsoleUpdates,
  normalizeConsoleUpdate,
  type ConsoleUpdate,
} from "../utils/consoleUpdates";
import { pickDefaultApiId } from "../utils/queueFocus";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MAX_BOARD_UPDATES = 24;

type UseLaunchFeedOptions = {
  /**
   * When false, a null selection stays null (console overview / user closed the card).
   * Still recovers if a previously selected id leaves the feed.
   */
  allowAutoSelect?: boolean;
};

/**
 * Launch list + live uplink + server board-update log.
 * One Socket.IO connection owns `live-launch-data` and `live-launch-events`.
 */
export function useLaunchFeed(options: UseLaunchFeedOptions = {}) {
  const { allowAutoSelect = true } = options;
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [boardUpdates, setBoardUpdates] = useState<ConsoleUpdate[]>([]);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [feedLive, setFeedLive] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/launches`)
      .then((res) => res.json())
      .then((data) => setLaunches(data))
      .catch((err) => console.error(err));

    fetch(`${API_URL}/launches/updates?limit=${MAX_BOARD_UPDATES}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const hydrated = data
          .map(normalizeConsoleUpdate)
          .filter((row): row is ConsoleUpdate => row != null);
        setBoardUpdates(hydrated);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (launches.length === 0) return;
    if (selectedApiId && launches.some((launch) => launch.apiId === selectedApiId)) {
      return;
    }
    // Stale id left the queue — pick a replacement.
    if (selectedApiId) {
      setSelectedApiId(pickDefaultApiId(launches));
      return;
    }
    // Explicit idle (overview) — do not force a mission open.
    if (!allowAutoSelect) return;
    setSelectedApiId(pickDefaultApiId(launches));
  }, [launches, selectedApiId, allowAutoSelect]);

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
    socket.on("live-launch-events", (payload: unknown) => {
      const rows = Array.isArray(payload) ? payload : [];
      const incoming = rows
        .map(normalizeConsoleUpdate)
        .filter((row): row is ConsoleUpdate => row != null);
      if (incoming.length === 0) return;
      setBoardUpdates((prev) =>
        mergeConsoleUpdates(incoming, prev, MAX_BOARD_UPDATES),
      );
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("live-launch-data");
      socket.off("live-launch-events");
      socket.disconnect();
    };
  }, []);

  return {
    launches,
    boardUpdates,
    selectedApiId,
    setSelectedApiId,
    feedLive,
  };
}
