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

// Each hazard gets a visually distinct, beautiful gradient
const LAYER_COLORS: Record<string, any[]> = {
  flood: [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',     0.15, 'rgba(0,60,140,0.2)',
    0.35, 'rgba(0,120,200,0.4)',  0.55, 'rgba(0,180,216,0.6)',
    0.75, 'rgba(72,202,228,0.78)', 1, 'rgb(144,224,239)',
  ],
  fire: [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',     0.15, 'rgba(140,50,0,0.2)',
    0.35, 'rgba(200,80,10,0.42)',  0.55, 'rgba(255,107,53,0.62)',
    0.75, 'rgba(255,60,10,0.8)', 1, 'rgb(200,20,0)',
  ],
  wind: [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',     0.15, 'rgba(90,30,140,0.2)',
    0.35, 'rgba(140,60,200,0.38)',  0.55, 'rgba(180,100,240,0.58)',
    0.75, 'rgba(199,125,255,0.75)', 1, 'rgb(230,190,255)',
  ],
  heat: [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',     0.15, 'rgba(120,90,0,0.2)',
    0.35, 'rgba(200,150,0,0.38)',  0.55, 'rgba(255,186,8,0.58)',
    0.75, 'rgba(255,160,0,0.75)', 1, 'rgb(255,120,0)',
  ],
  seismic: [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',     0.15, 'rgba(0,80,60,0.2)',
    0.35, 'rgba(0,140,110,0.38)',  0.55, 'rgba(6,190,150,0.58)',
    0.75, 'rgba(6,214,160,0.75)', 1, 'rgb(120,255,210)',
  ],
  disasters: [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',     0.15, 'rgba(120,100,0,0.15)',
    0.35, 'rgba(200,170,0,0.32)',  0.55, 'rgba(255,214,10,0.52)',
    0.75, 'rgba(255,230,100,0.7)', 1, 'rgb(255,245,180)',
  ],
};

const ALL_LAYER_IDS = ['flood', 'fire', 'wind', 'heat', 'seismic', 'disasters'] as const;

interface LayerVisibility {
  [key: string]: boolean;
}

export default function MapView({ riskData, year }: { riskData: any; year: number }) {
  const mapRef = useRef<MapRef>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [layerData, setLayerData] = useState<Record<string, any>>({});
  const [visibility, setVisibility] = useState<LayerVisibility>(
    Object.fromEntries(ALL_LAYER_IDS.map(id => [id, true]))
  );
  const [globalOpacity, setGlobalOpacity] = useState(0.8);

  // Fetch properties
  useEffect(() => {
    axios.get('http://localhost:8000/properties')
      .then(res => setProperties(res.data))
      .catch(console.error);
  }, []);

  // Fetch heatmap data once on mount
  useEffect(() => {
    axios.get('http://localhost:8000/heatmap/data?layers=flood,fire,wind,heat,seismic,disasters')
      .then(res => setLayerData(res.data))
      .catch(() => {
        // Build empty fallback so sources still exist
        const empty: Record<string, any> = {};
        ALL_LAYER_IDS.forEach(l => {
          empty[l] = { type: 'FeatureCollection', features: [] };
        });
        setLayerData(empty);
      });
  }, []);

  // Fly to address when we get risk data
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

  const toggleLayer = useCallback((id: string) => {
    setVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setAllLayers = useCallback((visible: boolean) => {
    setVisibility(Object.fromEntries(ALL_LAYER_IDS.map(id => [id, visible])));
  }, []);

  // Time factor: risk intensifies as year increases
  const timeFactor = 1 + ((year - 2024) / 20) * 0.5;

  // Build enriched GeoJSON — adds active property to relevant layers
  const buildGeoJSON = useCallback((layerId: string) => {
    const base = layerData[layerId] || { type: 'FeatureCollection', features: [] };
    if (!riskData) return base;

    const hazardScore = riskData.hazards?.[layerId]?.score || 0;
    if (hazardScore <= 0) return base;

    return {
      ...base,
      features: [
        ...base.features,
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [riskData.lng, riskData.lat] },
          properties: { weight: Math.min(1, hazardScore / 10) },
        },
      ],
    };
  }, [layerData, riskData]);

  return (
    <Map
      ref={mapRef}
      initialViewState={US_VIEW}
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Render all 6 heatmap layers — visibility controlled via opacity */}
      {ALL_LAYER_IDS.map(id => {
        const geojson = buildGeoJSON(id);
        const colors = LAYER_COLORS[id];
        const isVisible = visibility[id];

        return (
          <Source key={id} id={`heatmap-src-${id}`} type="geojson" data={geojson}>
            <Layer
              id={`heatmap-layer-${id}`}
              type="heatmap"
              paint={{
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
                'heatmap-intensity': [
                  'interpolate', ['linear'], ['zoom'],
                  0, 0.4 * timeFactor,
                  6, 1.0 * timeFactor,
                  12, 2.2 * timeFactor,
                  15, 3.5 * timeFactor,
                ],
                'heatmap-color': colors,
                'heatmap-radius': [
                  'interpolate', ['linear'], ['zoom'],
                  0, 20, 3, 35, 6, 50, 9, 65, 15, 85,
                ],
                'heatmap-opacity': isVisible
                  ? globalOpacity * 0.85
                  : 0,
              } as any}
            />
          </Source>
        );
      })}

      {/* Active searched address marker */}
      {riskData && (
        <Marker longitude={riskData.lng} latitude={riskData.lat} anchor="center">
          <div className="active-marker" title={riskData.address} />
        </Marker>
      )}

      {/* Layer controls — positioned outside pointer-events-none containers */}
      <HeatmapControls
        visibility={visibility}
        onToggle={toggleLayer}
        onSetAll={setAllLayers}
        opacity={globalOpacity}
        onOpacityChange={setGlobalOpacity}
      />

      <style>{`
        .active-marker {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #00d4ff;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 0 0 4px rgba(0,212,255,0.25), 0 0 16px 4px rgba(0,212,255,0.5);
          animation: marker-glow 2.5s ease-in-out infinite;
        }
        @keyframes marker-glow {
          0%, 100% { box-shadow: 0 0 0 4px rgba(0,212,255,0.25), 0 0 16px 4px rgba(0,212,255,0.5); transform: scale(1); }
          50% { box-shadow: 0 0 0 8px rgba(0,212,255,0.12), 0 0 24px 8px rgba(0,212,255,0.3); transform: scale(1.1); }
        }
      `}</style>
    </Map>
  );
}
