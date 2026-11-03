/**
 * Clamp a stepped queue index. Ends do not wrap — feels right for a mission list.
 */
export function stepQueueIndex(index: number, length: number, delta: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index + delta));
}

/** Skip arrow nav when the user is typing into a field. */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}
