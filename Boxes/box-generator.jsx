import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// GEOMETRY ENGINE — Box Generator v3.1
// Execute & Engrave LLC
// Features: F/h/s/e edge types, surrounding spaces, edge width
// ═══════════════════════════════════════════════════════════

function r(v) { return Math.round(v * 1000) / 1000; }

const DIR = {
  right: { ax: 1, ay: 0, px: 0, py: -1 },
  down:  { ax: 0, ay: 1, px: 1, py: 0  },
  left:  { ax: -1, ay: 0, px: 0, py: 1  },
  up:    { ax: 0, ay: -1, px: -1, py: 0 },
};

function calcFingerCount(length, desiredWidth) {
  let n = Math.max(3, Math.round(length / desiredWidth));
  if (n % 2 === 0) n += 1;
  return n;
}

// ── Finger Edge Path (F type) ──────────────────────────────

function fingerEdgePath({ cx, cy, length, dir, fingerWidth, thickness, isTabs, surroundingSpaces }) {
  const { ax, ay, px, py } = DIR[dir];

  const nBase = calcFingerCount(length, fingerWidth);
  const baseFW = length / nBase;
  const surSpace = surroundingSpaces * baseFW;
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

// ── Straight Edge Path ─────────────────────────────────────

function straightEdgePath({ cx, cy, length, dir }) {
  const { ax, ay } = DIR[dir];
  cx += ax * length; cy += ay * length;
  return { path: `L ${r(cx)} ${r(cy)} `, cx, cy };
}

// ── Finger Joint Holes (h/s types) ─────────────────────────

function generateEdgeHoles({ panelX, panelY, panelW, panelH, edge, edgeLength, fingerWidth, thickness, stackable, edgeWidth, surroundingSpaces }) {
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
        hy = stackable ? panelY + panelH - holeDepth : panelY + panelH - edgeOffset - holeDepth;
        hw = fw; hh = holeDepth; break;
      case "top":
        hx = panelX + pos;
        hy = stackable ? panelY : panelY + edgeOffset;
        hw = fw; hh = holeDepth; break;
      case "left":
        hx = stackable ? panelX : panelX + edgeOffset;
        hy = panelY + pos;
        hw = holeDepth; hh = fw; break;
      case "right":
        hx = stackable ? panelX + panelW - holeDepth : panelX + panelW - edgeOffset - holeDepth;
        hy = panelY + pos;
        hw = holeDepth; hh = fw; break;
    }
    holes.push({ x: r(hx), y: r(hy), w: r(hw), h: r(hh) });
  }
  return holes;
}

// ── Panel Generator ────────────────────────────────────────

const EDGE_NAMES = ["top", "right", "bottom", "left"];
const EDGE_DIRS  = ["right", "down", "left", "up"];

function generatePanel({ x, y, w, h, edges, fingerWidth, thickness, edgeWidth, surroundingSpaces }) {
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
      res = fingerEdgePath({ cx, cy, length: len, dir, fingerWidth, thickness, isTabs: et === "F-tabs", surroundingSpaces });
    } else {
      res = straightEdgePath({ cx, cy, length: len, dir });
    }
    outline += res.path;
    cx = res.cx; cy = res.cy;

    if (et === "h" || et === "s") {
      allHoles.push(...generateEdgeHoles({
        panelX: x, panelY: y, panelW: w, panelH: h,
        edge: edgeName, edgeLength: len, fingerWidth, thickness,
        stackable: et === "s", edgeWidth, surroundingSpaces,
      }));
    }
  }

  outline += "Z";
  return { outline, holes: allHoles };
}

// ── Box Generator ──────────────────────────────────────────

