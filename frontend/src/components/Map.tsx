import { useRef, useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';
import HeatmapControls from './HeatmapControls';

const MAPTILER_KEY = 'KZ9XRmYzFCnAzzbdiTlO';
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

const US_VIEW = {
  longitude: -80,
  latitude: 15,
  zoom: 2.8,
  pitch: 0,
  bearing: 0,
};

// Per-hazard color palettes — each layer gets a visually distinct gradient
const LAYER_COLORS: Record<string, any[]> = {
  flood: [
    'interpolate', ['linear'], ['heatmap-density'],
    0,    'rgba(0,0,0,0)',
    0.1,  'rgba(0,50,120,0.15)',
    0.25, 'rgba(0,100,180,0.35)',
    0.4,  'rgba(0,150,220,0.50)',
    0.6,  'rgba(0,180,216,0.68)',
    0.8,  'rgba(0,210,255,0.82)',
    1,    'rgb(144,224,239)',
  ],
  fire: [
    'interpolate', ['linear'], ['heatmap-density'],
    0,    'rgba(0,0,0,0)',
    0.1,  'rgba(120,50,0,0.15)',
    0.25, 'rgba(180,80,0,0.35)',
    0.4,  'rgba(220,120,0,0.52)',
    0.6,  'rgba(255,107,53,0.70)',
    0.8,  'rgba(255,60,0,0.85)',
    1,    'rgb(200,20,0)',
  ],
  wind: [
    'interpolate', ['linear'], ['heatmap-density'],
    0,    'rgba(0,0,0,0)',
    0.1,  'rgba(80,20,120,0.15)',
    0.25, 'rgba(120,50,180,0.32)',
    0.4,  'rgba(160,80,220,0.50)',
    0.6,  'rgba(199,125,255,0.68)',
    0.8,  'rgba(220,160,255,0.82)',
    1,    'rgb(240,200,255)',
  ],
  heat: [
    'interpolate', ['linear'], ['heatmap-density'],
    0,    'rgba(0,0,0,0)',
    0.1,  'rgba(100,80,0,0.15)',
    0.25, 'rgba(180,140,0,0.30)',
    0.4,  'rgba(220,170,0,0.48)',
    0.6,  'rgba(255,186,8,0.65)',
    0.8,  'rgba(255,160,0,0.80)',
    1,    'rgb(255,120,0)',
  ],
  seismic: [
    'interpolate', ['linear'], ['heatmap-density'],
    0,    'rgba(0,0,0,0)',
    0.1,  'rgba(0,60,50,0.15)',
    0.25, 'rgba(0,120,100,0.30)',
    0.4,  'rgba(6,180,140,0.48)',
    0.6,  'rgba(6,214,160,0.65)',
    0.8,  'rgba(50,240,180,0.80)',
    1,    'rgb(120,255,210)',
  ],
  disasters: [
    'interpolate', ['linear'], ['heatmap-density'],
    0,    'rgba(0,0,0,0)',
    0.1,  'rgba(100,80,0,0.10)',
    0.25, 'rgba(180,150,0,0.25)',
    0.4,  'rgba(220,190,0,0.42)',
    0.6,  'rgba(255,214,10,0.60)',
    0.8,  'rgba(255,230,100,0.78)',
    1,    'rgb(255,245,180)',
  ],
};

// Glow layers use a softer, wider version of the same palette
const GLOW_OPACITY_BASE = 0.35;

interface LayerState {
  id: string;
  visible: boolean;
}

export default function MapView({ riskData, year }: { riskData: any; year: number }) {
  const mapRef = useRef<MapRef>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [layerData, setLayerData] = useState<Record<string, any>>({});
  const [activeLayers, setActiveLayers] = useState<LayerState[]>([
    { id: 'flood', visible: true },
    { id: 'fire', visible: true },
    { id: 'wind', visible: true },
    { id: 'heat', visible: true },
    { id: 'seismic', visible: true },
    { id: 'disasters', visible: true },
  ]);
  const [globalOpacity, setGlobalOpacity] = useState(0.8);

  // Fetch properties
  useEffect(() => {
    axios.get('http://localhost:8000/properties')
      .then(res => setProperties(res.data))
      .catch(console.error);
  }, []);

  // Fetch per-hazard heatmap data
  useEffect(() => {
    axios.get('http://localhost:8000/heatmap/data?layers=flood,fire,wind,heat,seismic,disasters')
      .then(res => setLayerData(res.data))
      .catch(() => {
        // Fallback: use empty feature collections
        const empty: Record<string, any> = {};
        ['flood', 'fire', 'wind', 'heat', 'seismic', 'disasters'].forEach(l => {
          empty[l] = { type: 'FeatureCollection', features: [] };
        });
        setLayerData(empty);
      });
  }, []);

  // Fly to address when riskData loads
  useEffect(() => {
    if (riskData?.lat && riskData?.lng && mapRef.current) {
      mapRef.current.flyTo({
        center: [riskData.lng, riskData.lat],
        zoom: 14,
        pitch: 50,
        bearing: -15,
        duration: 2500,
      });
    }
  }, [riskData]);

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers(prev =>
      prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l)
    );
  }, []);

  const setAllLayers = useCallback((visible: boolean) => {
    setActiveLayers(prev => prev.map(l => ({ ...l, visible })));
  }, []);

  // Time-based intensity multiplier (risk worsens over projected years)
  const timeIntensity = 1 + ((year - 2024) / 20) * 0.6;

  // Inject property markers and active address into relevant layers
  const getEnrichedGeoJSON = (layerId: string) => {
    const base = layerData[layerId] || { type: 'FeatureCollection', features: [] };
    const extra: any[] = [];

    // Add property markers to all layers with their composite score
    if (layerId === 'flood' || layerId === 'wind') {
      properties.forEach(p => {
        extra.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: { weight: p.composite_score / 100 },
        });
      });
    }

    // Add active address point to its dominant hazard layers
    if (riskData) {
      const hazards = riskData.hazards || {};
      const score = hazards[layerId]?.score || 0;
      if (score > 0) {
        extra.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [riskData.lng, riskData.lat] },
          properties: { weight: Math.min(1, score / 10) },
        });
      }
    }

    return {
      ...base,
      features: [...base.features, ...extra],
    };
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={US_VIEW}
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Per-hazard heatmap layers with glow effect */}
      {activeLayers.map(({ id, visible }) => {
        if (!visible || !layerData[id]) return null;
        const geojson = getEnrichedGeoJSON(id);
        const colors = LAYER_COLORS[id];
        if (!colors) return null;

        return (
          <span key={id}>
            {/* Glow/bloom under-layer — wider radius, lower opacity */}
            <Source id={`glow-${id}`} type="geojson" data={geojson}>
              <Layer
                id={`glow-heatmap-${id}`}
                type="heatmap"
                paint={{
                  'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
                  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'],
                    0, 0.3 * timeIntensity, 6, 0.8 * timeIntensity, 12, 1.8 * timeIntensity, 15, 3 * timeIntensity],
                  'heatmap-color': colors,
                  'heatmap-radius': ['interpolate', ['linear'], ['zoom'],
                    0, 28, 3, 48, 6, 65, 9, 85, 15, 110],
                  'heatmap-opacity': GLOW_OPACITY_BASE * globalOpacity,
                } as any}
              />
            </Source>

            {/* Main sharp layer */}
            <Source id={`main-${id}`} type="geojson" data={geojson}>
              <Layer
                id={`main-heatmap-${id}`}
                type="heatmap"
                paint={{
                  'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
                  'heatmap-intensity': ['interpolate', ['linear'], ['zoom'],
                    0, 0.4 * timeIntensity, 6, 1.2 * timeIntensity, 12, 2.5 * timeIntensity, 15, 4 * timeIntensity],
                  'heatmap-color': colors,
                  'heatmap-radius': ['interpolate', ['linear'], ['zoom'],
                    0, 18, 3, 32, 6, 45, 9, 60, 15, 80],
                  'heatmap-opacity': ['interpolate', ['linear'], ['zoom'],
                    1, 0.75 * globalOpacity, 14, 0.6 * globalOpacity],
                } as any}
              />
            </Source>
          </span>
        );
      })}

      {/* Active address marker with pulsing glow */}
      {riskData && (
        <Marker longitude={riskData.lng} latitude={riskData.lat} anchor="center">
          <div
            title={riskData.address}
            className="marker-pulse"
            style={{
              width: 16, height: 16,
              borderRadius: '50%',
              background: '#00d4ff',
              border: '2px solid white',
              boxShadow: '0 0 14px 5px rgba(0,212,255,0.75)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </Marker>
      )}

      {/* Heatmap layer controls */}
      <HeatmapControls
        layers={activeLayers}
        onToggle={toggleLayer}
        onSetAll={setAllLayers}
        opacity={globalOpacity}
        onOpacityChange={setGlobalOpacity}
      />

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 14px 5px rgba(0,212,255,0.75); transform: scale(1); }
          50% { box-shadow: 0 0 22px 10px rgba(0,212,255,0.45); transform: scale(1.15); }
        }
        .marker-pulse { animation: pulse 2s ease-in-out infinite; }
      `}</style>
    </Map>
  );
}
