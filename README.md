<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/MapLibre_GL-396CB2?style=for-the-badge&logo=mapbox&logoColor=white" alt="MapLibre" />
</p>

<h1 align="center">🛡️ Climate Guard</h1>
<p align="center">
  <strong>AI-Powered Property Risk Intelligence Platform</strong><br/>
  <em>Real-time climate risk assessment, premium forecasting, and insurer matching for US properties.</em>
</p>

---

## Overview

Climate Guard synthesizes data from 6 free public APIs into actionable, financially-grounded insights for homeowners. Enter any US address and get a composite risk score, premium trajectory, insurer recommendations, and mitigation ROI — all in seconds.

### Key Features

- **5-Hazard Risk Scoring** — Flood, wildfire, wind, heat, and seismic analysis with weighted composite score
- **Real Property Data** — Building type and structure values from USACE National Structure Inventory
- **50-State Premium Engine** — State-specific base rates × risk multipliers × building type adjustments
- **20-Year Trajectory** — Unmitigated vs. mitigated premium projections with state growth rates
- **Insurer Matching** — 35+ carriers ranked by hazard specialty alignment
- **Disaster History** — 20 years of FEMA declarations with trend analysis
- **Disaster Simulation** — Visual overlay simulating the property's top threat
- **Interactive Heatmap** — Combined risk visualization with time-slider intensity

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, MapLibre GL, Recharts, Tailwind, Font Awesome 6 |
| Backend | Python 3.11+, FastAPI, Pydantic v2, HTTPX, GeoPy |
| AI | Google Gemini 2.5 Flash (optional — rule-based fallback included) |
| Database | PostgreSQL 15 + PostGIS 3.4, DiskCache |

## Data Sources

All free, no keys required (Gemini & NASA FIRMS are optional):

| Source | Provides |
|--------|----------|
| [USACE NSI](https://nsi.sec.usace.army.mil/) | Building type, structure value, occupancy |
| [OpenFEMA](https://www.fema.gov/api/open/) | Disaster declarations & trend analysis |
| [FEMA NFHL](https://msc.fema.gov/portal/) | Flood zone classification |
| [Open-Meteo](https://open-meteo.com/) | Temperature extremes, wind speed |
| [USGS Earthquake](https://earthquake.usgs.gov/) | Seismic activity |
| [Nominatim](https://nominatim.org/) | Address geocoding |

---

## Quick Start

### Prerequisites

Node.js 18+, Python 3.11+, Docker (for PostGIS)

### Backend

```bash
docker compose up db -d

cd climate-guard
pip install -r requirements.txt

# Optional: create backend/.env with GEMINI_API_KEY=your_key
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/risk?address=...` | Risk profile with composite score, property info, disaster history |
| `GET` | `/recommendations?address=...` | AI improvements + insurer matching |
| `GET` | `/trajectory?address=...` | 20-year premium projection (mitigated + unmitigated) |
| `GET` | `/heatmap/layers` | Heatmap layer metadata |
| `GET` | `/heatmap/data?layers=...` | Per-hazard GeoJSON data |
| `GET` | `/properties` | Demo property portfolio |

All `GET` endpoints accept optional `insured_value`, `user_premium`, and `building_type` query params for user overrides.

---

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `GEMINI_API_KEY` | No | Enables AI-powered recommendations (fallback works without it) |
| `NASA_FIRMS_KEY` | No | Real-time fire detection data |

---

## Running Tests

```bash
cd climate-guard
python -m pytest backend/tests/test_flow.py -v
```

---

## Team

Built for **HackLanta** hackathon.

<p align="center">
  <sub>Powered by USACE NSI · OpenFEMA · FEMA NFHL · Open-Meteo · USGS · Google Gemini</sub>
</p>