function generateBox(params) {
  const {
    width: W, height: H, depth: D, thickness: T, fingerWidth: FW,
    bottomEdge, topEdge, edgeWidth: EW, surroundingSpaces: SS,
  } = params;
  const PAD = 12;
  const sideW = D - 2 * T;
  const panels = [];
  const gp = { fingerWidth: FW, thickness: T, edgeWidth: EW, surroundingSpaces: SS };

  function resolve(edgeType, isPrimary) {
    if (edgeType === "F") return isPrimary ? "F-tabs" : "F-slots";
    return edgeType;
  }

  const hasTop = topEdge !== "e";
  const hasBottom = bottomEdge !== "e";
  const capD = sideW;
  const frontX = sideW + PAD;
  const frontY = hasTop ? capD + PAD : 0;
  const backX = frontX + W + sideW + PAD * 2;
  const rightX = frontX + W + PAD;

  // Front
  panels.push({ id: "front", label: "Front", color: "#e74c3c", x: frontX, y: frontY, w: W, h: H,
    ...generatePanel({ x: frontX, y: frontY, w: W, h: H, ...gp,
      edges: { top: resolve(topEdge, true), right: "F-tabs", bottom: resolve(bottomEdge, true), left: "F-tabs" },
    }),
  });

  // Back
  panels.push({ id: "back", label: "Back", color: "#3498db", x: backX, y: frontY, w: W, h: H,
    ...generatePanel({ x: backX, y: frontY, w: W, h: H, ...gp,
      edges: { top: resolve(topEdge, true), right: "F-tabs", bottom: resolve(bottomEdge, true), left: "F-tabs" },
    }),
  });

  // Left
  panels.push({ id: "left", label: "Left", color: "#2ecc71", x: 0, y: frontY, w: sideW, h: H,
    ...generatePanel({ x: 0, y: frontY, w: sideW, h: H, ...gp,
      edges: { top: resolve(topEdge, false), right: "F-slots", bottom: resolve(bottomEdge, false), left: "F-slots" },
    }),
  });

  // Right
  panels.push({ id: "right", label: "Right", color: "#f39c12", x: rightX, y: frontY, w: sideW, h: H,
    ...generatePanel({ x: rightX, y: frontY, w: sideW, h: H, ...gp,
      edges: { top: resolve(topEdge, false), right: "F-slots", bottom: resolve(bottomEdge, false), left: "F-slots" },
    }),
  });

  // Top
  if (hasTop) {
    if (topEdge === "F") {
      panels.push({ id: "top", label: "Top", color: "#9b59b6", x: frontX, y: 0, w: W, h: capD,
        ...generatePanel({ x: frontX, y: 0, w: W, h: capD, ...gp,
          edges: { top: "F-slots", right: "F-slots", bottom: "F-slots", left: "F-slots" },
        }),
      });
    } else {
      panels.push({ id: "top", label: "Top", color: "#9b59b6", x: frontX, y: 0, w: W, h: capD,
        ...generatePanel({ x: frontX, y: 0, w: W, h: capD, ...gp,
          edges: { top: "F-tabs", right: "F-tabs", bottom: "F-tabs", left: "F-tabs" },
        }),
      });
    }
  }

  // Bottom
  if (hasBottom) {
    const bottomY = frontY + H + PAD;
    if (bottomEdge === "F") {
      panels.push({ id: "bottom", label: "Bottom", color: "#1abc9c", x: frontX, y: bottomY, w: W, h: capD,
        ...generatePanel({ x: frontX, y: bottomY, w: W, h: capD, ...gp,
          edges: { top: "F-slots", right: "F-slots", bottom: "F-slots", left: "F-slots" },
        }),
      });
    } else {
      panels.push({ id: "bottom", label: "Bottom", color: "#1abc9c", x: frontX, y: bottomY, w: W, h: capD,
        ...generatePanel({ x: frontX, y: bottomY, w: W, h: capD, ...gp,
          edges: { top: "F-tabs", right: "F-tabs", bottom: "F-tabs", left: "F-tabs" },
        }),
      });
    }
  }

  let maxX = 0, maxY = 0;
  for (const p of panels) {
    maxX = Math.max(maxX, p.x + p.w + T + 5);
    maxY = Math.max(maxY, p.y + p.h + T + 5);
  }
  return { panels, bounds: { width: maxX, height: maxY } };
}

// ── SVG Export ─────────────────────────────────────────────

