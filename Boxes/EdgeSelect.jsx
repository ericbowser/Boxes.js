// ═══════════════════════════════════════════════════════════
// EdgeSelect.jsx — Edge type dropdown
// Execute & Engrave LLC · Box Generator v3.1
// ═══════════════════════════════════════════════════════════

import { EDGE_OPTIONS } from "./edgeTypes";

const FONT = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

/**
 * Dropdown selector for edge joint types (F, h, s, e).
 *
 * @param {Object} props
 * @param {string} props.label - Display label
 * @param {string} props.value - Current edge type value
 * @param {function} props.onChange - Callback with new edge type string
 */
export default function EdgeSelect({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 11, color: "#94a3b8", fontFamily: FONT,
        letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4,
      }}>
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "6px 8px",
          border: "1px solid #334155", borderRadius: 4,
          background: "#0f172a", color: "#f1f5f9",
          fontFamily: FONT, fontSize: 11,
          cursor: "pointer", outline: "none",
        }}
        onFocus={e => (e.target.style.borderColor = "#f59e0b")}
        onBlur={e => (e.target.style.borderColor = "#334155")}
      >
        {EDGE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
