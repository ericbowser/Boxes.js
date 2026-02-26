// ═══════════════════════════════════════════════════════════
// index.js — Box Generator barrel export
// Execute & Engrave LLC
//
// Usage:
//   import BoxGeneratorApp from "./boxGenerator";
//   import { generateBox, exportSVG } from "./boxGenerator";
//   import { fingerEdgePath, EDGE_OPTIONS } from "./boxGenerator";
// ═══════════════════════════════════════════════════════════

// Page component
export { default } from "./BoxGeneratorApp";

// Geometry primitives
export { r, DIR, calcFingerCount } from "./geometry";

// Edge type generators & constants
export {
  EDGE_NAMES,
  EDGE_DIRS,
  EDGE_OPTIONS,
  fingerEdgePath,
  straightEdgePath,
  generateEdgeHoles,
  resolveEdgeType,
} from "./edgeTypes";

// Panel composition
export { generatePanel } from "./panelGenerator";

// Box orchestration & export
export { generateBox, exportSVG } from "./boxGenerator";
