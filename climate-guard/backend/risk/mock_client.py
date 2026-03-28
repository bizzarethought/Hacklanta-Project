import hashlib
from backend.models.risk import HazardDetail

MIAMI_COASTAL_SEED = {
    "flood":   {"score": 10, "source": "First Street (mock)", "trajectory": "increasing"},
    "fire":    {"score": 3, "source": "First Street (mock)", "trajectory": "stationary"},
    "wind":    {"score": 10, "source": "NOAA (mock)",         "trajectory": "increasing"},
    "heat":    {"score": 9, "source": "First Street (mock)", "trajectory": "increasing"},
    "seismic": {"score": 2, "source": "USGS (mock)",         "trajectory": "stationary"},
}

def _deterministic_offset(lat: float, lng: float, hazard: str) -> int:
    seed = hashlib.md5(f"{lat:.3f}{lng:.3f}{hazard}".encode()).hexdigest()
    return (int(seed[:2], 16) % 3) - 1  # returns -1, 0, or 1

def get_mock_risk_hazards(lat: float, lng: float) -> dict[str, HazardDetail]:
    hazards = {}
    for hazard, base in MIAMI_COASTAL_SEED.items():
        offset = _deterministic_offset(lat, lng, hazard)
        score = max(1, min(10, base["score"] + offset))
        hazards[hazard] = HazardDetail(
            score=score,
            source=base["source"],
            trajectory=base["trajectory"]
        )
    return hazards

def get_mock_premium(composite_score: int, insured_value: int) -> int:
    base_rate = 0.005 + (composite_score / 100) * 0.012
    return int(insured_value * base_rate)
