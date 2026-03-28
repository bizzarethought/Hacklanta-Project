from typing import List, Dict

def get_trajectory_data(baseline_premium: int) -> List[Dict[str, int]]:
    """
    Simulates a linear model premium trajectory projection over 20 years.
    Returns year-by-year projections (using 5-year intervals as requested or compounding).
    """
    data = []
    for i in range(5):
        year_offset = i * 5 # 2024, 2029, 2034, 2039, 2044
        render_year = 2024 + year_offset
        projected = baseline_premium * (1.25 ** i)
        
        data.append({
            "year": render_year,
            "premium": int(round(projected))
        })
    return data
