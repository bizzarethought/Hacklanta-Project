"""
Per-hazard heatmap GeoJSON data provider.
Splits the monolithic heatmap into separate hazard-specific layers
with calibrated weights and distinct data characteristics.
"""

# Named geographic risk hotspots calibrated per hazard type.
# Each hazard has its own weight distribution based on real geographic risk.

HAZARD_LAYERS: dict[str, list[dict]] = {
    "flood": [
        # Florida / Gulf Coast — extreme flood
        {"lat": 25.77, "lng": -80.19, "w": 0.97}, {"lat": 25.78, "lng": -80.13, "w": 0.95},
        {"lat": 26.12, "lng": -80.14, "w": 0.91}, {"lat": 26.71, "lng": -80.05, "w": 0.88},
        {"lat": 24.56, "lng": -81.78, "w": 0.93}, {"lat": 26.64, "lng": -81.87, "w": 0.82},
        {"lat": 27.95, "lng": -82.46, "w": 0.84}, {"lat": 29.19, "lng": -81.04, "w": 0.72},
        # Gulf Coast
        {"lat": 29.95, "lng": -90.07, "w": 0.95}, {"lat": 29.38, "lng": -89.10, "w": 0.90},
        {"lat": 30.37, "lng": -88.72, "w": 0.82}, {"lat": 29.76, "lng": -95.37, "w": 0.85},
        {"lat": 29.30, "lng": -94.80, "w": 0.88}, {"lat": 27.80, "lng": -97.40, "w": 0.78},
        # East Coast
        {"lat": 32.78, "lng": -79.94, "w": 0.68}, {"lat": 35.23, "lng": -75.60, "w": 0.75},
        {"lat": 36.85, "lng": -75.98, "w": 0.65}, {"lat": 38.97, "lng": -74.91, "w": 0.64},
        {"lat": 40.70, "lng": -73.94, "w": 0.60}, {"lat": 42.36, "lng": -71.06, "w": 0.50},
        {"lat": 25.47, "lng": -80.47, "w": 0.85}, {"lat": 25.94, "lng": -80.12, "w": 0.88},
        # Caribbean / Central America
        {"lat": 18.47, "lng": -66.11, "w": 0.85}, {"lat": 21.16, "lng": -86.85, "w": 0.78},
        # Midwest river flooding
        {"lat": 38.63, "lng": -90.20, "w": 0.62}, {"lat": 39.10, "lng": -94.58, "w": 0.58},
        {"lat": 41.26, "lng": -95.94, "w": 0.55}, {"lat": 44.98, "lng": -93.27, "w": 0.48},
        # Brazil / S. America
        {"lat": -3.10, "lng": -60.03, "w": 0.65}, {"lat": -22.91, "lng": -43.17, "w": 0.62},
    ],
    "fire": [
        # California — extreme wildfire
        {"lat": 34.20, "lng": -118.87, "w": 0.95}, {"lat": 34.05, "lng": -118.24, "w": 0.80},
        {"lat": 34.41, "lng": -119.70, "w": 0.85}, {"lat": 38.58, "lng": -122.25, "w": 0.82},
        {"lat": 38.82, "lng": -122.82, "w": 0.88}, {"lat": 39.73, "lng": -121.84, "w": 0.92},
        {"lat": 40.59, "lng": -122.39, "w": 0.78}, {"lat": 37.80, "lng": -122.27, "w": 0.65},
        {"lat": 37.33, "lng": -121.89, "w": 0.68}, {"lat": 32.72, "lng": -117.15, "w": 0.58},
        {"lat": 33.95, "lng": -117.40, "w": 0.75}, {"lat": 36.97, "lng": -121.95, "w": 0.60},
        # Pacific Northwest
        {"lat": 42.44, "lng": -122.88, "w": 0.72}, {"lat": 44.05, "lng": -121.31, "w": 0.68},
        {"lat": 47.51, "lng": -120.50, "w": 0.62}, {"lat": 48.42, "lng": -119.50, "w": 0.58},
        {"lat": 46.60, "lng": -120.55, "w": 0.55},
        # Colorado
        {"lat": 40.01, "lng": -105.27, "w": 0.65}, {"lat": 39.86, "lng": -105.08, "w": 0.70},
        # Arizona/New Mexico
        {"lat": 34.20, "lng": -110.10, "w": 0.60}, {"lat": 35.20, "lng": -111.65, "w": 0.55},
        # Texas
        {"lat": 30.27, "lng": -97.74, "w": 0.45}, {"lat": 32.73, "lng": -97.11, "w": 0.40},
    ],
    "wind": [
        # Florida — extreme wind/hurricane
        {"lat": 25.77, "lng": -80.19, "w": 0.95}, {"lat": 25.78, "lng": -80.13, "w": 0.93},
        {"lat": 26.12, "lng": -80.14, "w": 0.88}, {"lat": 24.56, "lng": -81.78, "w": 0.92},
        {"lat": 27.77, "lng": -82.64, "w": 0.85}, {"lat": 27.95, "lng": -82.46, "w": 0.84},
        {"lat": 30.27, "lng": -87.57, "w": 0.80},
        # Gulf Coast
        {"lat": 29.95, "lng": -90.07, "w": 0.90}, {"lat": 30.37, "lng": -88.72, "w": 0.82},
        {"lat": 29.76, "lng": -95.37, "w": 0.78}, {"lat": 29.30, "lng": -94.80, "w": 0.82},
        {"lat": 27.80, "lng": -97.40, "w": 0.75}, {"lat": 25.90, "lng": -97.49, "w": 0.72},
        # East Coast
        {"lat": 32.78, "lng": -79.94, "w": 0.68}, {"lat": 35.23, "lng": -75.60, "w": 0.72},
        {"lat": 36.85, "lng": -75.98, "w": 0.65}, {"lat": 40.58, "lng": -74.15, "w": 0.55},
        # Tornado Alley
        {"lat": 35.47, "lng": -97.52, "w": 0.70}, {"lat": 37.69, "lng": -97.34, "w": 0.65},
        {"lat": 36.15, "lng": -95.99, "w": 0.62}, {"lat": 32.73, "lng": -97.11, "w": 0.58},
        {"lat": 38.25, "lng": -98.20, "w": 0.55},
        # Caribbean
        {"lat": 18.47, "lng": -66.11, "w": 0.88}, {"lat": 18.35, "lng": -64.93, "w": 0.82},
        {"lat": 21.16, "lng": -86.85, "w": 0.80}, {"lat": 19.43, "lng": -70.69, "w": 0.78},
    ],
    "heat": [
        # Desert Southwest
        {"lat": 33.45, "lng": -112.07, "w": 0.95}, {"lat": 36.17, "lng": -115.14, "w": 0.92},
        {"lat": 32.22, "lng": -110.97, "w": 0.88}, {"lat": 35.20, "lng": -111.65, "w": 0.72},
        {"lat": 34.05, "lng": -118.24, "w": 0.78},
        # Texas / Gulf
        {"lat": 29.76, "lng": -95.37, "w": 0.85}, {"lat": 32.73, "lng": -97.11, "w": 0.80},
        {"lat": 29.42, "lng": -98.49, "w": 0.82}, {"lat": 27.80, "lng": -97.40, "w": 0.78},
        # Florida
        {"lat": 25.77, "lng": -80.19, "w": 0.82}, {"lat": 27.95, "lng": -82.46, "w": 0.78},
        {"lat": 28.54, "lng": -81.38, "w": 0.75},
        # Southeast
        {"lat": 33.75, "lng": -84.39, "w": 0.72}, {"lat": 35.15, "lng": -90.05, "w": 0.70},
        {"lat": 32.30, "lng": -90.18, "w": 0.74},
        # Central/Plains
        {"lat": 35.47, "lng": -97.52, "w": 0.68}, {"lat": 38.63, "lng": -90.20, "w": 0.62},
        # International heat zones
        {"lat": 19.43, "lng": -99.13, "w": 0.72}, {"lat": 23.13, "lng": -82.38, "w": 0.75},
        {"lat": -23.55, "lng": -46.63, "w": 0.65},
    ],
    "seismic": [
        # California — extreme seismic
        {"lat": 34.05, "lng": -118.24, "w": 0.90}, {"lat": 37.77, "lng": -122.42, "w": 0.92},
        {"lat": 37.33, "lng": -121.89, "w": 0.85}, {"lat": 36.74, "lng": -119.77, "w": 0.72},
        {"lat": 33.95, "lng": -117.40, "w": 0.78}, {"lat": 32.72, "lng": -117.15, "w": 0.70},
        {"lat": 38.58, "lng": -121.49, "w": 0.68},
        # Pacific Northwest
        {"lat": 47.61, "lng": -122.33, "w": 0.72}, {"lat": 45.52, "lng": -122.68, "w": 0.70},
        {"lat": 48.75, "lng": -122.48, "w": 0.60},
        # Alaska
        {"lat": 61.22, "lng": -149.90, "w": 0.88}, {"lat": 57.05, "lng": -135.33, "w": 0.72},
        # Hawaii (volcanic)
        {"lat": 19.50, "lng": -155.50, "w": 0.65},
        # Intermountain / New Madrid
        {"lat": 40.77, "lng": -111.89, "w": 0.55}, {"lat": 36.17, "lng": -89.53, "w": 0.52},
        {"lat": 36.85, "lng": -76.29, "w": 0.42}, {"lat": 35.96, "lng": -83.92, "w": 0.40},
        # Mexico
        {"lat": 19.43, "lng": -99.13, "w": 0.78},
        # South America
        {"lat": -33.45, "lng": -70.67, "w": 0.82}, {"lat": -12.05, "lng": -77.04, "w": 0.75},
    ],
    "disasters": [
        # Highest disaster declaration density areas (aggregated)
        {"lat": 25.77, "lng": -80.19, "w": 0.92}, {"lat": 29.95, "lng": -90.07, "w": 0.95},
        {"lat": 29.76, "lng": -95.37, "w": 0.88}, {"lat": 34.05, "lng": -118.24, "w": 0.82},
        {"lat": 35.47, "lng": -97.52, "w": 0.78}, {"lat": 29.42, "lng": -98.49, "w": 0.72},
        {"lat": 39.73, "lng": -121.84, "w": 0.85}, {"lat": 30.27, "lng": -87.57, "w": 0.75},
        {"lat": 32.78, "lng": -79.94, "w": 0.65}, {"lat": 35.23, "lng": -75.60, "w": 0.72},
        {"lat": 40.70, "lng": -73.94, "w": 0.62}, {"lat": 38.63, "lng": -90.20, "w": 0.58},
        {"lat": 18.47, "lng": -66.11, "w": 0.90}, {"lat": 37.77, "lng": -122.42, "w": 0.68},
        {"lat": 36.15, "lng": -95.99, "w": 0.60}, {"lat": 30.33, "lng": -81.66, "w": 0.65},
        {"lat": 27.95, "lng": -82.46, "w": 0.72}, {"lat": 24.56, "lng": -81.78, "w": 0.80},
    ],
}

