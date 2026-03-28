from backend.models.risk import HazardDetail, RiskProfile
from backend.risk.fema_client import get_fema_flood_score
from backend.risk.noaa_client import get_heat_wind_scores, get_seismic_score
from backend.risk.firststreet_client import get_fire_score
from backend.risk.mock_client import get_mock_premium
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

    flood   = get_fema_flood_score(lat, lng)
    hw      = get_heat_wind_scores(lat, lng)
    seismic = get_seismic_score(lat, lng)
    fire    = get_fire_score(lat, lng)

    hazards: dict[str, HazardDetail] = {
        "flood":   flood,
        "fire":    fire,
        "wind":    hw["wind"],
        "heat":    hw["heat"],
        "seismic": seismic,
    }

    composite = compute_composite(hazards)
    premium   = get_mock_premium(composite, insured_value)

    return RiskProfile(
        address=address,
        lat=lat,
        lng=lng,
        composite_score=composite,
        hazards=hazards,
        annual_premium_estimate=premium,
        insured_value=insured_value,
        state="FL",
        fair_plan_stress=composite > 55,
        in_miami_zone=in_miami,
    )
