import httpx
from backend.config import settings

# Known-good coordinates for demo addresses — overrides geocoder to avoid ocean placement
KNOWN_COORDS: dict[str, tuple[float, float, str]] = {
    "125 ocean drive, miami fl 33139":          (25.7781, -80.1300, "FL"),
    "1000 brickell ave, miami fl 33131":        (25.7587, -80.1918, "FL"),
    "8800 sw 232nd st, miami fl 33190":         (25.5435, -80.3754, "FL"),
    "16001 collins ave, sunny isles fl 33160":  (25.9412, -80.1220, "FL"),
    "3 island ave, miami beach fl 33139":       (25.7825, -80.1408, "FL"),
}

_NOMINATIM_HEADERS = {"User-Agent": "climate-guard-hackathon-2026/1.0"}

_STATE_FROM_NOMINATIM: dict[str, str] = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
    "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
    "Wisconsin": "WI", "Wyoming": "WY", "Puerto Rico": "PR",
    "District of Columbia": "DC",
}


def _census(address: str) -> tuple[float, float, str] | None:
    """US Census geocoder — precise, no rate limit, needs full address."""
    try:
        resp = httpx.get(
            "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress",
            params={"address": address, "benchmark": "Public_AR_Current", "format": "json"},
            timeout=12,
        )
        resp.raise_for_status()
        matches = resp.json().get("result", {}).get("addressMatches", [])
        if not matches:
            return None
        coords = matches[0]["coordinates"]
        state = matches[0].get("addressComponents", {}).get("state", "US").upper()
        return float(coords["y"]), float(coords["x"]), state if len(state) == 2 else "US"
    except Exception:
        return None


def _nominatim(address: str) -> tuple[float, float, str] | None:
    """Nominatim fallback — handles partial/fuzzy US addresses."""
    try:
        resp = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1, "addressdetails": 1, "countrycodes": "us"},
            headers=_NOMINATIM_HEADERS,
            timeout=12,
        )
        resp.raise_for_status()
        results = resp.json()
        if not results:
            return None
        r = results[0]
        lat, lng = float(r["lat"]), float(r["lon"])
        state_name = r.get("address", {}).get("state", "")
        state = _STATE_FROM_NOMINATIM.get(state_name, "US")
        return lat, lng, state
    except Exception:
        return None


def geocode_address(address: str) -> tuple[float, float, str]:
    """
    Geocode an address string to (lat, lng, state_code).
    Tries Census first (precise, no rate limit), falls back to Nominatim (fuzzy).
    """
    key = address.lower().strip()
    if key in KNOWN_COORDS:
        return KNOWN_COORDS[key]

    result = _census(address) or _nominatim(address)
    if result:
        return result

    raise ValueError(
        f"Could not geocode '{address}'. "
        "Try including city and state, e.g. '123 Main St, Miami FL'."
    )


def is_in_miami_zone(lat: float, lng: float) -> bool:
    return (
        settings.miami_bbox_south <= lat <= settings.miami_bbox_north and
        settings.miami_bbox_west <= lng <= settings.miami_bbox_east
    )
