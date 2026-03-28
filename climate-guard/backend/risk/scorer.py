from backend.models.risk import HazardDetail, RiskProfile
from backend.risk.fema_client import get_fema_flood_score
from backend.risk.noaa_client import get_heat_wind_scores, get_seismic_score
from backend.risk.firststreet_client import get_fire_score
from backend.risk.nsi_client import get_nsi_property_data
from backend.risk.disaster_client import get_disaster_history
from backend.risk.premium import estimate_premium, get_default_insured_value
from backend.geo.geocode import geocode_address, is_in_miami_zone
from backend.models.risk import PropertyInfo

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

def build_risk_profile(
    address: str,
    insured_value: int | None = None,
    user_premium: int | None = None,
    building_type: str | None = None,
) -> RiskProfile:
    lat, lng, state = geocode_address(address)
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

    # --- Property info from NSI ---
    nsi_data = get_nsi_property_data(lat, lng)
    if nsi_data:
        property_info = nsi_data
    elif building_type:
        # User provided building type override
        property_info = PropertyInfo(
            building_type=building_type,
            damage_category="RES" if "Residential" in building_type else "COM",
            structure_value=insured_value,
            contents_value=None,
            num_stories=None,
            year_built=None,
            foundation_type=None,
            source="user_input",
        )
    else:
        property_info = None

    # --- Determine insured value ---
    if insured_value is not None:
        final_insured = insured_value
    elif nsi_data and nsi_data.structure_value:
        final_insured = nsi_data.structure_value
    else:
        dam_cat = property_info.damage_category if property_info else "RES"
        final_insured = get_default_insured_value(dam_cat)

    # --- Estimate premium ---
    dam_cat = property_info.damage_category if property_info else "RES"
    premium = estimate_premium(state, final_insured, composite, dam_cat, user_premium)

    # --- Disaster history ---
    disasters = get_disaster_history(state)

    return RiskProfile(
        address=address,
        lat=lat,
        lng=lng,
        composite_score=composite,
        hazards=hazards,
        annual_premium_estimate=premium,
        insured_value=final_insured,
        state=state,
        fair_plan_stress=composite > 55,
        in_miami_zone=in_miami,
        property_info=property_info,
        disaster_history=disasters,
        user_provided_premium=user_premium,
    )
