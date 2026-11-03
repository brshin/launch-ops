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
  onSelect,
  enabled = true,
}: {
  launches: Launch[];
  selectedIndex: number;
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

      const next = stepQueueIndex(selectedIndex, launches.length, delta);
      event.preventDefault();
      if (next === selectedIndex) return;

      const apiId = launches[next]?.apiId;
      if (!apiId) return;
      onSelect(apiId);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, launches, onSelect, selectedIndex]);
}
