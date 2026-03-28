"""
USACE National Structure Inventory (NSI) API client.
Free, no API key required.
Returns building type, structure value, occupancy classification for any US coordinate.
"""
import httpx
import math
from backend.models.risk import PropertyInfo

NSI_API = "https://nsi.sec.usace.army.mil/nsiapi/structures"

# HAZUS occupancy type → human-readable label
OCCTYPE_LABELS: dict[str, str] = {
    "RES1": "Single-Family Residential",
    "RES2": "Mobile/Manufactured Home",
    "RES3": "Multi-Family Residential",
    "RES4": "Temporary Lodging",
    "RES5": "Institutional Dormitory",
    "RES6": "Nursing Home",
    "COM1": "Retail Trade",
    "COM2": "Wholesale Trade",
    "COM3": "Personal/Repair Services",
    "COM4": "Professional/Technical",
    "COM5": "Banking/Financial",
    "COM6": "Hospital/Medical",
    "COM7": "Medical Office/Clinic",
    "COM8": "Entertainment/Recreation",
    "COM9": "Theaters/Performing Arts",
    "COM10": "Parking Garage",
    "IND1": "Heavy Industrial",
    "IND2": "Light Industrial",
    "IND3": "Food/Drug/Chemical",
    "IND4": "Metals/Minerals Processing",
    "IND5": "High Technology",
    "IND6": "Construction",
    "AGR1": "Agriculture",
    "REL1": "Religious/Non-Profit",
    "GOV1": "Government General",
    "GOV2": "Government Emergency",
    "EDU1": "Schools/Libraries",
    "EDU2": "Colleges/Universities",
}

# st_damcat → simplified damage category
DAMCAT_MAP: dict[str, str] = {
    "RES": "RES",
    "COM": "COM",
    "IND": "IND",
    "PUB": "PUB",
    "AGR": "AGR",
    "GOV": "PUB",
    "EDU": "PUB",
    "REL": "COM",
}

FOUNDATION_LABELS: dict[str, str] = {
    "S": "Slab-on-Grade",
    "C": "Crawlspace",
    "B": "Basement",
    "P": "Pier/Pile",
    "F": "Fill",
}


def _occtype_to_label(occtype: str) -> str:
    """Convert NSI occtype code (e.g. 'RES1-1SNB') to a human-readable label."""
    base = occtype.split("-")[0] if occtype else ""
    return OCCTYPE_LABELS.get(base, f"Other ({occtype})")


def _distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Approximate distance in meters between two lat/lng points."""
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return 6371000 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_nsi_property_data(lat: float, lng: float) -> PropertyInfo | None:
    """
    Query USACE NSI for the nearest structure to the given coordinates.
    Uses a small bounding box (~100m) to find nearby structures.
    Returns None if no structures found or API fails.
    """
    try:
        # ~0.001 degrees ≈ 111 meters
        delta = 0.001
        bbox = f"{lng - delta},{lat - delta},{lng + delta},{lat + delta}"
        resp = httpx.get(NSI_API, params={"bbox": bbox, "fmt": "fc"}, timeout=15)
        data = resp.json()

        features = data.get("features", [])
        if not features:
            # Expand search to ~500m
            delta = 0.005
            bbox = f"{lng - delta},{lat - delta},{lng + delta},{lat + delta}"
            resp = httpx.get(NSI_API, params={"bbox": bbox, "fmt": "fc"}, timeout=15)
            data = resp.json()
            features = data.get("features", [])

        if not features:
            return None

        # Find nearest structure
        best = None
        best_dist = float("inf")
        for feat in features:
            coords = feat.get("geometry", {}).get("coordinates", [0, 0])
            d = _distance(lat, lng, coords[1], coords[0])
            if d < best_dist:
                best_dist = d
                best = feat

        if not best:
            return None

        props = best.get("properties", {})
        occtype = props.get("occtype", "")
        st_damcat = props.get("st_damcat", "")
        val_struct = props.get("val_struct")
        val_cont = props.get("val_cont")
        num_story = props.get("num_story")
        found_type = props.get("found_type", "")
        med_yr_blt = props.get("med_yr_blt")

        return PropertyInfo(
            building_type=_occtype_to_label(occtype),
            damage_category=DAMCAT_MAP.get(st_damcat, "UNKNOWN"),
            structure_value=int(val_struct) if val_struct else None,
            contents_value=int(val_cont) if val_cont else None,
            num_stories=int(num_story) if num_story else None,
            year_built=int(med_yr_blt) if med_yr_blt else None,
            foundation_type=FOUNDATION_LABELS.get(found_type, found_type or None),
            source="USACE NSI",
        )
    except Exception:
        return None
