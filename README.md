# Boxes.js

A browser-based parametric box generator for laser cutting. Inspired by [Boxes.py](https://www.festi.info/boxes.py/), rebuilt from scratch in JavaScript with a modular geometry engine and live SVG preview.

**Execute & Engrave LLC** · v3.1

![MIT License](https://img.shields.io/badge/license-MIT-blue)

## What It Does

Design finger-joint boxes with configurable dimensions, material thickness, and edge types — then export laser-ready SVG files. Everything runs client-side with instant visual feedback.

### Edge Types

| Type | Description |
|------|-------------|
| **F** | Finger joints — tabs interlock at panel edges |
| **h** | Finger holes — slots cut into panel faces (inset from edge) |
| **s** | Stackable — flush slots at panel edge for flat-bottom boxes |
| **e** | Straight / open — no joint |

### Parameters

- **Width / Depth / Height** — Outside dimensions (mm)
- **Thickness** — Material thickness (mm)
- **Finger Width** — Target tab width (auto-calculated to odd count)
- **Surrounding Spaces** — Flat margin at start/end of joints (× finger width)
- **Play** — Joint clearance offset (mm) — shrinks tabs, expands holes for tighter/looser fit
- **Edge Width** — Distance from panel edge to holes (× thickness)
- **Kerf** — Laser beam width for cut compensation

## Architecture

Modular separation of concerns — geometry engine is pure math, no UI dependencies:

```
Boxes/
├── geometry.js        # r(), DIR vectors, calcFingerCount()
├── edgeTypes.js       # fingerEdgePath, straightEdgePath, generateEdgeHoles
├── panelGenerator.js  # Compose 4 edges into closed panel outline + holes
├── boxGenerator.js    # Box orchestration (6 panels) + SVG export
├── BoxGeneratorApp.jsx # Main UI component
├── Slider.jsx         # Numeric input + range slider
├── EdgeSelect.jsx     # Edge type dropdown
├── index.js           # Barrel exports
└── main.jsx           # Vite entry point
```

## Getting Started

```bash
git clone https://github.com/ericbowser/Boxes.js.git
cd Boxes.js
npm install
npm run dev
```

Open `http://localhost:5173` — adjust parameters in the sidebar, click **Export SVG** when ready.

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Pure SVG path generation (no canvas dependencies)

## Physical Validation

Geometry engine has been validated with physical test cuts on 3mm acrylic using a CO2 laser cutter. Finger joints interlock correctly across all edge types.

## License

GPL-3.0

© 2026 Eric Bowser / Execute & Engrave LLC
