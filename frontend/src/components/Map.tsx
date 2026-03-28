import { useRef, useEffect, useState } from 'react';
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

// Named geographic risk hotspots — flood, wildfire, hurricane, coastal erosion
// Each point is a real place with a calibrated risk weight (0–1)
const GLOBAL_RISK_POINTS: { lat: number; lng: number; weight: number }[] = [
  // ── Florida — extreme flood + hurricane ──
  { lat: 25.77,  lng: -80.19, weight: 0.97 }, // Miami
  { lat: 25.78,  lng: -80.13, weight: 0.95 }, // Miami Beach / Ocean Drive
  { lat: 26.12,  lng: -80.14, weight: 0.91 }, // Fort Lauderdale
  { lat: 26.71,  lng: -80.05, weight: 0.88 }, // West Palm Beach
  { lat: 25.47,  lng: -80.47, weight: 0.85 }, // Homestead / South Dade
  { lat: 24.56,  lng: -81.78, weight: 0.93 }, // Key West
  { lat: 24.71,  lng: -81.10, weight: 0.90 }, // Marathon Keys
  { lat: 27.34,  lng: -82.54, weight: 0.83 }, // Sarasota
  { lat: 26.64,  lng: -81.87, weight: 0.82 }, // Fort Myers
  { lat: 27.77,  lng: -82.64, weight: 0.86 }, // St. Petersburg
  { lat: 27.95,  lng: -82.46, weight: 0.84 }, // Tampa
  { lat: 29.19,  lng: -81.04, weight: 0.72 }, // Daytona Beach
  { lat: 30.33,  lng: -81.66, weight: 0.70 }, // Jacksonville coast

  // ── Gulf Coast — flood + hurricane ──
  { lat: 29.95,  lng: -90.07, weight: 0.92 }, // New Orleans
  { lat: 29.38,  lng: -89.10, weight: 0.88 }, // Plaquemines Parish
  { lat: 30.37,  lng: -88.72, weight: 0.80 }, // Biloxi / Gulfport
  { lat: 30.69,  lng: -88.04, weight: 0.76 }, // Mobile Bay
  { lat: 30.27,  lng: -87.57, weight: 0.78 }, // Pensacola
  { lat: 29.76,  lng: -95.37, weight: 0.82 }, // Houston
  { lat: 29.30,  lng: -94.80, weight: 0.85 }, // Galveston
  { lat: 27.80,  lng: -97.40, weight: 0.78 }, // Corpus Christi
  { lat: 25.90,  lng: -97.49, weight: 0.75 }, // Brownsville

  // ── US East Coast — coastal flood + nor'easters ──
  { lat: 32.78,  lng: -79.94, weight: 0.65 }, // Charleston SC
  { lat: 33.45,  lng: -79.06, weight: 0.60 }, // Myrtle Beach
  { lat: 35.23,  lng: -75.60, weight: 0.70 }, // Outer Banks NC
  { lat: 36.85,  lng: -75.98, weight: 0.63 }, // Virginia Beach
  { lat: 38.97,  lng: -74.91, weight: 0.62 }, // Atlantic City NJ
  { lat: 40.58,  lng: -74.15, weight: 0.60 }, // Staten Island / Sandy hook
  { lat: 40.70,  lng: -73.94, weight: 0.58 }, // NYC coastal
  { lat: 41.36,  lng: -72.10, weight: 0.50 }, // New Haven coast
  { lat: 42.36,  lng: -71.06, weight: 0.46 }, // Boston Harbor

  // ── California — wildfire ──
  { lat: 34.05,  lng: -118.24, weight: 0.74 }, // Los Angeles
  { lat: 34.20,  lng: -118.87, weight: 0.80 }, // Malibu / Woolsey Fire zone
  { lat: 34.41,  lng: -119.70, weight: 0.72 }, // Santa Barbara
  { lat: 37.33,  lng: -121.89, weight: 0.66 }, // San Jose foothills
  { lat: 37.80,  lng: -122.27, weight: 0.55 }, // Oakland / East Bay hills
  { lat: 38.58,  lng: -122.25, weight: 0.70 }, // Napa wine country
  { lat: 38.82,  lng: -122.82, weight: 0.72 }, // Sonoma / Tubbs Fire zone
  { lat: 39.73,  lng: -121.84, weight: 0.75 }, // Paradise / Camp Fire
  { lat: 40.59,  lng: -122.39, weight: 0.65 }, // Redding / Carr Fire
  { lat: 32.72,  lng: -117.15, weight: 0.58 }, // San Diego

  // ── Pacific Northwest — wildfire ──
  { lat: 42.44,  lng: -122.88, weight: 0.60 }, // Medford OR
  { lat: 44.05,  lng: -121.31, weight: 0.58 }, // Bend OR
  { lat: 47.51,  lng: -120.50, weight: 0.55 }, // Wenatchee WA
  { lat: 48.42,  lng: -119.50, weight: 0.52 }, // Okanogan WA

  // ── Caribbean — hurricane + storm surge ──
  { lat: 18.47,  lng: -66.11, weight: 0.85 }, // San Juan PR
  { lat: 17.99,  lng: -66.61, weight: 0.82 }, // Ponce PR
  { lat: 18.01,  lng: -76.79, weight: 0.78 }, // Kingston Jamaica
  { lat: 19.43,  lng: -70.69, weight: 0.80 }, // Dominican Republic coast
  { lat: 20.03,  lng: -75.82, weight: 0.82 }, // Cuba east
  { lat: 23.13,  lng: -82.38, weight: 0.84 }, // Havana
  { lat: 18.35,  lng: -64.93, weight: 0.77 }, // US Virgin Islands
  { lat: 17.35,  lng: -62.73, weight: 0.74 }, // St. Kitts
  { lat: 13.10,  lng: -59.62, weight: 0.70 }, // Barbados

  // ── Mexico Gulf + Pacific coast ──
  { lat: 21.16,  lng: -86.85, weight: 0.80 }, // Cancún
  { lat: 20.97,  lng: -89.62, weight: 0.75 }, // Mérida Yucatán
  { lat: 19.43,  lng: -99.13, weight: 0.55 }, // Mexico City (seismic)
  { lat: 16.87,  lng: -99.88, weight: 0.72 }, // Acapulco
  { lat: 20.67,  lng: -105.22, weight: 0.65 }, // Puerto Vallarta

  // ── Central America — hurricane + volcano ──
  { lat: 15.50,  lng: -88.02, weight: 0.72 }, // Honduras coast
  { lat: 12.11,  lng: -83.38, weight: 0.70 }, // Nicaragua Caribbean coast
  { lat: 9.93,   lng: -84.08, weight: 0.62 }, // Costa Rica

  // ── Colombia / Venezuela coast ──
  { lat: 10.40,  lng: -75.53, weight: 0.60 }, // Cartagena
  { lat: 11.00,  lng: -63.85, weight: 0.58 }, // Venezuela coast

  // ── Amazon flood basin ──
  { lat: -3.10,  lng: -60.03, weight: 0.65 }, // Manaus
  { lat: -1.46,  lng: -48.50, weight: 0.62 }, // Belém
  { lat: 0.05,   lng: -51.07, weight: 0.58 }, // Macapá

  // ── Brazil East Coast — flood + landslide ──
  { lat: -12.97, lng: -38.50, weight: 0.60 }, // Salvador
  { lat: -8.05,  lng: -34.88, weight: 0.58 }, // Recife
  { lat: -22.91, lng: -43.17, weight: 0.68 }, // Rio de Janeiro
  { lat: -23.55, lng: -46.63, weight: 0.62 }, // São Paulo

  // ── Southern Brazil / Uruguay — flood ──
  { lat: -30.03, lng: -51.23, weight: 0.55 }, // Porto Alegre
  { lat: -34.90, lng: -56.17, weight: 0.50 }, // Montevideo

  // ── Midwest USA — tornado alley ──
  { lat: 35.47,  lng: -97.52, weight: 0.55 }, // Oklahoma City
  { lat: 37.69,  lng: -97.34, weight: 0.52 }, // Wichita KS
  { lat: 36.15,  lng: -95.99, weight: 0.50 }, // Tulsa OK
  { lat: 38.25,  lng: -98.20, weight: 0.48 }, // Central Kansas
  { lat: 32.73,  lng: -97.11, weight: 0.50 }, // Dallas-Fort Worth

  // ── Alaska — seismic + coastal flood ──
  { lat: 61.22,  lng: -149.90, weight: 0.65 }, // Anchorage
  { lat: 57.05,  lng: -135.33, weight: 0.58 }, // Sitka
];

