import { useEffect } from "react";
import type { Launch } from "../types/launch";
import { isEditableKeyboardTarget, stepQueueIndex } from "../utils/queueNav";

/**
 * Arrow keys step the launch queue on any keyboard device.
 * ←/↑ previous, →/↓ next. Ignores editable fields and modifier chords.
 */
export function useLaunchKeyboardNav({
  launches,
  selectedIndex,
  focusIndex = -1,
  onSelect,
  enabled = true,
}: {
  launches: Launch[];
  /** -1 when console overview is open (no mission selected). */
  selectedIndex: number;
  /** Queue “next” row — used when entering from idle. */
  focusIndex?: number;
  onSelect: (apiId: string) => void;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled || launches.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableKeyboardTarget(event.target)) return;

      let delta = 0;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") delta = 1;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") delta = -1;
      else return;

      event.preventDefault();

      // Idle overview: first arrow opens the focus (or first) row.
      if (selectedIndex < 0) {
        const enter =
          focusIndex >= 0 && focusIndex < launches.length ? focusIndex : 0;
        const apiId = launches[enter]?.apiId;
        if (apiId) onSelect(apiId);
        return;
      }

      const next = stepQueueIndex(selectedIndex, launches.length, delta);
      if (next === selectedIndex) return;

      const apiId = launches[next]?.apiId;
      if (!apiId) return;
      onSelect(apiId);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, focusIndex, launches, onSelect, selectedIndex]);
}
