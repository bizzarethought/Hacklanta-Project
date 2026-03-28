from typing import Dict, Any

def mock_firststreet_fire_heat(lat: float, lng: float, spatial_data: dict) -> Dict[str, Any]:
    """
    Mock MVP First Street API wrapper since gated.
    """
    # Fire 
    if spatial_data.get("wildfire_severity") == "High":
        fire_score = 8
        fire_traj = "increasing"
    else:
        fire_score = 3
        fire_traj = "stationary"

    # Heat 
    heat_score = 6 if lat < 35 else 4
        
    return {
        "fire": {"score": fire_score, "factor": "First Street", "trajectory": fire_traj},
        "heat": {"score": heat_score, "factor": "First Street", "trajectory": "increasing"}
    }
