from fastapi import APIRouter
from typing import Dict, Any

from geo.geocode import get_lat_lng
from geo.spatial import get_spatial_hazards
from risk.fema_client import mock_openfema_flood_risk
from risk.noaa_client import mock_noaa_wind_seismic_risk
from risk.firststreet_client import mock_firststreet_fire_heat
from risk.scorer import calculate_composite_score

router = APIRouter(prefix="/risk", tags=["Risk"])

@router.get("/")
def get_risk_profile(address: str) -> Dict[str, Any]:
    # 1. Geocode
    location = get_lat_lng(address)
    if not location:
        # Fallback
        lat, lng, formatted_address = 34.0522, -118.2437, address
    else:
        lat, lng, formatted_address = location

    # 2. Spatial Join
    spatial_data = get_spatial_hazards(lat, max(lng, -180)) # Ensure valid lng

    # 3. Assemble Risk Client Data
    fema_data = mock_openfema_flood_risk(lat, lng, spatial_data)
    noaa_data = mock_noaa_wind_seismic_risk(lat, lng)
    fs_data = mock_firststreet_fire_heat(lat, lng, spatial_data)

    hazards = {
        "flood": fema_data,
        "fire": fs_data["fire"],
        "wind": noaa_data["wind"],
        "heat": fs_data["heat"],
        "seismic": noaa_data["seismic"]
    }

    # 4. Composite Score
    score = calculate_composite_score(hazards)

    # Base premium simple simulation
    if "125 ocean" in formatted_address.lower():
        annual_premium = 9450
        insured_value = 1200000
        state = "FL"
        fair_plan_stress = True
    else:
        annual_premium = 4500
        insured_value = 850000
        state = "CA"
        fair_plan_stress = score > 60

    return {
        "address": formatted_address,
        "lat": lat,
        "lng": lng,
        "composite_score": score,
        "hazards": hazards,
        "annual_premium_estimate": annual_premium,
        "insured_value": insured_value,
        "state": state,
        "fair_plan_stress": fair_plan_stress
    }

@router.get("/recommendations")
def get_recommendations(address: str) -> Dict[str, Any]:
    # Dev 3 mock response block
    if "125 ocean" in address.lower():
        return {
          "summary": "This coastal Miami property carries extreme flood and wind risk, both of which are projected to worsen significantly by 2040 due to sea level rise and intensifying hurricane activity.",
          "improvements": [
            { "action": "Elevated HVAC Unit", "cost_usd": 12000, "annual_saving_usd": 1900, "roi_pct": 16 },
            { "action": "Impact Windows",     "cost_usd": 25000, "annual_saving_usd": 2400, "roi_pct": 9.6 },
            { "action": "Fortified Roof",     "cost_usd": 38000, "annual_saving_usd": 3100, "roi_pct": 8.2 }
          ],
          "insurers": [
            { "name": "Citizens Property Insurance", "coverage_type": "Wind + Flood", "notes": "FL state insurer of last resort - FAIR Plan equivalent" },
            { "name": "Universal Property",          "coverage_type": "Full coverage", "notes": "Active in FL, competitive for fortified homes" }
          ]
        }
        
    return {
        "summary": "Moderate risk profile with primary exposure to wildfire. Mitigation through brush clearance and vent screening is highly recommended.",
        "improvements": [
            { "action": "Defensible Space Clearing", "cost_usd": 1500, "annual_saving_usd": 300, "roi_pct": 20.0 },
            { "action": "Ember-resistant Vents",     "cost_usd": 3000, "annual_saving_usd": 450, "roi_pct": 15.0 }
        ],
        "insurers": [
            { "name": "State Farm", "coverage_type": "Standard HO-3", "notes": "Standard provider, may require brush clearance proof" }
        ]
    }

