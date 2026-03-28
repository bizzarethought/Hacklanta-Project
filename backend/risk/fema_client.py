from typing import Dict, Any

def mock_openfema_flood_risk(lat: float, lng: float, spatial_data: dict) -> Dict[str, Any]:
    """
    Simulates calling the OpenFEMA API for flood zone designation and NFIP claims.
    """
    if spatial_data.get("flood_zone") == "AE":
        score = 9 
        trajectory = "increasing"
    else:
        score = 2
        trajectory = "stationary"
        
    return {
        "score": score,
        "factor": "OpenFEMA",
        "trajectory": trajectory,
        "details": f"Zone {spatial_data.get('flood_zone')}"
    }
