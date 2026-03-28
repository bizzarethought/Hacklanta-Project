from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from backend.config import settings

geolocator = Nominatim(user_agent="climate-guard-mvp")

# Known-good coordinates for demo addresses — overrides geocoder to avoid ocean placement
KNOWN_COORDS: dict[str, tuple[float, float, str]] = {
    "125 ocean drive, miami fl 33139":          (25.7781, -80.1300, "FL"),
    "1000 brickell ave, miami fl 33131":        (25.7587, -80.1918, "FL"),
    "8800 sw 232nd st, miami fl 33190":         (25.5435, -80.3754, "FL"),
    "16001 collins ave, sunny isles fl 33160":   (25.9412, -80.1220, "FL"),
    "3 island ave, miami beach fl 33139":        (25.7825, -80.1408, "FL"),
}

# US state name → 2-letter code
_STATE_CODES: dict[str, str] = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "district of columbia": "DC", "florida": "FL", "georgia": "GA", "hawaii": "HI",
    "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME",
    "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
    "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
    "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
    "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI",
    "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX",
    "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "puerto rico": "PR", "u.s. virgin islands": "VI", "guam": "GU",
}


def _extract_state(raw: dict | None) -> str:
    """Extract 2-letter state code from Nominatim address dict."""
    if not raw:
        return "US"
    state_name = raw.get("state", "")
    code = _STATE_CODES.get(state_name.lower().strip())
    if code:
        return code
    # Sometimes Nominatim returns the abbreviation directly
    if len(state_name) == 2 and state_name.upper() in _STATE_CODES.values():
        return state_name.upper()
    return "US"


def geocode_address(address: str) -> tuple[float, float, str]:
    """
    Geocode an address string to (lat, lng, state_code).
    Returns 2-letter state code (e.g. 'FL') or 'US' for international/unknown.
    """
    key = address.lower().strip()
    if key in KNOWN_COORDS:
        return KNOWN_COORDS[key]
    try:
        location = geolocator.geocode(address, timeout=10, addressdetails=True)
        if not location:
            raise ValueError(f"Could not geocode address: {address}")
        raw = location.raw.get("address", {})
        state = _extract_state(raw)
        return location.latitude, location.longitude, state
    except GeocoderTimedOut:
        raise ValueError("Geocoding service timed out")


def is_in_miami_zone(lat: float, lng: float) -> bool:
    return (
        settings.miami_bbox_south <= lat <= settings.miami_bbox_north and
        settings.miami_bbox_west <= lng <= settings.miami_bbox_east
    )
