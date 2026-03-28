from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from backend.config import settings

geolocator = Nominatim(user_agent="climate-guard-mvp")

def geocode_address(address: str) -> tuple[float, float]:
    try:
        location = geolocator.geocode(address, timeout=10)
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
