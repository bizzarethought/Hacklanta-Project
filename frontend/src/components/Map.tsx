import { useRef, useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';

// Dark basemap template directly from MapTiler/MapLibre open sources without needing key for MVP structure
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: -80.1300,
  latitude: 25.7617,
  zoom: 15.5,
  pitch: 60,
  bearing: -20
};

export default function MapView({ riskData, year }: { riskData: any, year: number }) {
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    // Fetch mock clustered properties to show neighborhood
    axios.get(`http://localhost:8000/properties?lat=${INITIAL_VIEW_STATE.latitude}&lng=${INITIAL_VIEW_STATE.longitude}`)
      .then(res => setProperties(res.data))
      .catch(console.error);
  }, []);

  // Increase "risk severity" weight dynamically as year increases to simulate hazard expansion
  const severityMultiplier = 1 + ((year - 2024) * 0.05);

  return (
    <Map
      initialViewState={INITIAL_VIEW_STATE}
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      style={{width: '100%', height: '100%'}}
    >
      {properties.map((p) => (
        <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="center">
          <div title={`${p.address} — Score: ${p.composite_score}`} className="w-4 h-4 rounded-full border-2 border-white" style={{background: `rgba(0,212,255,${Math.min(1, p.composite_score/100)})`}} />
        </Marker>
      ))}
    </Map>
  );
}
