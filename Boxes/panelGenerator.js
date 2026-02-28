// ═══════════════════════════════════════════════════════════
// panelGenerator.js — Compose edges into closed panel paths
// Execute & Engrave LLC · Box Generator v3.1
// ═══════════════════════════════════════════════════════════

import { r } from "./geometry";
import {
  EDGE_NAMES,
  EDGE_DIRS,
  fingerEdgePath,
  straightEdgePath,
  generateEdgeHoles,
} from "./edgeTypes";

/**
 * Generate a single panel outline + interior holes.
 *
 * Traverses four edges clockwise (top → right → bottom → left),
 * applying finger joints or straight edges as specified.
 *
 * @param {Object} opts
 * @param {number} opts.x - Panel origin X
 * @param {number} opts.y - Panel origin Y
 * @param {number} opts.w - Panel width (mm)
 * @param {number} opts.h - Panel height (mm)
 * @param {Object} opts.edges - Edge types: { top, right, bottom, left }
 *   Values: "F-tabs" | "F-slots" | "h" | "s" | "e"
 * @param {number} opts.fingerWidth - Desired finger width (mm)
 * @param {number} opts.thickness - Material thickness (mm)
 * @param {number} opts.edgeWidth - Hole inset distance (×thickness)
 * @param {number} opts.surroundingSpaces - Flat margin multiplier
 * @param {number} [opts.play=0] - Joint clearance offset (mm)
 * @returns {{ outline: string, holes: Array }}
 */
export function generatePanel({
  x, y, w, h, edges,
  fingerWidth, thickness, edgeWidth, surroundingSpaces,
  play = 0,
}) {
  let cx = x, cy = y;
  let outline = `M ${r(cx)} ${r(cy)} `;
  const allHoles = [];
  const lengths = { top: w, right: h, bottom: w, left: h };

  for (let i = 0; i < 4; i++) {
    const edgeName = EDGE_NAMES[i];
    const dir = EDGE_DIRS[i];
    const len = lengths[edgeName];
    const et = edges[edgeName];
    let res;

    if (et === "F-tabs" || et === "F-slots") {
      res = fingerEdgePath({
        cx, cy, length: len, dir,
        fingerWidth, thickness,
        isTabs: et === "F-tabs",
        surroundingSpaces, play,
      });
    } else {
      res = straightEdgePath({ cx, cy, length: len, dir });
    }

    outline += res.path;
    cx = res.cx;
    cy = res.cy;

    // Generate interior holes for h/s edge types
    if (et === "h" || et === "s") {
      allHoles.push(
        ...generateEdgeHoles({
          panelX: x, panelY: y, panelW: w, panelH: h,
          edge: edgeName, edgeLength: len,
          fingerWidth, thickness,
          stackable: et === "s",
          edgeWidth, surroundingSpaces, play,
        })
      );
    }
  }

  outline += "Z";
  return { outline, holes: allHoles };
}
