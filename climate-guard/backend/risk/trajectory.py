"""
20-year premium trajectory projection.
Uses state-specific growth rates, hazard trajectory modifiers, and compounding model.
Includes mitigated projection showing impact of applying improvements.
"""
from backend.models.risk import RiskProfile

# State-specific annual premium growth rates based on published NAIC/industry trend data.
STATE_GROWTH_RATES: dict[str, float] = {
    "FL": 0.125,  "LA": 0.112,  "CA": 0.098,  "TX": 0.085,  "OK": 0.078,
    "CO": 0.082,  "NE": 0.080,  "KS": 0.075,  "MS": 0.090,  "SC": 0.072,
    "NC": 0.068,  "AL": 0.070,  "GA": 0.065,  "AR": 0.062,  "MO": 0.060,
    "TN": 0.058,  "VA": 0.045,  "NY": 0.050,  "NJ": 0.052,  "MA": 0.048,
    "CT": 0.042,  "PA": 0.038,  "MD": 0.040,  "OH": 0.035,  "MI": 0.040,
    "IN": 0.038,  "IL": 0.045,  "WI": 0.032,  "MN": 0.042,  "IA": 0.048,
    "ND": 0.040,  "SD": 0.042,  "MT": 0.045,  "WY": 0.038,  "ID": 0.035,
    "NV": 0.032,  "UT": 0.030,  "AZ": 0.042,  "NM": 0.040,  "OR": 0.055,
    "WA": 0.048,  "HI": 0.035,  "AK": 0.030,  "DE": 0.032,  "NH": 0.030,
    "VT": 0.028,  "ME": 0.030,  "RI": 0.038,  "WV": 0.035,  "KY": 0.055,
    "DC": 0.035,  "PR": 0.100,  "VI": 0.095,
}
DEFAULT_GROWTH = 0.050

# Hazard trajectory → annual growth adjustment
TRAJECTORY_ADJUSTMENTS: dict[str, float] = {
    "increasing": 0.012,   # +1.2% per year for worsening hazards
    "stationary": 0.000,
    "decreasing": -0.003,  # -0.3% for improving hazards
}


def get_premium_trajectory(
    profile: RiskProfile,
    total_mitigation_savings: int = 0,
) -> list[dict]:
    """
    Project premium cost over 20 years (2024-2044).

    Returns yearly data with:
    - premium: unmitigated baseline
    - mitigated_premium: projection if improvements are applied
    """
    base = profile.annual_premium_estimate
    base_growth = STATE_GROWTH_RATES.get(profile.state, DEFAULT_GROWTH)

    # Adjust growth rate based on hazard trajectories
    hazard_adjustment = 0.0
    for _, detail in profile.hazards.items():
        adj = TRAJECTORY_ADJUSTMENTS.get(detail.trajectory, 0.0)
        hazard_adjustment += adj
    # Average across 5 hazards
    hazard_adjustment /= max(len(profile.hazards), 1)

    effective_growth = base_growth + hazard_adjustment

    # Mitigated growth assumes improvements reduce premium by the annual savings
    # and slightly reduce the growth rate (hardened homes = less claim risk)
    mitigated_base = max(base - total_mitigation_savings, int(base * 0.4))
    mitigated_growth = max(0.01, effective_growth * 0.65)  # Improved homes grow slower

    years = list(range(2024, 2045))  # 2024 to 2044 inclusive = 21 data points
    trajectory = []

    for i, year in enumerate(years):
        unmitigated = int(base * ((1 + effective_growth) ** i))
        mitigated = int(mitigated_base * ((1 + mitigated_growth) ** i))
        trajectory.append({
            "year": year,
            "premium": unmitigated,
            "mitigated_premium": mitigated,
        })

    return trajectory