function exportSVG(boxData, params) {
  const { panels, bounds } = boxData;
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${r(bounds.width)}mm" height="${r(bounds.height)}mm" viewBox="0 0 ${r(bounds.width)} ${r(bounds.height)}">`,
    `<title>Box ${params.width}x${params.depth}x${params.height}mm</title>`,
  ];
  for (const p of panels) {
    lines.push(`  <path d="${p.outline}" fill="none" stroke="#000" stroke-width="0.1" id="${p.id}" />`);
    if (p.holes.length > 0) {
      const hp = p.holes.map(h =>
        `M ${h.x} ${h.y} L ${r(h.x+h.w)} ${h.y} L ${r(h.x+h.w)} ${r(h.y+h.h)} L ${h.x} ${r(h.y+h.h)} Z`
      ).join(" ");
      lines.push(`  <path d="${hp}" fill="none" stroke="#000" stroke-width="0.1" id="${p.id}-holes" />`);
    }
  }
  lines.push("</svg>");
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════════

const FONT = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

const EDGE_OPTIONS = [
  { value: "F", label: "F — Finger Joint" },
  { value: "h", label: "h — Finger Joint Holes" },
  { value: "s", label: "s — Stackable (flush)" },
  { value: "e", label: "e — Straight / Open" },
];

function Slider({ label, value, onChange, min, max, step, unit }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  if (!focused && text !== String(value)) setText(String(value));

  const commit = (t) => {
    const v = parseFloat(t);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
    else setText(String(value));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: FONT, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <input type="text" inputMode="decimal"
            value={focused ? text : String(value)}
            onChange={e => setText(e.target.value)}
            onFocus={e => { setFocused(true); setText(String(value)); e.target.select(); }}
            onBlur={() => { setFocused(false); commit(text); }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setText(String(value)); e.target.blur(); }}}
            style={{
              width: 52, padding: "2px 4px",
              border: `1px solid ${focused ? "#f59e0b" : "#334155"}`,
              borderRadius: 3, background: focused ? "#0f172a" : "transparent",
              color: "#f1f5f9", fontFamily: FONT, fontSize: 13,
              fontWeight: 600, textAlign: "right", outline: "none",
            }}
          />
          <span style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, minWidth: 18 }}>{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#f59e0b", cursor: "pointer", height: 5 }}
      />
    </div>
  );
}

