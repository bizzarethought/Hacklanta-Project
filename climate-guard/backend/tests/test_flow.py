import pytest
from backend.risk.scorer import build_risk_profile
from backend.ai.synthesizer import get_recommendations
from backend.risk.trajectory import get_premium_trajectory
from backend.geo.geocode import is_in_miami_zone

DEMO_ADDRESS = "125 Ocean Drive, Miami FL 33139"

def test_geocode_miami():
    from backend.geo.geocode import geocode_address
    lat, lng = geocode_address(DEMO_ADDRESS)
    assert 25.5 <= lat <= 25.9
    assert -80.5 <= lng <= -80.1

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

def test_composite_score_is_high_for_ocean_drive():
    profile = build_risk_profile(DEMO_ADDRESS)
    assert profile.composite_score >= 65  # coastal Miami must score high

def test_trajectory_has_five_years():
    profile = build_risk_profile(DEMO_ADDRESS)
    trajectory = get_premium_trajectory(profile)
    assert len(trajectory) == 5
    assert trajectory[0]["year"] == 2024
    assert trajectory[-1]["year"] == 2028
    assert trajectory[-1]["premium"] > trajectory[0]["premium"]  # always increasing

def test_recommendations_return_three_improvements():
    profile = build_risk_profile(DEMO_ADDRESS)
    recs = get_recommendations(profile)
    assert len(recs.improvements) == 3
    assert len(recs.insurers) == 3
    assert len(recs.summary) > 0
    assert recs.total_potential_saving_usd > 0

def test_improvements_ranked_by_roi():
    profile = build_risk_profile(DEMO_ADDRESS)
    recs = get_recommendations(profile)
    rois = [i.roi_pct for i in recs.improvements]
    assert rois == sorted(rois, reverse=True)