LAYER_META: dict[str, dict] = {
    "flood":     {"label": "Flood Risk",       "icon": "🌊", "color": "#00b4d8"},
    "fire":      {"label": "Wildfire Risk",     "icon": "🔥", "color": "#ff6b35"},
    "wind":      {"label": "Wind / Hurricane",  "icon": "💨", "color": "#c77dff"},
    "heat":      {"label": "Extreme Heat",      "icon": "🌡️", "color": "#ffba08"},
    "seismic":   {"label": "Seismic / Quake",   "icon": "🪨", "color": "#06d6a0"},
    "disasters": {"label": "Disaster History",  "icon": "⚠️", "color": "#ffd60a"},
}


def get_available_layers() -> list[dict]:
    """Return metadata for all available heatmap layers."""
    return [
        {"id": k, **v, "point_count": len(HAZARD_LAYERS[k])}
        for k, v in LAYER_META.items()
    ]


def get_layer_geojson(layer_ids: list[str]) -> dict[str, dict]:
    """
    Return GeoJSON FeatureCollections keyed by layer ID.
    Only returns requested layers.
    """
    result: dict[str, dict] = {}
    for layer_id in layer_ids:
        points = HAZARD_LAYERS.get(layer_id, [])
        features = [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [p["lng"], p["lat"]]},
                "properties": {"weight": p["w"]},
            }
            for p in points
        ]
        result[layer_id] = {
            "type": "FeatureCollection",
            "features": features,
        }
    return result
