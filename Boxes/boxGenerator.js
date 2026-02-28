// ═══════════════════════════════════════════════════════════
// boxGenerator.js — Box layout orchestration & SVG export
// Execute & Engrave LLC · Box Generator v3.1
// ═══════════════════════════════════════════════════════════

import { r } from "./geometry";
import { resolveEdgeType } from "./edgeTypes";
import { generatePanel } from "./panelGenerator";

/**
 * Generate all panels for a finger-joint box.
 *
 * Layout: cross pattern
 *              [Top]
 *   [Left] [Front] [Right] [Back]
 *             [Bottom]
 *
 * Panel sizing (outside dimensions W × D × H):
 *   Front/Back:  W × H (full width, tabs on all edges)
 *   Left/Right:  (D-2T) × H (fit between front/back)
 *   Top/Bottom:  W × (D-2T) for ALL types (F-slots for F, F-tabs for h/s)
 *
 * @param {Object} params
 * @returns {{ panels: Array, bounds: { width: number, height: number } }}
 */
export function generateBox(params) {
  const {
    width: W, height: H, depth: D, thickness: T, fingerWidth: FW,
    bottomEdge, topEdge, edgeWidth: EW, surroundingSpaces: SS,
    play: PLAY = 0,
  } = params;

  const PAD = 12;
  const sideW = D - 2 * T;
  const panels = [];

  // Shared params for all generatePanel calls
  const gp = {
    fingerWidth: FW,
    thickness: T,
    edgeWidth: EW,
    surroundingSpaces: SS,
    play: PLAY,
  };

  const hasTop = topEdge !== "e";
  const hasBottom = bottomEdge !== "e";
  const capD = sideW;

  // Layout positions
  const frontX = sideW + PAD;
  const frontY = hasTop ? capD + PAD : 0;
  const backX = frontX + W + sideW + PAD * 2;
  const rightX = frontX + W + PAD;

  // ── Front ──
  panels.push({
    id: "front", label: "Front", color: "#e74c3c",
    x: frontX, y: frontY, w: W, h: H,
    ...generatePanel({
      x: frontX, y: frontY, w: W, h: H, ...gp,
      edges: {
        top: resolveEdgeType(topEdge, true),
        right: "F-tabs",
        bottom: resolveEdgeType(bottomEdge, true),
        left: "F-tabs",
      },
    }),
  });

  // ── Back ──
  panels.push({
    id: "back", label: "Back", color: "#3498db",
    x: backX, y: frontY, w: W, h: H,
    ...generatePanel({
      x: backX, y: frontY, w: W, h: H, ...gp,
      edges: {
        top: resolveEdgeType(topEdge, true),
        right: "F-tabs",
        bottom: resolveEdgeType(bottomEdge, true),
        left: "F-tabs",
      },
    }),
  });

  // ── Left ──
  panels.push({
    id: "left", label: "Left", color: "#2ecc71",
    x: 0, y: frontY, w: sideW, h: H,
    ...generatePanel({
      x: 0, y: frontY, w: sideW, h: H, ...gp,
      edges: {
        top: resolveEdgeType(topEdge, false),
        right: "F-slots",
        bottom: resolveEdgeType(bottomEdge, false),
        left: "F-slots",
      },
    }),
  });

  // ── Right ──
  panels.push({
    id: "right", label: "Right", color: "#f39c12",
    x: rightX, y: frontY, w: sideW, h: H,
    ...generatePanel({
      x: rightX, y: frontY, w: sideW, h: H, ...gp,
      edges: {
        top: resolveEdgeType(topEdge, false),
        right: "F-slots",
        bottom: resolveEdgeType(bottomEdge, false),
        left: "F-slots",
      },
    }),
  });

  // ── Top ──
  if (hasTop) {
    if (topEdge === "F") {
      panels.push({
        id: "top", label: "Top", color: "#9b59b6",
        x: frontX, y: 0, w: W, h: capD,
        ...generatePanel({
          x: frontX, y: 0, w: W, h: capD, ...gp,
          edges: { top: "F-slots", right: "F-slots", bottom: "F-slots", left: "F-slots" },
        }),
      });
    } else {
      // h/s: cap panel has tabs that slide into holes in side panels
      panels.push({
        id: "top", label: "Top", color: "#9b59b6",
        x: frontX, y: 0, w: W, h: capD,
        ...generatePanel({
          x: frontX, y: 0, w: W, h: capD, ...gp,
          edges: { top: "F-tabs", right: "F-tabs", bottom: "F-tabs", left: "F-tabs" },
        }),
      });
    }
  }

  // ── Bottom ──
  if (hasBottom) {
    const bottomY = frontY + H + PAD;
    if (bottomEdge === "F") {
      panels.push({
        id: "bottom", label: "Bottom", color: "#1abc9c",
        x: frontX, y: bottomY, w: W, h: capD,
        ...generatePanel({
          x: frontX, y: bottomY, w: W, h: capD, ...gp,
          edges: { top: "F-slots", right: "F-slots", bottom: "F-slots", left: "F-slots" },
        }),
      });
    } else {
      // h/s: cap panel has tabs that slide into holes in side panels
      panels.push({
        id: "bottom", label: "Bottom", color: "#1abc9c",
        x: frontX, y: bottomY, w: W, h: capD,
        ...generatePanel({
          x: frontX, y: bottomY, w: W, h: capD, ...gp,
          edges: { top: "F-tabs", right: "F-tabs", bottom: "F-tabs", left: "F-tabs" },
        }),
      });
    }
  }

  // Calculate bounding box
  let maxX = 0, maxY = 0;
  for (const p of panels) {
    maxX = Math.max(maxX, p.x + p.w + T + 5);
    maxY = Math.max(maxY, p.y + p.h + T + 5);
  }

  return { panels, bounds: { width: maxX, height: maxY } };
}

/**
 * Export box data as laser-ready SVG string.
 * Uses 0.1mm stroke width (standard for laser cut lines).
 *
 * @param {{ panels: Array, bounds: Object }} boxData
 * @param {Object} params - Original parameters for metadata
 * @returns {string} SVG markup
 */
export function exportSVG(boxData, params) {
  const { panels, bounds } = boxData;
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    `  width="${r(bounds.width)}mm" height="${r(bounds.height)}mm"`,
    `  viewBox="0 0 ${r(bounds.width)} ${r(bounds.height)}">`,
    `<title>Box ${params.width}x${params.depth}x${params.height}mm — T${params.thickness}mm</title>`,
    `<!-- Generated by Execute & Engrave Box Generator v3.1 -->`,
    `<!-- Material: ${params.thickness}mm, Kerf: ${params.kerf}mm, Play: ${params.play || 0}mm -->`,
  ];

  for (const p of panels) {
    lines.push(
      `  <path d="${p.outline}" fill="none" stroke="#000" stroke-width="0.1" id="${p.id}" />`
    );
    if (p.holes.length > 0) {
      const holePaths = p.holes
        .map(h =>
          `M ${h.x} ${h.y} L ${r(h.x + h.w)} ${h.y} L ${r(h.x + h.w)} ${r(h.y + h.h)} L ${h.x} ${r(h.y + h.h)} Z`
        )
        .join(" ");
      lines.push(
        `  <path d="${holePaths}" fill="none" stroke="#000" stroke-width="0.1" id="${p.id}-holes" />`
      );
    }
  }

  lines.push("</svg>");
  return lines.join("\n");
}
