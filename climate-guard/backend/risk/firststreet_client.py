import httpx
from backend.models.risk import HazardDetail
from backend.risk.mock_client import MIAMI_COASTAL_SEED, _deterministic_offset
from backend.config import settings


def get_fire_score(lat: float, lng: float) -> HazardDetail:
    """NASA FIRMS VIIRS NRT — active fire detections within ~170 km over last 7 days."""
    try:
        if not settings.nasa_firms_key:
            raise ValueError("No NASA FIRMS key configured")
        # 1.5° bbox ≈ ~170 km radius
        bbox = f"{lng - 1.5},{lat - 1.5},{lng + 1.5},{lat + 1.5}"
        url = (
            f"https://firms.modaps.eosdis.nasa.gov/api/area/csv"
            f"/{settings.nasa_firms_key}/VIIRS_SNPP_NRT/{bbox}/7"
        )
        resp = httpx.get(url, timeout=15)
        lines = [
            l for l in resp.text.strip().split("\n")
            if l and not l.startswith("latitude") and not l.startswith("error")
        ]
        fire_count = len(lines)
        score = min(10, max(1, fire_count + 1))
        trajectory = "increasing" if fire_count > 3 else "stationary"
        return HazardDetail(
            score=score,
            source=f"NASA FIRMS VIIRS ({fire_count} detections/7d)",
            trajectory=trajectory,
        )
    except Exception:
        base = MIAMI_COASTAL_SEED["fire"]
        offset = _deterministic_offset(lat, lng, "fire")
        return HazardDetail(
            score=max(1, min(10, base["score"] + offset)),
            source="NASA FIRMS (mock fallback)",
            trajectory=base["trajectory"],
        )