function EdgeSelect({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: FONT, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "6px 8px", border: "1px solid #334155", borderRadius: 4,
        background: "#0f172a", color: "#f1f5f9", fontFamily: FONT, fontSize: 11, cursor: "pointer", outline: "none",
      }}
        onFocus={e => e.target.style.borderColor = "#f59e0b"}
        onBlur={e => e.target.style.borderColor = "#334155"}
      >
        {EDGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Hint({ children }) {
  return <div style={{ fontSize: 10, color: "#475569", marginTop: -6, marginBottom: 12 }}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [params, setParams] = useState({
    width: 100, height: 60, depth: 80,
    thickness: 3, fingerWidth: 10, kerf: 0.15,
    edgeWidth: 1.5, surroundingSpaces: 1,
    bottomEdge: "h", topEdge: "e",
  });
  const [zoom, setZoom] = useState(1.6);
  const [showLabels, setShowLabels] = useState(true);
  const [hovered, setHovered] = useState(null);

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }));
  const boxData = useMemo(() => generateBox(params), [params]);

  const handleExport = () => {
    const svg = exportSVG(boxData, params);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `box-${params.width}x${params.depth}x${params.height}.svg`;
    a.click(); URL.revokeObjectURL(url);
  };

  const fCount = calcFingerCount(params.height, params.fingerWidth);
  const baseFW = params.height / fCount;
  const surMM = r(params.surroundingSpaces * baseFW);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: FONT, background: "#0f172a", color: "#e2e8f0", overflow: "hidden" }}>

      {/* SIDEBAR */}
      <div style={{ width: 285, flexShrink: 0, background: "#1e293b", borderRight: "1px solid #334155", overflowY: "auto", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #334155" }}>
          <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 3 }}>Execute & Engrave</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Box Generator</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>v3.1 · edge types · surrounding spaces</div>
        </div>

        <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>

          <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Dimensions</div>
          <Slider label="Width"  value={params.width}  onChange={v => set("width", v)}  min={30} max={500} step={1} unit="mm" />
          <Slider label="Depth"  value={params.depth}  onChange={v => set("depth", v)}  min={30} max={500} step={1} unit="mm" />
          <Slider label="Height" value={params.height} onChange={v => set("height", v)} min={20} max={300} step={1} unit="mm" />

          <div style={{ height: 1, background: "#334155", margin: "4px 0 12px" }} />

          <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Material</div>
          <Slider label="Thickness" value={params.thickness} onChange={v => set("thickness", v)} min={1} max={12} step={0.1} unit="mm" />
          <Slider label="Kerf" value={params.kerf} onChange={v => set("kerf", v)} min={0} max={0.5} step={0.01} unit="mm" />

          <div style={{ height: 1, background: "#334155", margin: "4px 0 12px" }} />

          <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Finger Joints</div>
          <Slider label="Finger Width" value={params.fingerWidth} onChange={v => set("fingerWidth", v)} min={3} max={30} step={0.5} unit="mm" />
          <Hint>{fCount} fingers @ {r(baseFW)}mm on height edge</Hint>

          <Slider label="Surround Space" value={params.surroundingSpaces} onChange={v => set("surroundingSpaces", v)} min={0} max={4} step={0.1} unit="×" />
          <Hint>= {surMM}mm flat margin at start + end of joints</Hint>

          <Slider label="Edge Width" value={params.edgeWidth} onChange={v => set("edgeWidth", v)} min={0.5} max={5} step={0.1} unit="×T" />
          <Hint>= {r(params.edgeWidth * params.thickness)}mm from panel edge to holes</Hint>

          <div style={{ height: 1, background: "#334155", margin: "4px 0 12px" }} />

          <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Edge Types</div>
          <EdgeSelect label="Top Edge" value={params.topEdge} onChange={v => set("topEdge", v)} />
          <EdgeSelect label="Bottom Edge" value={params.bottomEdge} onChange={v => set("bottomEdge", v)} />

          <div style={{ marginTop: 4, padding: "8px 10px", borderRadius: 4, background: "#0f172a", border: "1px solid #334155", fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
            <strong style={{ color: "#94a3b8" }}>F</strong> — Tabs interlock at edges<br/>
            <strong style={{ color: "#94a3b8" }}>h</strong> — Slots cut into panel faces<br/>
            <strong style={{ color: "#94a3b8" }}>s</strong> — Flush slots (stackable)<br/>
            <strong style={{ color: "#94a3b8" }}>e</strong> — No joint (open)
          </div>

          <div style={{ height: 1, background: "#334155", margin: "12px 0" }} />

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11, color: "#94a3b8" }}>
            <div onClick={() => setShowLabels(!showLabels)} style={{
              width: 34, height: 18, borderRadius: 9, background: showLabels ? "#f59e0b" : "#334155",
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: 7, background: "#f1f5f9",
                position: "absolute", top: 2, left: showLabels ? 18 : 2,
                transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }} />
            </div>
            LABELS
          </label>

          <div style={{ height: 1, background: "#334155", margin: "12px 0" }} />

          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.8 }}>
            Outside: {params.width}×{params.depth}×{params.height}mm<br/>
            Inside: {r(params.width - 2*params.thickness)}×{r(params.depth - 2*params.thickness)}×{params.height}mm<br/>
            Panels: {boxData.panels.length} · Holes: {boxData.panels.reduce((s,p) => s + p.holes.length, 0)}
          </div>
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #334155" }}>
          <button onClick={handleExport} style={{
            width: "100%", padding: "10px 0", border: "none", borderRadius: 5,
            background: "#f59e0b", color: "#0f172a", fontFamily: FONT,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", cursor: "pointer",
          }}
            onMouseEnter={e => e.target.style.background = "#fbbf24"}
            onMouseLeave={e => e.target.style.background = "#f59e0b"}
          >↓ Export SVG</button>
        </div>
      </div>

      {/* VIEWPORT */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: 4 }}>
          {[
            { label: "−", fn: () => setZoom(z => Math.max(0.3, z - 0.3)) },
            { label: `${Math.round(zoom*100)}%`, fn: () => setZoom(1.6) },
            { label: "+", fn: () => setZoom(z => Math.min(6, z + 0.3)) },
          ].map((b, i) => (
            <button key={i} onClick={b.fn} style={{
              padding: "5px 8px", border: "1px solid #334155", borderRadius: 3,
              background: "#1e293b", color: "#94a3b8", fontFamily: FONT,
              fontSize: 10, cursor: "pointer", minWidth: i===1?48:24,
            }}>{b.label}</button>
          ))}
        </div>

        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 10,
          padding: "6px 10px", background: "rgba(30,41,59,0.92)", borderRadius: 5,
          border: "1px solid #334155", fontSize: 10, color: "#94a3b8", fontFamily: FONT,
        }}>
          <span style={{ color: "#f59e0b" }}>●</span>{" "}
          Top: <strong style={{color:"#e2e8f0"}}>{params.topEdge === "e" ? "Open" : params.topEdge.toUpperCase()}</strong>
          {" · "}Bottom: <strong style={{color:"#e2e8f0"}}>{params.bottomEdge === "e" ? "Open" : params.bottomEdge.toUpperCase()}</strong>
          {" · "}Surround: <strong style={{color:"#e2e8f0"}}>{surMM}mm</strong>
        </div>

        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 10,
          display: "flex", gap: 10, padding: "6px 12px", flexWrap: "wrap",
          background: "rgba(30,41,59,0.92)", borderRadius: 5, border: "1px solid #334155",
        }}>
          {boxData.panels.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: p.color, opacity: hovered && hovered !== p.id ? 0.3 : 1 }} />
              <span style={{ fontSize: 9, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.05em", color: hovered === p.id ? "#f1f5f9" : "#94a3b8" }}>
                {p.label}{p.holes.length > 0 ? ` (${p.holes.length}h)` : ""}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          width: "100%", height: "100%", overflow: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `
            radial-gradient(circle at 50% 50%, rgba(30,41,59,0.5) 0%, transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(51,65,85,0.1) 19px, rgba(51,65,85,0.1) 20px),
            repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(51,65,85,0.1) 19px, rgba(51,65,85,0.1) 20px)
          `,
        }}>
          <svg
            width={boxData.bounds.width * zoom}
            height={boxData.bounds.height * zoom}
            viewBox={`-10 -10 ${boxData.bounds.width + 20} ${boxData.bounds.height + 20}`}
            style={{ margin: 30 }}
          >
            <defs>
              <pattern id="g10" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(100,116,139,0.05)" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect x="-10" y="-10" width={boxData.bounds.width+20} height={boxData.bounds.height+20} fill="url(#g10)" />

            {boxData.panels.map(panel => {
              const isH = hovered === panel.id;
              const isDim = hovered && !isH;
              return (
                <g key={panel.id}
                  onMouseEnter={() => setHovered(panel.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                >
                  <path d={panel.outline}
                    fill={isH ? panel.color + "18" : panel.color + "08"}
                    stroke={panel.color}
                    strokeWidth={isH ? 0.7 : 0.4}
                    strokeLinejoin="miter"
                    opacity={isDim ? 0.3 : 1}
                    style={{ transition: "all 0.15s" }}
                  />
                  {panel.holes.map((hole, hi) => (
                    <rect key={hi}
                      x={hole.x} y={hole.y} width={hole.w} height={hole.h}
                      fill={isH ? "#f59e0b22" : "none"}
                      stroke={isH ? "#f59e0b" : panel.color}
                      strokeWidth={isH ? 0.6 : 0.35}
                      opacity={isDim ? 0.3 : 1}
                      style={{ transition: "all 0.15s" }}
                    />
                  ))}
                  {showLabels && (
                    <>
                      <text x={panel.x + panel.w/2} y={panel.y + panel.h/2 - 3}
                        textAnchor="middle" dominantBaseline="central"
                        fill={panel.color} fontSize={Math.min(panel.w, panel.h) * 0.14}
                        fontFamily={FONT} fontWeight="600"
                        opacity={isDim ? 0.12 : 0.5}
                        style={{ pointerEvents: "none", userSelect: "none" }}>
                        {panel.label}
                      </text>
                      <text x={panel.x + panel.w/2} y={panel.y + panel.h/2 + Math.min(panel.w, panel.h) * 0.1}
                        textAnchor="middle" dominantBaseline="central"
                        fill={panel.color} fontSize={Math.min(panel.w, panel.h) * 0.08}
                        fontFamily={FONT} opacity={isDim ? 0.06 : 0.28}
                        style={{ pointerEvents: "none", userSelect: "none" }}>
                        {r(panel.w)}×{r(panel.h)}mm{panel.holes.length > 0 ? ` · ${panel.holes.length} holes` : ""}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