export default function MapView({ riskData, year }: { riskData: any; year: number }) {
  const mapRef = useRef<MapRef>(null);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://localhost:8000/properties')
      .then(res => setProperties(res.data))
      .catch(console.error);
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

  const features: GeoJSON.Feature[] = [
    ...GLOBAL_RISK_POINTS.map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: { weight: p.weight },
    })),
    ...properties.map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: { weight: p.composite_score / 100 },
    })),
    ...(riskData ? [{
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [riskData.lng, riskData.lat] },
      properties: { weight: Math.min(1, riskData.composite_score / 100) },
    }] : []),
  ];

  const geojson: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };

  return (
    <Map
      ref={mapRef}
      initialViewState={US_VIEW}
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
    >
      <Source id="risk-heat" type="geojson" data={geojson}>
        <Layer
          id="risk-heatmap"
          type="heatmap"
          paint={{
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.4, 6, 1.2, 12, 2.5, 15, 4],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,    'rgba(0,0,0,0)',
              0.05, 'rgba(255,180,50,0.0)',
              0.2,  'rgba(255,160,30,0.35)',
              0.4,  'rgba(255,110,0,0.55)',
              0.6,  'rgba(240,60,0,0.72)',
              0.8,  'rgba(210,20,0,0.85)',
              1,    'rgb(170,0,0)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 18, 3, 32, 6, 45, 9, 60, 15, 80],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.75, 14, 0.6],
          } as any}
        />
      </Source>

      {/* Active address marker */}
      {riskData && (
        <Marker longitude={riskData.lng} latitude={riskData.lat} anchor="center">
          <div
            title={riskData.address}
            style={{
              width: 16, height: 16,
              borderRadius: '50%',
              background: '#00d4ff',
              border: '2px solid white',
              boxShadow: '0 0 14px 5px rgba(0,212,255,0.75)',
            }}
          />
        </Marker>
      )}

      {/* Risk legend */}
      <div style={{
        position: 'absolute', bottom: 32, right: 16,
        background: 'rgba(10,15,30,0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 14px',
        color: 'white', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[
          { color: 'rgba(255,140,0,0.8)', label: 'Flood Risk' },
          { color: 'rgba(220,50,0,0.9)',  label: 'Wildfire' },
          { color: 'rgb(160,0,0)',         label: 'Coastal Erosion' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
            <span style={{ color: '#ccc' }}>{label}</span>
          </div>
        ))}
      </div>
    </Map>
  );
}
