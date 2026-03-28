def calculate_composite_score(hazards: dict) -> int:
    """
    Composite score formula:
        flood * 0.30
        fire * 0.25
        wind * 0.20
        heat * 0.15
        seismic * 0.10
    """
    flood_val = hazards.get("flood", {}).get("score", 0) * 0.30
    fire_val = hazards.get("fire", {}).get("score", 0) * 0.25
    wind_val = hazards.get("wind", {}).get("score", 0) * 0.20
    heat_val = hazards.get("heat", {}).get("score", 0) * 0.15
    seismic_val = hazards.get("seismic", {}).get("score", 0) * 0.10
    
    total = (flood_val + fire_val + wind_val + heat_val + seismic_val) * 10
    return int(min(max(total, 0), 100))
