from backend.models.risk import RiskProfile

def get_premium_trajectory(profile: RiskProfile) -> list[dict]:
    base = profile.annual_premium_estimate
    years = [2024, 2025, 2026, 2027, 2028]
    growth_rate = 0.085 if profile.fair_plan_stress else 0.06
    return [
        {"year": year, "premium": int(base * ((1 + growth_rate) ** i))}
        for i, year in enumerate(years)
    ]
