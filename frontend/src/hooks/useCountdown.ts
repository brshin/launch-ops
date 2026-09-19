import { useEffect, useState } from "react";

export type CountdownParts = {
  difference: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calculateTimeLeft(net: string): CountdownParts {
  const target = new Date(net).getTime();
  const now = new Date().getTime();
  const difference = target - now;

  const absDiff = Math.abs(difference);

  return {
    difference,
    days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((absDiff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((absDiff / 1000 / 60) % 60),
    seconds: Math.floor((absDiff / 1000) % 60),
  };
}

/**
 * Card 1s T−/T+ tick. Belongs to LaunchCard — Identity only displays the parts.
 */
export function useCountdown(net: string): CountdownParts {
  const [time, setTime] = useState(() => calculateTimeLeft(net));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTimeLeft(net));
    }, 1000);

    return () => clearInterval(timer);
  }, [net]);

  return time;
}
