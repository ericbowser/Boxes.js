// ═══════════════════════════════════════════════════════════
// edgeTypes.js — Edge path & hole generators
// Execute & Engrave LLC · Box Generator v3.1
//
// Pure functions, no UI dependencies.
// Edge types: F (finger joint), h (finger holes),
//             s (stackable/flush), e (straight/open)
// ═══════════════════════════════════════════════════════════

import { r, DIR, calcFingerCount } from "./geometry";

// ── Constants ──────────────────────────────────────────────

/** Clockwise edge traversal order */
export const EDGE_NAMES = ["top", "right", "bottom", "left"];
export const EDGE_DIRS  = ["right", "down", "left", "up"];

/** Edge type options for UI dropdowns */
export const EDGE_OPTIONS = [
  { value: "F", label: "F — Finger Joint" },
  { value: "h", label: "h — Finger Joint Holes" },
  { value: "s", label: "s — Stackable (flush)" },
  { value: "e", label: "e — Straight / Open" },
];

// ── Finger Edge Path (F type) ──────────────────────────────
// Generates tab/slot perimeter with surrounding flat margins.
//
// surroundingSpaces: flat margin at start/end, in multiples
// of finger width. Matches Boxes.py "surroundingspaces" param.

/**
 * @param {Object} opts
 * @param {number} opts.cx - Current X position
 * @param {number} opts.cy - Current Y position
 * @param {number} opts.length - Edge length in mm
 * @param {string} opts.dir - Direction: right|down|left|up
 * @param {number} opts.fingerWidth - Desired finger width in mm
 * @param {number} opts.thickness - Material thickness in mm
 * @param {boolean} opts.isTabs - true=tabs protrude, false=slots recede
 * @param {number} opts.surroundingSpaces - Flat margin multiplier
 * @returns {{ path: string, cx: number, cy: number }}
 */
export function fingerEdgePath({
  cx, cy, length, dir, fingerWidth, thickness, isTabs, surroundingSpaces,
}) {
  const { ax, ay, px, py } = DIR[dir];

  // Base finger size determines surrounding space width
  const nBase = calcFingerCount(length, fingerWidth);
  const baseFW = length / nBase;
  const surSpace = surroundingSpaces * baseFW;

  // Recalculate fingers for usable area
  const usable = length - 2 * surSpace;
  const nInner = Math.max(1, calcFingerCount(usable, fingerWidth));
  const innerFW = usable / nInner;

  let path = "";

  // Leading flat margin
  if (surSpace > 0.01) {
    cx += ax * surSpace;
    cy += ay * surSpace;
    path += `L ${r(cx)} ${r(cy)} `;
  }

  // Finger joints
  for (let i = 0; i < nInner; i++) {
    const isTab = isTabs ? (i % 2 === 0) : (i % 2 === 1);
    if (isTab) {
      cx += px * thickness; cy += py * thickness;
      path += `L ${r(cx)} ${r(cy)} `;
      cx += ax * innerFW; cy += ay * innerFW;
      path += `L ${r(cx)} ${r(cy)} `;
      cx -= px * thickness; cy -= py * thickness;
      path += `L ${r(cx)} ${r(cy)} `;
    } else {
      cx += ax * innerFW; cy += ay * innerFW;
      path += `L ${r(cx)} ${r(cy)} `;
    }
  }

  // Trailing flat margin
  if (surSpace > 0.01) {
    cx += ax * surSpace;
    cy += ay * surSpace;
    path += `L ${r(cx)} ${r(cy)} `;
  }

  return { path, cx, cy };
}

// ── Straight Edge Path (e/h/s perimeter) ───────────────────

/**
 * @returns {{ path: string, cx: number, cy: number }}
 */
export function straightEdgePath({ cx, cy, length, dir }) {
  const { ax, ay } = DIR[dir];
  cx += ax * length;
  cy += ay * length;
  return { path: `L ${r(cx)} ${r(cy)} `, cx, cy };
}

// ── Finger Joint Holes (h/s types) ─────────────────────────
// Rectangular cutouts in panel face, aligned with finger positions.
// Uses identical spacing math as fingerEdgePath for alignment.

/**
 * @param {Object} opts
 * @param {number} opts.panelX - Panel origin X
 * @param {number} opts.panelY - Panel origin Y
 * @param {number} opts.panelW - Panel width
 * @param {number} opts.panelH - Panel height
 * @param {string} opts.edge - Which edge: top|right|bottom|left
 * @param {number} opts.edgeLength - Length of this edge
 * @param {number} opts.fingerWidth - Desired finger width
 * @param {number} opts.thickness - Material thickness
 * @param {boolean} opts.stackable - If true, holes flush to panel edge
 * @param {number} opts.edgeWidth - Distance from edge to holes (×thickness)
 * @param {number} opts.surroundingSpaces - Flat margin multiplier
 * @returns {Array<{x: number, y: number, w: number, h: number}>}
 */
export function generateEdgeHoles({
  panelX, panelY, panelW, panelH,
  edge, edgeLength, fingerWidth, thickness,
  stackable, edgeWidth, surroundingSpaces,
}) {
  // Mirror fingerEdgePath spacing math
  const nBase = calcFingerCount(edgeLength, fingerWidth);
  const baseFW = edgeLength / nBase;
  const surSpace = surroundingSpaces * baseFW;
  const usable = edgeLength - 2 * surSpace;
  const n = Math.max(1, calcFingerCount(usable, fingerWidth));
  const fw = usable / n;

  const holes = [];
  const holeDepth = thickness;
  const edgeOffset = edgeWidth * thickness;

  for (let i = 0; i < n; i++) {
    if (i % 2 !== 0) continue;

    const pos = surSpace + i * fw;
    let hx, hy, hw, hh;

    switch (edge) {
      case "bottom":
        hx = panelX + pos;
        hy = stackable
          ? panelY + panelH - holeDepth
          : panelY + panelH - edgeOffset - holeDepth;
        hw = fw; hh = holeDepth;
        break;
      case "top":
        hx = panelX + pos;
        hy = stackable ? panelY : panelY + edgeOffset;
        hw = fw; hh = holeDepth;
        break;
      case "left":
        hx = stackable ? panelX : panelX + edgeOffset;
        hy = panelY + pos;
        hw = holeDepth; hh = fw;
        break;
      case "right":
        hx = stackable
          ? panelX + panelW - holeDepth
          : panelX + panelW - edgeOffset - holeDepth;
        hy = panelY + pos;
        hw = holeDepth; hh = fw;
        break;
    }
    holes.push({ x: r(hx), y: r(hy), w: r(hw), h: r(hh) });
  }
  return holes;
}

/**
 * Resolve edge type string to internal representation.
 * F becomes F-tabs (primary) or F-slots (secondary).
 * h/s/e pass through unchanged.
 */
export function resolveEdgeType(edgeType, isPrimary) {
  if (edgeType === "F") return isPrimary ? "F-tabs" : "F-slots";
  return edgeType;
}
