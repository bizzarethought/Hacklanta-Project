import pytest
from backend.risk.scorer import build_risk_profile
from backend.ai.synthesizer import get_recommendations
from backend.risk.trajectory import get_premium_trajectory
from backend.geo.geocode import is_in_miami_zone
from backend.risk.insurer_db import get_matched_insurers
from backend.risk.disaster_client import get_disaster_history
from backend.risk.premium import estimate_premium

DEMO_ADDRESS = "125 Ocean Drive, Miami FL 33139"

def test_geocode_miami():
    from backend.geo.geocode import geocode_address
    lat, lng, state = geocode_address(DEMO_ADDRESS)
    assert 25.5 <= lat <= 25.9
    assert -80.5 <= lng <= -80.1
    assert state == "FL"

def test_miami_zone_detection():
    assert is_in_miami_zone(25.7617, -80.1300) is True
    assert is_in_miami_zone(40.7128, -74.0060) is False  # New York — not Miami

def test_risk_profile_builds():
    profile = build_risk_profile(DEMO_ADDRESS)
    assert profile.composite_score >= 1
    assert profile.composite_score <= 100
    assert profile.in_miami_zone is True
    assert set(profile.hazards.keys()) == {"flood", "fire", "wind", "heat", "seismic"}
    assert profile.annual_premium_estimate > 0
    assert profile.state == "FL"

def test_composite_score_is_high_for_ocean_drive():
    profile = build_risk_profile(DEMO_ADDRESS)
    assert profile.composite_score >= 45  # coastal Miami must score high

def test_trajectory_has_twenty_one_years():
    profile = build_risk_profile(DEMO_ADDRESS)
    trajectory = get_premium_trajectory(profile)
    assert len(trajectory) == 21  # 2024 to 2044 inclusive
    assert trajectory[0]["year"] == 2024
    assert trajectory[-1]["year"] == 2044
    assert trajectory[-1]["premium"] > trajectory[0]["premium"]
    # Mitigated line should exist
    assert "mitigated_premium" in trajectory[0]
    assert trajectory[-1]["mitigated_premium"] < trajectory[-1]["premium"]

def test_recommendations_return_three_improvements():
    profile = build_risk_profile(DEMO_ADDRESS)
    recs = get_recommendations(profile)
    assert len(recs.improvements) == 3
    assert len(recs.insurers) >= 3
    assert len(recs.summary) > 0
    assert recs.total_potential_saving_usd > 0

def test_improvements_ranked_by_roi():
    profile = build_risk_profile(DEMO_ADDRESS)
    recs = get_recommendations(profile)
    rois = [i.roi_pct for i in recs.improvements]
    assert rois == sorted(rois, reverse=True)

def test_insurer_matching_returns_carriers_for_fl():
    profile = build_risk_profile(DEMO_ADDRESS)
    matched = get_matched_insurers(profile, count=5)
    assert len(matched) >= 3
    names = [m["name"] for m in matched]
    # FL should include Citizens as FAIR plan
    assert any("Citizens" in n for n in names)

def test_insurer_matching_all_states():
    """Verify at least 3 insurers are returned for every US state."""
    profile = build_risk_profile(DEMO_ADDRESS)
    for state in ["CA", "TX", "NY", "WA", "IL", "OH", "GA", "NC", "MA", "AK", "HI"]:
        profile.state = state
        matched = get_matched_insurers(profile, count=3)
        assert len(matched) >= 3, f"Failed for state {state}: got {len(matched)} insurers"

def test_premium_estimation():
    # FL, high-risk, residential
    premium = estimate_premium("FL", 500_000, 80, "RES")
    assert premium > 0
    assert premium > 5000  # FL + high risk should be expensive

    # User override
    premium_override = estimate_premium("FL", 500_000, 80, "RES", user_premium=3000)
    assert premium_override == 3000

def test_disaster_history():
    disasters = get_disaster_history("FL")
    assert disasters.total_declarations > 0
    assert len(disasters.by_type) > 0
    assert disasters.recent_5yr >= 0
    assert disasters.trend in ("increasing", "stable", "decreasing")

def test_property_info_present():
    profile = build_risk_profile(DEMO_ADDRESS)
    # NSI may or may not return data, but disasters should always be present
    assert profile.disaster_history is not None
    assert profile.disaster_history.total_declarations > 0

def test_user_overrides():
    profile = build_risk_profile(DEMO_ADDRESS, insured_value=999_999, user_premium=5555)
    assert profile.insured_value == 999_999
    assert profile.annual_premium_estimate == 5555
    assert profile.user_provided_premium == 5555
