import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { LaunchLocation } from "../types/location";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Launch-site catalog feed. REST hydrate + Socket.IO on `live-location-data`.
 * Same pipeline as launches; the worker refreshes locations on a slower cadence.
 */
export function useLocationFeed() {
  const [locations, setLocations] = useState<LaunchLocation[]>([]);
  const [locationsLive, setLocationsLive] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/locations`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLocations(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const socket = io(API_URL);

    const onConnect = () => setLocationsLive(true);
    const onDisconnect = () => setLocationsLive(false);

    setLocationsLive(socket.connected);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("live-location-data", (freshData: LaunchLocation[]) => {
      if (Array.isArray(freshData)) setLocations(freshData);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("live-location-data");
      socket.disconnect();
    };
  }, []);

  return { locations, locationsLive };
}
