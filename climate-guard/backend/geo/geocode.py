from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from backend.config import settings

geolocator = Nominatim(user_agent="climate-guard-mvp")

# Known-good coordinates for demo addresses — overrides geocoder to avoid ocean placement
KNOWN_COORDS: dict[str, tuple[float, float]] = {
    "125 ocean drive, miami fl 33139":          (25.7781, -80.1300),
    "1000 brickell ave, miami fl 33131":        (25.7587, -80.1918),
    "8800 sw 232nd st, miami fl 33190":         (25.5435, -80.3754),
    "16001 collins ave, sunny isles fl 33160":  (25.9412, -80.1220),
    "3 island ave, miami beach fl 33139":       (25.7825, -80.1408),
}

def geocode_address(address: str) -> tuple[float, float]:
    key = address.lower().strip()
    if key in KNOWN_COORDS:
        return KNOWN_COORDS[key]
    try:
        location = geolocator.geocode(address, timeout=10, country_codes=['us'])
        if not location:
            raise ValueError(f"Could not geocode address: {address}")
        return location.latitude, location.longitude
    except GeocoderTimedOut:
        raise ValueError("Geocoding service timed out")

def is_in_miami_zone(lat: float, lng: float) -> bool:
    return (
        settings.miami_bbox_south <= lat <= settings.miami_bbox_north and
        settings.miami_bbox_west <= lng <= settings.miami_bbox_east
    )
