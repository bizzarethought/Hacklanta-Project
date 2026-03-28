from typing import Dict, Any

def mock_noaa_wind_seismic_risk(lat: float, lng: float) -> Dict[str, Any]:
    """
    Simulates NOAA wind hazard & USGS National Seismic Hazard Model based on lat/lng.
    """
    # Coastal Florida simulation
    if 24 < lat < 26 and lng > -81:
        return {
            "wind": {"score": 8, "factor": "NOAA", "trajectory": "increasing"},
            "seismic": {"score": 2, "factor": "USGS", "trajectory": "stationary"}
        }
    
    # California simulation
    if lat > 32 and lng < -114:
        return {
            "wind": {"score": 3, "factor": "NOAA", "trajectory": "stationary"},
            "seismic": {"score": 7, "factor": "USGS", "trajectory": "stationary"}
        }

    # Default
    return {
        "wind": {"score": 5, "factor": "NOAA", "trajectory": "stationary"},
        "seismic": {"score": 3, "factor": "USGS", "trajectory": "stationary"}
    }
