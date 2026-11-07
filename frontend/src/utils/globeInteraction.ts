/**
 * Shared drag flag for the globe canvas.
 * Hover tips read this so tips hide while the user is yawing by hand.
 * `suppressClick` stays true after a drag until the next press so marker
 * clicks don't fire when the user was spinning the globe.
 */
export const globeDrag = {
  active: false,
  suppressClick: false,
};
