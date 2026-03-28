from fastapi import APIRouter
from typing import Dict, Any, List
import random

router = APIRouter(prefix="/properties", tags=["Properties"])

@router.get("/")
def get_nearby_properties(lat: float, lng: float, radius: int = 5) -> List[Dict[str, Any]]:
    # Generate mock properties dynamically around the provided lat/lng
    properties = []
    
    # Force 125 ocean drive as center if lat lng matches
    if 25.7 < lat < 25.8 and -80.2 < lng < -80.0:
        base_score = 84
    else:
        base_score = 50

    for i in range(15):
        # random jitter
        jitter_lat = (random.random() - 0.5) * 0.01
        jitter_lng = (random.random() - 0.5) * 0.01
        score_jitter = random.randint(-15, 15)

        properties.append({
            "id": f"prop-{i}",
            "lat": lat + jitter_lat,
            "lng": lng + jitter_lng,
            "composite_score": max(0, min(100, base_score + score_jitter)),
            "address": f"{random.randint(100, 999)} Near Address"
        })

    return properties
