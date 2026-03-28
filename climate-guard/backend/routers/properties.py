from fastapi import APIRouter
from backend.geo.geocode import is_in_miami_zone

router = APIRouter(prefix="/properties", tags=["properties"])

DEMO_PROPERTIES = [
    {"id": 1, "address": "125 Ocean Drive, Miami FL 33139",        "lat": 25.7617, "lng": -80.1300, "composite_score": 84},
    {"id": 2, "address": "1000 Brickell Ave, Miami FL 33131",      "lat": 25.7587, "lng": -80.1918, "composite_score": 72},
    {"id": 3, "address": "8800 SW 232nd St, Miami FL 33190",       "lat": 25.5435, "lng": -80.3754, "composite_score": 65},
    {"id": 4, "address": "16001 Collins Ave, Sunny Isles FL 33160","lat": 25.9412, "lng": -80.1220, "composite_score": 78},
    {"id": 5, "address": "3 Island Ave, Miami Beach FL 33139",     "lat": 25.7825, "lng": -80.1408, "composite_score": 81},
]

@router.get("")
async def list_properties():
    return DEMO_PROPERTIES
