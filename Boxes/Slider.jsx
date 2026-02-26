// ═══════════════════════════════════════════════════════════
// Slider.jsx — Numeric input with range slider
// Execute & Engrave LLC · Box Generator v3.1
// ═══════════════════════════════════════════════════════════

import { useState } from "react";

const FONT = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

/**
 * Combined text input + range slider for numeric parameters.
 * Text input: click to type, Enter to commit, Escape to cancel.
 * No spinner arrows — clean numeric entry.
 *
 * @param {Object} props
 * @param {string} props.label - Display label
 * @param {number} props.value - Current value
 * @param {function} props.onChange - Callback with new number
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {number} props.step - Step increment
 * @param {string} props.unit - Unit suffix (mm, ×T, etc.)
 */
export default function Slider({ label, value, onChange, min, max, step, unit }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Sync external value changes when not editing
  if (!focused && text !== String(value)) setText(String(value));

  const commit = (t) => {
    const v = parseFloat(t);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
    else setText(String(value));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{
          fontSize: 11, color: "#94a3b8", fontFamily: FONT,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <input
            type="text"
            inputMode="decimal"
            value={focused ? text : String(value)}
            onChange={e => setText(e.target.value)}
            onFocus={e => {
              setFocused(true);
              setText(String(value));
              e.target.select();
            }}
            onBlur={() => {
              setFocused(false);
              commit(text);
            }}
            onKeyDown={e => {
              if (e.key === "Enter") e.target.blur();
              if (e.key === "Escape") {
                setText(String(value));
                e.target.blur();
              }
            }}
            style={{
              width: 52, padding: "2px 4px",
              border: `1px solid ${focused ? "#f59e0b" : "#334155"}`,
              borderRadius: 3,
              background: focused ? "#0f172a" : "transparent",
              color: "#f1f5f9", fontFamily: FONT, fontSize: 13,
              fontWeight: 600, textAlign: "right", outline: "none",
            }}
          />
          <span style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, minWidth: 18 }}>
            {unit}
          </span>
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#f59e0b", cursor: "pointer", height: 5 }}
      />
    </div>
  );
}
