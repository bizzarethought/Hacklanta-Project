import httpx
from backend.models.risk import HazardDetail
from backend.risk.mock_client import MIAMI_COASTAL_SEED, _deterministic_offset

ZONE_SCORES = {
    "VE": 10, "V": 10,
    "AE": 9,  "AO": 8, "AH": 8, "A": 8,
    "AR": 7,  "A99": 6,
    "D": 4,
    "B": 3,   "X": 2, "C": 2,
}
ZONE_TRAJECTORY = {
    "VE": "increasing", "V": "increasing",
    "AE": "increasing", "AO": "increasing", "AH": "increasing", "A": "increasing",
    "AR": "stationary", "A99": "stationary",
    "B": "stationary",  "X": "stationary",  "C": "stationary",  "D": "stationary",
}

def get_fema_flood_score(lat: float, lng: float) -> HazardDetail:
    try:
        url = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
        params = {
            "geometry": f"{lng},{lat}",
            "geometryType": "esriGeometryPoint",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            "outFields": "FLD_ZONE",
            "returnGeometry": "false",
            "f": "json",
        }
        resp = httpx.get(url, params=params, timeout=12)
        features = resp.json().get("features", [])
        zone = features[0]["attributes"]["FLD_ZONE"].strip() if features else "X"
        score = ZONE_SCORES.get(zone, 3)
        trajectory = ZONE_TRAJECTORY.get(zone, "stationary")
        return HazardDetail(score=score, source=f"FEMA NFHL (Zone {zone})", trajectory=trajectory)
    except Exception:
        base = MIAMI_COASTAL_SEED["flood"]
        offset = _deterministic_offset(lat, lng, "flood")
        return HazardDetail(
            score=max(1, min(10, base["score"] + offset)),
            source="FEMA NFHL (mock fallback)",
            trajectory=base["trajectory"],
        )
