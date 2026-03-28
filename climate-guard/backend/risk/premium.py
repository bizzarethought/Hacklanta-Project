"""
Premium estimation engine.
Uses NSI structure values + state average premium rates + risk/building multipliers.
Falls back to sensible defaults when data is missing.
"""

# Average annual homeowner insurance premium per $1,000 of insured value, by state.
# Based on published 2024-2025 industry data (NAIC, Bankrate, Insurance Information Institute).
STATE_RATES: dict[str, float] = {
    "AL": 6.20, "AK": 3.80, "AZ": 4.50, "AR": 5.80, "CA": 4.80,
    "CO": 6.50, "CT": 4.60, "DE": 3.20, "DC": 3.60, "FL": 10.50,
    "GA": 5.20, "HI": 2.50, "ID": 3.80, "IL": 4.60, "IN": 4.20,
    "IA": 4.80, "KS": 7.20, "KY": 5.60, "LA": 9.80, "ME": 3.00,
    "MD": 3.80, "MA": 4.20, "MI": 4.00, "MN": 5.40, "MS": 6.80,
    "MO": 5.80, "MT": 5.20, "NE": 8.40, "NV": 3.60, "NH": 3.20,
    "NJ": 4.00, "NM": 4.80, "NY": 4.20, "NC": 5.00, "ND": 5.60,
    "OH": 3.60, "OK": 8.90, "OR": 3.00, "PA": 3.40, "RI": 4.60,
    "SC": 5.40, "SD": 6.00, "TN": 5.80, "TX": 7.20, "UT": 3.40,
    "VT": 2.80, "VA": 3.80, "WA": 3.20, "WV": 4.60, "WI": 3.40,
    "WY": 4.20,
    # Territories
    "PR": 8.00, "VI": 9.00, "GU": 7.00,
}

DEFAULT_RATE = 5.00  # National average fallback

# Risk score → premium multiplier
RISK_MULTIPLIERS: list[tuple[int, float]] = [
    (30,  0.70),   # Low risk discount
    (50,  1.00),   # Baseline
    (70,  1.40),   # Elevated
    (85,  1.80),   # High
    (100, 2.30),   # Extreme
]

# Building damage category → premium multiplier
BUILDING_MULTIPLIERS: dict[str, float] = {
    "RES": 1.00,
    "COM": 1.30,
    "IND": 1.50,
    "PUB": 1.20,
    "AGR": 0.85,
    "UNKNOWN": 1.00,
}

# Default insured values by building type when NSI data unavailable
DEFAULT_VALUES: dict[str, int] = {
    "RES": 350_000,
    "COM": 800_000,
    "IND": 1_200_000,
    "PUB": 500_000,
    "AGR": 250_000,
    "UNKNOWN": 350_000,
}


def _get_risk_multiplier(composite_score: int) -> float:
    """Get premium multiplier based on composite risk score."""
    for threshold, mult in RISK_MULTIPLIERS:
        if composite_score <= threshold:
            return mult
    return 2.30


def estimate_premium(
    state: str,
    insured_value: int,
    composite_score: int,
    damage_category: str = "RES",
    user_premium: int | None = None,
) -> int:
    """
    Estimate annual insurance premium.

    If user_premium is provided, returns that directly.
    Otherwise: premium = insured_value × (state_rate/1000) × risk_mult × building_mult
    """
    if user_premium is not None:
        return user_premium

    state_rate = STATE_RATES.get(state.upper(), DEFAULT_RATE)
    risk_mult = _get_risk_multiplier(composite_score)
    bldg_mult = BUILDING_MULTIPLIERS.get(damage_category, 1.0)

    premium = insured_value * (state_rate / 1000) * risk_mult * bldg_mult
    return max(500, int(premium))  # Floor at $500


def get_default_insured_value(damage_category: str) -> int:
    """Return a sensible default insured value for a building type."""
    return DEFAULT_VALUES.get(damage_category, 350_000)
