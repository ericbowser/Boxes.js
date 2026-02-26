// ═══════════════════════════════════════════════════════════
// geometry.js — Pure math utilities
// Execute & Engrave LLC · Box Generator v3.1
// ═══════════════════════════════════════════════════════════

/**
 * Round to 3 decimal places (0.001mm precision)
 */
export function r(v) {
  return Math.round(v * 1000) / 1000;
}

/**
 * Direction vectors for clockwise panel traversal.
 * ax/ay = axis (travel direction), px/py = perpendicular (tab protrusion)
 */
export const DIR = {
  right: { ax: 1, ay: 0, px: 0, py: -1 },
  down:  { ax: 0, ay: 1, px: 1, py: 0  },
  left:  { ax: -1, ay: 0, px: 0, py: 1  },
  up:    { ax: 0, ay: -1, px: -1, py: 0 },
};

/**
 * Calculate finger count for a given edge length.
 * Always returns an odd number >= 3 for symmetry.
 */
export function calcFingerCount(length, desiredWidth) {
  let n = Math.max(3, Math.round(length / desiredWidth));
  if (n % 2 === 0) n += 1;
  return n;
}
