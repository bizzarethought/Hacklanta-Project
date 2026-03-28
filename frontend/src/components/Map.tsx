import { useRef, useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';

const MAPTILER_KEY = 'KZ9XRmYzFCnAzzbdiTlO';
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

const US_VIEW = {
  longitude: -80,
  latitude: 15,
  zoom: 2.8,
  pitch: 0,
  bearing: 0,
};

const ALL_LAYER_IDS = ['flood', 'fire', 'wind', 'heat', 'seismic', 'disasters'] as const;

// Single red-yellow risk gradient
const RISK_COLORS = [
  'interpolate', ['linear'], ['heatmap-density'],
  0,    'rgba(0,0,0,0)',
  0.12, 'rgba(255,220,0,0.0)',
  0.25, 'rgba(255,200,0,0.50)',
  0.45, 'rgba(255,110,0,0.68)',
  0.65, 'rgba(220,30,0,0.82)',
  0.85, 'rgba(170,0,0,0.92)',
  1,    'rgb(110,0,0)',
];

export default function MapView({ riskData, year }: { riskData: any; year: number }) {
  const mapRef = useRef<MapRef>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [layerData, setLayerData] = useState<Record<string, any>>({});

  useEffect(() => {
    axios.get('http://localhost:8000/properties')
      .then(res => setProperties(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    axios.get('http://localhost:8000/heatmap/data?layers=flood,fire,wind,heat,seismic,disasters')
      .then(res => setLayerData(res.data))
      .catch(console.error);
  }, []);

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

  // Time factor: risk intensifies as year increases
  const timeFactor = 1 + ((year - 2024) / 20) * 0.5;

  // Merge all layer features into one GeoJSON
  const combinedGeoJSON = useCallback((): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = [];

    // Backend heatmap layer data
    ALL_LAYER_IDS.forEach(id => {
      const layer = layerData[id];
      if (layer?.features) features.push(...layer.features);
    });

    // Demo properties
    properties.forEach(p => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { weight: Math.min(1, (p.composite_score ?? 50) / 100) },
      });
    });

    // Active searched address — boost its weight so it shows hot
    if (riskData) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [riskData.lng, riskData.lat] },
        properties: { weight: Math.min(1, riskData.composite_score / 100) },
      });
    }

    return { type: 'FeatureCollection', features };
  }, [layerData, properties, riskData]);

  return (
    <Map
      ref={mapRef}
      initialViewState={US_VIEW}
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
    >
      <Source id="risk-combined" type="geojson" data={combinedGeoJSON()}>
        <Layer
          id="risk-heatmap"
          type="heatmap"
          paint={{
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
            'heatmap-intensity': [
              'interpolate', ['linear'], ['zoom'],
              0, 0.5 * timeFactor,
              3, 0.9 * timeFactor,
              6, 1.6 * timeFactor,
              12, 3.0 * timeFactor,
              15, 5.0 * timeFactor,
            ],
            'heatmap-color': RISK_COLORS,
            'heatmap-radius': [
              'interpolate', ['linear'], ['zoom'],
              0, 14, 3, 24, 6, 40, 9, 60, 14, 85,
            ],
            'heatmap-opacity': 0.85,
          } as any}
        />
      </Source>

      {riskData && (
        <Marker longitude={riskData.lng} latitude={riskData.lat} anchor="center">
          <div className="active-marker" title={riskData.address} />
        </Marker>
      )}

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
