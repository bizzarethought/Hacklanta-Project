from backend.models.risk import HazardDetail, RiskProfile
from backend.risk.mock_client import get_mock_risk_hazards, get_mock_premium
from backend.geo.geocode import geocode_address, is_in_miami_zone

WEIGHTS = {
    "flood":   0.30,
    "fire":    0.25,
    "wind":    0.20,
    "heat":    0.15,
    "seismic": 0.10,
}

def compute_composite(hazards: dict[str, HazardDetail]) -> int:
    raw = sum(hazards[h].score * WEIGHTS[h] for h in WEIGHTS)
    return min(100, int(raw * 10))

def build_risk_profile(address: str, insured_value: int = 1_200_000) -> RiskProfile:
    lat, lng = geocode_address(address)
    in_miami = is_in_miami_zone(lat, lng)
    hazards = get_mock_risk_hazards(lat, lng)
    composite = compute_composite(hazards)
    premium = get_mock_premium(composite, insured_value)

    return RiskProfile(
        address=address,
        lat=lat,
        lng=lng,
        composite_score=composite,
        hazards=hazards,
        annual_premium_estimate=premium,
        insured_value=insured_value,
        state="FL",
        fair_plan_stress=composite > 70,
        in_miami_zone=in_miami,
    )
