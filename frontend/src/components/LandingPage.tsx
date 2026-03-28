import { useRef, useEffect, useState } from 'react';
import Map, { Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = 'KZ9XRmYzFCnAzzbdiTlO';
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

// Cinematic camera waypoints — sweeps across major US risk zones
const CAMERA_PATH = [
  // Start: wide Atlantic view
  { lng: -60, lat: 30, zoom: 2.2, pitch: 20, bearing: 30, dur: 0 },
  // Sweep 1: zoom toward Florida / Gulf coast
  { lng: -82, lat: 27, zoom: 5.5, pitch: 55, bearing: -15, dur: 6000 },
  // Sweep 2: pan along Gulf to Texas
  { lng: -96, lat: 29, zoom: 5.2, pitch: 50, bearing: -40, dur: 5000 },
  // Sweep 3: rise up, swing to Tornado Alley
  { lng: -97, lat: 36, zoom: 4.8, pitch: 45, bearing: 10, dur: 4500 },
  // Sweep 4: across to California wildfires
  { lng: -119, lat: 36, zoom: 5.5, pitch: 55, bearing: 25, dur: 5500 },
  // Sweep 5: pull back to full US overview
  { lng: -98, lat: 38, zoom: 3.6, pitch: 35, bearing: -10, dur: 5000 },
  // Sweep 6: orbit — slow rotation from overview  
  { lng: -90, lat: 35, zoom: 3.4, pitch: 40, bearing: 50, dur: 6000 },
  // Reset back toward Atlantic for loop
  { lng: -60, lat: 30, zoom: 2.2, pitch: 20, bearing: 30, dur: 5000 },
];

// Risk hotspots — appear as glowing heatmap blobs during flyover
const HOTSPOT_DATA = {
  type: 'FeatureCollection' as const,
  features: [
    // Florida / hurricane coast
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-80.19, 25.77] }, properties: { w: 0.95 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-80.13, 25.78] }, properties: { w: 0.90 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-81.78, 24.56] }, properties: { w: 0.92 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-82.46, 27.95] }, properties: { w: 0.82 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-80.14, 26.12] }, properties: { w: 0.88 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-81.66, 30.33] }, properties: { w: 0.68 } },
    // Gulf Coast / Louisiana / Texas
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-90.07, 29.95] }, properties: { w: 0.94 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-88.72, 30.37] }, properties: { w: 0.80 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-95.37, 29.76] }, properties: { w: 0.86 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-94.80, 29.30] }, properties: { w: 0.84 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-97.40, 27.80] }, properties: { w: 0.75 } },
    // Tornado Alley
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-97.52, 35.47] }, properties: { w: 0.78 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-97.34, 37.69] }, properties: { w: 0.70 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-95.99, 36.15] }, properties: { w: 0.65 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-98.20, 38.25] }, properties: { w: 0.58 } },
    // California wildfires
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-118.87, 34.20] }, properties: { w: 0.93 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-118.24, 34.05] }, properties: { w: 0.80 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-122.25, 38.58] }, properties: { w: 0.85 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-121.84, 39.73] }, properties: { w: 0.90 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-122.42, 37.77] }, properties: { w: 0.75 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-117.15, 32.72] }, properties: { w: 0.65 } },
    // Pacific NW / seismic
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-122.33, 47.61] }, properties: { w: 0.70 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-122.68, 45.52] }, properties: { w: 0.68 } },
    // East Coast
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-79.94, 32.78] }, properties: { w: 0.65 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-75.60, 35.23] }, properties: { w: 0.72 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-73.94, 40.70] }, properties: { w: 0.58 } },
    // Caribbean
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-66.11, 18.47] }, properties: { w: 0.88 } },
    // Midwest flooding
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-90.20, 38.63] }, properties: { w: 0.60 } },
    { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-94.58, 39.10] }, properties: { w: 0.55 } },
  ],
};

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const mapRef = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const [statsIn, setStatsIn] = useState(false);
  const [currentZone, setCurrentZone] = useState('SCANNING...');
  const waypointIdx = useRef(0);
  const loopTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const t1 = setTimeout(() => setReady(true), 500);
    const t2 = setTimeout(() => setStatsIn(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Zone labels that update as camera sweeps
  const ZONE_LABELS = [
    'ATLANTIC OVERVIEW',
    'HURRICANE COAST — FL/GULF',
    'FLOOD CORRIDOR — TX/LA',
    'TORNADO ALLEY — OK/KS',
    'WILDFIRE ZONE — CA',
    'CONTINENTAL OVERVIEW',
    'RISK ORBIT',
    'RESETTING...',
  ];

  // Cinematic camera flyover loop
  const startFlyover = () => {
    const map = mapRef.current;
    if (!map) return;

    const flyNext = () => {
      const idx = waypointIdx.current;
      if (idx >= CAMERA_PATH.length) {
        waypointIdx.current = 0;
        loopTimer.current = setTimeout(flyNext, 500);
        return;
      }

      const wp = CAMERA_PATH[idx];
      setCurrentZone(ZONE_LABELS[idx] || 'SCANNING...');

      map.flyTo({
        center: [wp.lng, wp.lat],
        zoom: wp.zoom,
        pitch: wp.pitch,
        bearing: wp.bearing,
        duration: wp.dur,
        essential: true,
      });

      waypointIdx.current = idx + 1;
      loopTimer.current = setTimeout(flyNext, wp.dur + 200);
    };

    // Start first waypoint after brief pause
    loopTimer.current = setTimeout(flyNext, 1500);
  };

  useEffect(() => {
    return () => { if (loopTimer.current) clearTimeout(loopTimer.current); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Live map with cinematic flyover */}
      <div className="absolute inset-0">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: -60,
            latitude: 30,
            zoom: 2.2,
            pitch: 20,
            bearing: 30,
          }}
          onLoad={startFlyover}
          mapLib={maplibregl}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          interactive={false}
          attributionControl={false}
        >
          {/* Heatmap layer — glows over risk zones as camera sweeps by */}
          <Source id="landing-hotspots" type="geojson" data={HOTSPOT_DATA}>
            <Layer
              id="landing-heat-glow"
              type="heatmap"
              paint={{
                'heatmap-weight': ['get', 'w'],
                'heatmap-intensity': [
                  'interpolate', ['linear'], ['zoom'],
                  2, 0.6, 4, 1.2, 6, 2.5,
                ],
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.1, 'rgba(0,40,100,0.12)',
                  0.25, 'rgba(0,100,180,0.25)',
                  0.4, 'rgba(0,160,220,0.4)',
                  0.6, 'rgba(0,200,255,0.55)',
                  0.8, 'rgba(72,220,240,0.7)',
                  1, 'rgba(144,230,255,0.8)',
                ],
                'heatmap-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  2, 30, 4, 50, 6, 70,
                ],
                'heatmap-opacity': 0.85,
              } as any}
            />
          </Source>

          {/* Second heatmap — warm tones for fire/heat zones */}
          <Source id="landing-hotspots-warm" type="geojson" data={{
            type: 'FeatureCollection',
            features: HOTSPOT_DATA.features.filter((_, i) => i >= 15 && i <= 21), // CA/PNW fire zone
          }}>
            <Layer
              id="landing-heat-warm"
              type="heatmap"
              paint={{
                'heatmap-weight': ['get', 'w'],
                'heatmap-intensity': [
                  'interpolate', ['linear'], ['zoom'],
                  2, 0.4, 4, 1.0, 6, 2.0,
                ],
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.15, 'rgba(140,50,0,0.15)',
                  0.35, 'rgba(220,100,0,0.3)',
                  0.55, 'rgba(255,107,53,0.5)',
                  0.75, 'rgba(255,60,10,0.65)',
                  1, 'rgba(200,20,0,0.75)',
                ],
                'heatmap-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  2, 25, 4, 45, 6, 65,
                ],
                'heatmap-opacity': 0.7,
              } as any}
            />
          </Source>
        </Map>
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(5,10,24,0.35) 0%, rgba(5,10,24,0.8) 65%, rgba(5,10,24,0.94) 100%)',
      }} />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.2) 50%, transparent 95%)',
          animation: 'landing-scan 5s linear infinite',
        }} />
      </div>

      {/* HUD corner brackets */}
      <div className="absolute top-5 left-5 w-14 h-14 border-l border-t border-cyan-500/15 pointer-events-none" />
      <div className="absolute top-5 right-5 w-14 h-14 border-r border-t border-cyan-500/15 pointer-events-none" />
      <div className="absolute bottom-5 left-5 w-14 h-14 border-l border-b border-cyan-500/15 pointer-events-none" />
      <div className="absolute bottom-5 right-5 w-14 h-14 border-r border-b border-cyan-500/15 pointer-events-none" />

      {/* Top-left HUD */}
      <div className="absolute top-7 left-7 z-10" style={{
        opacity: statsIn ? 1 : 0, transform: statsIn ? 'none' : 'translateX(-10px)',
        transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div className="flex flex-col gap-1.5 text-[10px] font-mono text-gray-500">
          <span><i className="fa-solid fa-satellite-dish text-cyan-600/80 mr-1.5" />LIVE · 6 DATA SOURCES</span>
          <span><i className="fa-solid fa-database text-cyan-700/80 mr-1.5" />NSI · FEMA · NOAA · USGS · FIRMS</span>
          <span><i className="fa-solid fa-signal text-green-600/80 mr-1.5" />ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Top-right coordinates */}
      <div className="absolute top-7 right-7 z-10 text-right" style={{
        opacity: statsIn ? 1 : 0, transform: statsIn ? 'none' : 'translateX(10px)',
        transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
      }}>
        <div className="flex flex-col gap-1.5 text-[10px] font-mono text-gray-500">
          <span>COVERAGE: CONUS + TERRITORIES</span>
          <span>LAT 24.5°N — 49.0°N</span>
          <span>LNG 66.9°W — 124.7°W</span>
        </div>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{
        opacity: ready ? 1 : 0,
        transform: ready ? 'none' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <i className="fa-solid fa-shield-halved text-4xl text-climate-cyan mb-3" style={{
          filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.5))',
        }} />

        <h1 className="text-5xl font-bold tracking-wider text-white mb-1">
          CLIMATE<span className="text-climate-cyan font-light">GUARD</span>
        </h1>
        <p className="text-xs text-gray-400 tracking-[0.35em] uppercase font-light mb-8">
          Property Risk Intelligence Platform
        </p>

        {/* Stat pills */}
        <div className="flex gap-2.5 mb-10" style={{
          opacity: statsIn ? 1 : 0, transform: statsIn ? 'none' : 'translateY(8px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s',
        }}>
          {[
            { val: '6', lbl: 'Hazard Layers', ic: 'fa-layer-group' },
            { val: '50', lbl: 'States', ic: 'fa-flag-usa' },
            { val: '35+', lbl: 'Insurers', ic: 'fa-shield-halved' },
            { val: '20yr', lbl: 'Trajectory', ic: 'fa-chart-line' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg"
              style={{
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.1)',
                backdropFilter: 'blur(6px)',
              }}>
              <i className={`fa-solid ${s.ic} text-[9px] text-climate-cyan/40`} />
              <span className="text-sm font-black text-white tabular-nums">{s.val}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* Enter */}
        <button onClick={onEnter} className="group"
          style={{
            background: 'rgba(0,212,255,0.07)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: 8, padding: '12px 42px', color: '#00d4ff',
            fontSize: 13, fontWeight: 700, letterSpacing: 4,
            textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.3s ease', backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.15)';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(0,212,255,0.12)';
            e.currentTarget.style.borderColor = 'rgba(0,212,255,0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.07)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)';
          }}
        >
          <span className="flex items-center gap-2.5">
            Enter Platform
            <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>

      {/* Bottom — live zone ticker */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10" style={{
        opacity: statsIn ? 1 : 0, transition: 'opacity 0.6s ease 0.5s',
      }}>
        <div className="flex items-center gap-5 text-[9px] font-mono text-gray-600 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            {currentZone}
          </span>
          <span className="text-gray-700">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            ACTIVE THREATS: FL · CA · TX · LA
          </span>
        </div>
      </div>

      <style>{`
        @keyframes landing-scan {
          0% { top: -2px; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .maplibregl-control-container { display: none !important; }
      `}</style>
    </div>
  );
}
