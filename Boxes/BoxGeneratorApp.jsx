// ═══════════════════════════════════════════════════════════
// BoxGeneratorApp.jsx — Main page component
// Execute & Engrave LLC · Box Generator v3.1
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { r, calcFingerCount } from "./geometry";
import { generateBox, exportSVG } from "./boxGenerator";
import Slider from "./Slider";
import EdgeSelect from "./EdgeSelect";

const FONT = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

function Hint({ children }) {
  return (
    <div style={{ fontSize: 10, color: "#475569", marginTop: -6, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function SectionLabel({ text }) {
  return (
    <div style={{
      fontSize: 10, color: "#f59e0b", letterSpacing: "0.12em",
      textTransform: "uppercase", marginBottom: 12, fontWeight: 600,
    }}>
      {text}
    </div>
  );
}

export default function BoxGeneratorApp() {
  const [params, setParams] = useState({
    width: 100, height: 60, depth: 80,
    thickness: 3, fingerWidth: 10, kerf: 0.15,
    edgeWidth: 1.5, surroundingSpaces: 1, play: 0,
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
    a.href = url;
    a.download = `box-${params.width}x${params.depth}x${params.height}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Computed display values
  const fCount = calcFingerCount(params.height, params.fingerWidth);
  const baseFW = params.height / fCount;
  const surMM = r(params.surroundingSpaces * baseFW);

  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: FONT,
      background: "#0f172a", color: "#e2e8f0", overflow: "hidden",
    }}>

      {/* ═══ SIDEBAR ═══ */}
      <div style={{
        width: 285, flexShrink: 0, background: "#1e293b",
        borderRight: "1px solid #334155", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #334155" }}>
          <div style={{
            fontSize: 9, color: "#f59e0b", letterSpacing: "0.15em",
            textTransform: "uppercase", marginBottom: 3,
          }}>
            Execute & Engrave
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
            Box Generator
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
            v3.1 · edge types · surrounding spaces
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>

          <SectionLabel text="Dimensions" />
          <Slider label="Width" value={params.width} onChange={v => set("width", v)} min={30} max={500} step={1} unit="mm" />
          <Slider label="Depth" value={params.depth} onChange={v => set("depth", v)} min={30} max={500} step={1} unit="mm" />
          <Slider label="Height" value={params.height} onChange={v => set("height", v)} min={20} max={300} step={1} unit="mm" />

          <div style={{ height: 1, background: "#334155", margin: "4px 0 12px" }} />

          <SectionLabel text="Material" />
          <Slider label="Thickness" value={params.thickness} onChange={v => set("thickness", v)} min={1} max={12} step={0.1} unit="mm" />
          <Slider label="Kerf" value={params.kerf} onChange={v => set("kerf", v)} min={0} max={0.5} step={0.01} unit="mm" />

          <div style={{ height: 1, background: "#334155", margin: "4px 0 12px" }} />

          <SectionLabel text="Finger Joints" />
          <Slider label="Finger Width" value={params.fingerWidth} onChange={v => set("fingerWidth", v)} min={3} max={30} step={0.5} unit="mm" />
          <Hint>{fCount} fingers @ {r(baseFW)}mm on height edge</Hint>

          <Slider label="Surround Space" value={params.surroundingSpaces} onChange={v => set("surroundingSpaces", v)} min={0} max={4} step={0.1} unit="×" />
          <Hint>= {surMM}mm flat margin at start + end of joints</Hint>

          <Slider label="Play" value={params.play} onChange={v => set("play", v)} min={0} max={0.5} step={0.01} unit="mm" />
          <Hint>Joint clearance: tabs shrink, holes expand by {r(params.play)}mm/side</Hint>

          <Slider label="Edge Width" value={params.edgeWidth} onChange={v => set("edgeWidth", v)} min={0.5} max={5} step={0.1} unit="×T" />
          <Hint>= {r(params.edgeWidth * params.thickness)}mm from panel edge to holes</Hint>

          <div style={{ height: 1, background: "#334155", margin: "4px 0 12px" }} />

          <SectionLabel text="Edge Types" />
          <EdgeSelect label="Top Edge" value={params.topEdge} onChange={v => set("topEdge", v)} />
          <EdgeSelect label="Bottom Edge" value={params.bottomEdge} onChange={v => set("bottomEdge", v)} />

          <div style={{
            marginTop: 4, padding: "8px 10px", borderRadius: 4,
            background: "#0f172a", border: "1px solid #334155",
            fontSize: 10, color: "#64748b", lineHeight: 1.7,
          }}>
            <strong style={{ color: "#94a3b8" }}>F</strong> — Tabs interlock at edges<br />
            <strong style={{ color: "#94a3b8" }}>h</strong> — Slots cut into panel faces<br />
            <strong style={{ color: "#94a3b8" }}>s</strong> — Flush slots (stackable)<br />
            <strong style={{ color: "#94a3b8" }}>e</strong> — No joint (open)
          </div>

          <div style={{ height: 1, background: "#334155", margin: "12px 0" }} />

          {/* Labels toggle */}
          <label style={{
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", fontSize: 11, color: "#94a3b8",
          }}>
            <div
              onClick={() => setShowLabels(!showLabels)}
              style={{
                width: 34, height: 18, borderRadius: 9,
                background: showLabels ? "#f59e0b" : "#334155",
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 7, background: "#f1f5f9",
                position: "absolute", top: 2, left: showLabels ? 18 : 2,
                transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }} />
            </div>
            LABELS
          </label>

          <div style={{ height: 1, background: "#334155", margin: "12px 0" }} />

          {/* Specs readout */}
          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.8 }}>
            Outside: {params.width}×{params.depth}×{params.height}mm<br />
            Inside: {r(params.width - 2 * params.thickness)}×{r(params.depth - 2 * params.thickness)}×{params.height}mm<br />
            Panels: {boxData.panels.length} · Holes: {boxData.panels.reduce((s, p) => s + p.holes.length, 0)}
          </div>
        </div>

        {/* Export button */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #334155" }}>
          <button
            onClick={handleExport}
            style={{
              width: "100%", padding: "10px 0", border: "none", borderRadius: 5,
              background: "#f59e0b", color: "#0f172a", fontFamily: FONT,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", cursor: "pointer",
            }}
            onMouseEnter={e => (e.target.style.background = "#fbbf24")}
            onMouseLeave={e => (e.target.style.background = "#f59e0b")}
          >
            ↓ Export SVG
          </button>
        </div>
      </div>

      {/* ═══ VIEWPORT ═══ */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Zoom controls */}
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: 4 }}>
          {[
            { label: "−", fn: () => setZoom(z => Math.max(0.3, z - 0.3)) },
            { label: `${Math.round(zoom * 100)}%`, fn: () => setZoom(1.6) },
            { label: "+", fn: () => setZoom(z => Math.min(6, z + 0.3)) },
          ].map((b, i) => (
            <button
              key={i} onClick={b.fn}
              style={{
                padding: "5px 8px", border: "1px solid #334155", borderRadius: 3,
                background: "#1e293b", color: "#94a3b8", fontFamily: FONT,
                fontSize: 10, cursor: "pointer", minWidth: i === 1 ? 48 : 24,
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Status bar */}
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 10,
          padding: "6px 10px", background: "rgba(30,41,59,0.92)", borderRadius: 5,
          border: "1px solid #334155", fontSize: 10, color: "#94a3b8", fontFamily: FONT,
        }}>
          <span style={{ color: "#f59e0b" }}>●</span>{" "}
          Top: <strong style={{ color: "#e2e8f0" }}>{params.topEdge === "e" ? "Open" : params.topEdge.toUpperCase()}</strong>
          {" · "}Bottom: <strong style={{ color: "#e2e8f0" }}>{params.bottomEdge === "e" ? "Open" : params.bottomEdge.toUpperCase()}</strong>
          {" · "}Surround: <strong style={{ color: "#e2e8f0" }}>{surMM}mm</strong>
        </div>

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 10,
          display: "flex", gap: 10, padding: "6px 12px", flexWrap: "wrap",
          background: "rgba(30,41,59,0.92)", borderRadius: 5, border: "1px solid #334155",
        }}>
          {boxData.panels.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 7, height: 7, borderRadius: 2, background: p.color,
                opacity: hovered && hovered !== p.id ? 0.3 : 1,
              }} />
              <span style={{
                fontSize: 9, fontFamily: FONT, textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: hovered === p.id ? "#f1f5f9" : "#94a3b8",
              }}>
                {p.label}{p.holes.length > 0 ? ` (${p.holes.length}h)` : ""}
              </span>
            </div>
          ))}
        </div>

        {/* SVG Canvas */}
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
            <rect x="-10" y="-10" width={boxData.bounds.width + 20} height={boxData.bounds.height + 20} fill="url(#g10)" />

            {boxData.panels.map(panel => {
              const isH = hovered === panel.id;
              const isDim = hovered && !isH;
              return (
                <g
                  key={panel.id}
                  onMouseEnter={() => setHovered(panel.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                >
                  <path
                    d={panel.outline}
                    fill={isH ? panel.color + "18" : panel.color + "08"}
                    stroke={panel.color}
                    strokeWidth={isH ? 0.7 : 0.4}
                    strokeLinejoin="miter"
                    opacity={isDim ? 0.3 : 1}
                    style={{ transition: "all 0.15s" }}
                  />
                  {panel.holes.map((hole, hi) => (
                    <rect
                      key={hi}
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
                      <text
                        x={panel.x + panel.w / 2} y={panel.y + panel.h / 2 - 3}
                        textAnchor="middle" dominantBaseline="central"
                        fill={panel.color}
                        fontSize={Math.min(panel.w, panel.h) * 0.14}
                        fontFamily={FONT} fontWeight="600"
                        opacity={isDim ? 0.12 : 0.5}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {panel.label}
                      </text>
                      <text
                        x={panel.x + panel.w / 2}
                        y={panel.y + panel.h / 2 + Math.min(panel.w, panel.h) * 0.1}
                        textAnchor="middle" dominantBaseline="central"
                        fill={panel.color}
                        fontSize={Math.min(panel.w, panel.h) * 0.08}
                        fontFamily={FONT}
                        opacity={isDim ? 0.06 : 0.28}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {r(panel.w)}×{r(panel.h)}mm
                        {panel.holes.length > 0 ? ` · ${panel.holes.length} holes` : ""}
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
