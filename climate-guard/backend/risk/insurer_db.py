"""
Comprehensive US insurer database covering all 50 states + DC + territories.
Replaces the hardcoded 4-state preset system with risk-matched recommendation logic.
"""
from __future__ import annotations
from backend.models.risk import RiskProfile


# ── National Carriers (available in most/all states) ────────────────
_NATIONAL_CARRIERS: list[dict] = [
    {
        "name": "State Farm",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "fire", "flood"],
        "fair_plan": False,
        "max_risk_appetite": 75,
        "notes": "Largest US home insurer. Offers standard mitigation discounts. May require separate NFIP flood policy.",
    },
    {
        "name": "Allstate",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "heat", "fire"],
        "fair_plan": False,
        "max_risk_appetite": 70,
        "notes": "Nationwide coverage. Bundles available with NFIP flood. Competitive for moderate-risk properties.",
    },
    {
        "name": "USAA",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["flood", "wind", "fire", "seismic"],
        "fair_plan": False,
        "max_risk_appetite": 90,
        "notes": "Military families only. Highest customer satisfaction. Competitive premiums across all risk tiers.",
    },
    {
        "name": "Liberty Mutual",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "fire"],
        "fair_plan": False,
        "max_risk_appetite": 65,
        "notes": "Nationwide availability. Offers new-home and claims-free discounts. Strong coverage options.",
    },
    {
        "name": "Farmers Insurance",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["fire", "wind", "heat"],
        "fair_plan": False,
        "max_risk_appetite": 65,
        "notes": "Wide coverage. Wildfire mitigation discounts for Class A roofs. Multi-policy bundles available.",
    },
    {
        "name": "Nationwide",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "flood"],
        "fair_plan": False,
        "max_risk_appetite": 60,
        "notes": "Broad coverage options. On Your Side® claims guarantee. Offers comprehensive bundling.",
    },
    {
        "name": "Travelers",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "fire", "flood"],
        "fair_plan": False,
        "max_risk_appetite": 70,
        "notes": "Strong in Northeast and coastal markets. Offers wildfire defense services in select states.",
    },
    {
        "name": "Erie Insurance",
        "states": ["DC", "IL", "IN", "KY", "MD", "NC", "NY", "OH", "PA", "TN", "VA", "WV", "WI"],
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "flood"],
        "fair_plan": False,
        "max_risk_appetite": 60,
        "notes": "Regional Mid-Atlantic/Midwest carrier. Highest customer satisfaction among regional insurers.",
    },
    {
        "name": "American Family Insurance",
        "states": ["AZ", "CO", "GA", "ID", "IL", "IN", "IA", "KS", "MN", "MO", "MT", "NE", "NV", "NM", "ND", "OH", "OK", "OR", "SD", "UT", "WA", "WI"],
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "fire", "heat"],
        "fair_plan": False,
        "max_risk_appetite": 60,
        "notes": "Midwest specialist. Competitive rates for moderate-risk properties. Offers DreamProtect® coverage.",
    },
    {
        "name": "Amica Mutual",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "flood", "fire"],
        "fair_plan": False,
        "max_risk_appetite": 65,
        "notes": "Highest customer service ratings. Dividend policies return a portion of premium annually.",
    },
    {
        "name": "Auto-Owners Insurance",
        "states": ["AL", "AR", "AZ", "CO", "FL", "GA", "ID", "IL", "IN", "IA", "KS", "KY", "MI", "MN", "MO", "MT", "NE", "NC", "ND", "OH", "OK", "OR", "PA", "SC", "SD", "TN", "UT", "VA", "WI"],
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "fire"],
        "fair_plan": False,
        "max_risk_appetite": 60,
        "notes": "Regional favorite. Consistently high J.D. Power ratings. Agents-only model for personalized service.",
    },
    {
        "name": "The Hartford",
        "states": "ALL",
        "coverage_type": "Full HO-3",
        "specialties": ["wind", "fire", "flood"],
        "fair_plan": False,
        "max_risk_appetite": 60,
        "notes": "AARP-endorsed. Strong for 50+ homeowners. Offers disappearing deductibles and identity theft coverage.",
    },
    {
        "name": "Chubb",
        "states": "ALL",
        "coverage_type": "Full HO-5",
        "specialties": ["flood", "wind", "fire", "seismic"],
        "fair_plan": False,
        "max_risk_appetite": 85,
        "notes": "High-net-worth specialist. Guaranteed replacement cost. Risk engineering services for expensive homes.",
    },
]

# ── State-Specific / FAIR Plan Carriers ─────────────────────────────
_STATE_CARRIERS: list[dict] = [
    # Florida
    {"name": "Citizens Property Insurance", "states": ["FL"], "coverage_type": "Wind + Flood", "specialties": ["flood", "wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "Florida insurer of last resort (FAIR Plan). Enrollment surging in coastal counties. Rates increasing annually."},
    {"name": "Universal Property & Casualty", "states": ["FL"], "coverage_type": "Full HO-3", "specialties": ["wind", "flood"],
     "fair_plan": False, "max_risk_appetite": 75,
     "notes": "Florida specialist. Competitive rates for fortified homes. Wind mitigation credits available."},
    {"name": "Tower Hill Insurance", "states": ["FL"], "coverage_type": "Full HO-3", "specialties": ["wind", "flood"],
     "fair_plan": False, "max_risk_appetite": 70,
     "notes": "FL-focused carrier. Discounts for impact windows and fortified roofs. Wind mitigation reports accepted."},
    {"name": "Security First Financial", "states": ["FL"], "coverage_type": "Full HO-3", "specialties": ["wind"],
     "fair_plan": False, "max_risk_appetite": 65,
     "notes": "FL specialist. New-construction discounts. Strong claims service ratings."},
    {"name": "Heritage Insurance", "states": ["FL"], "coverage_type": "Full HO-3", "specialties": ["wind", "flood"],
     "fair_plan": False, "max_risk_appetite": 70,
     "notes": "Florida-focused. Competitive on coastal properties. Offers hurricane deductible options."},

    # California
    {"name": "California FAIR Plan", "states": ["CA"], "coverage_type": "Fire + Structure", "specialties": ["fire"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "CA insurer of last resort. Fire coverage only — supplement with Difference in Conditions (DIC) policy."},
    {"name": "CSAA Insurance (AAA)", "states": ["CA", "NV", "UT"], "coverage_type": "Full HO-3", "specialties": ["fire", "seismic"],
     "fair_plan": False, "max_risk_appetite": 70,
     "notes": "CA-focused. Strong wildfire claims history. Defensible space discounts. AAA membership benefits."},
    {"name": "California Earthquake Authority", "states": ["CA"], "coverage_type": "Earthquake Only", "specialties": ["seismic"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "State-run earthquake insurance. Supplement to homeowner policy. Deductibles from 5-25%."},
    {"name": "Mercury Insurance", "states": ["CA", "AZ", "NV", "TX", "FL"], "coverage_type": "Full HO-3", "specialties": ["fire"],
     "fair_plan": False, "max_risk_appetite": 60,
     "notes": "CA headquartered. Competitive rates for lower-risk zones. New-home and smart-home discounts."},

    # Texas
    {"name": "Texas FAIR Plan (TWIA)", "states": ["TX"], "coverage_type": "Wind + Hail", "specialties": ["wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "TX windstorm insurer of last resort for 14 coastal counties. Required supplement for Gulf Coast properties."},
    {"name": "Texas Farm Bureau", "states": ["TX"], "coverage_type": "Full HO-3", "specialties": ["wind", "fire"],
     "fair_plan": False, "max_risk_appetite": 65,
     "notes": "TX-only. Competitive rural/suburban rates. Membership-based with dividend returns."},
    {"name": "Hippo Insurance", "states": ["TX", "CA", "AZ", "CO", "IL"], "coverage_type": "Full HO-3", "specialties": ["wind", "fire"],
     "fair_plan": False, "max_risk_appetite": 60,
     "notes": "Insurtech carrier. Smart home monitoring included. Fast online quotes. Equipment breakdown coverage."},

    # Louisiana
    {"name": "Louisiana Citizens Property", "states": ["LA"], "coverage_type": "Wind + Flood", "specialties": ["flood", "wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "LA insurer of last resort. Enrollment at record highs post-hurricane season. Mandatory surcharges apply."},
    {"name": "Southern Fidelity Insurance", "states": ["LA", "FL", "MS", "SC"], "coverage_type": "Full HO-3", "specialties": ["wind", "flood"],
     "fair_plan": False, "max_risk_appetite": 70,
     "notes": "Gulf Coast specialist. Competitive for fortified construction. Offers flexible deductible options."},

    # Northeast
    {"name": "Massachusetts FAIR Plan", "states": ["MA"], "coverage_type": "Property Essential", "specialties": ["wind", "flood"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "MA insurer of last resort. Covers properties unable to obtain private market insurance. Coastal focus."},
    {"name": "NJ FAIR Plan", "states": ["NJ"], "coverage_type": "Basic Property", "specialties": ["flood", "wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "NJ residual market. For properties refused by private carriers. Coverage for high-risk coastal areas."},
    {"name": "NY FAIR Plan", "states": ["NY"], "coverage_type": "Basic Property", "specialties": ["flood", "wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "NY insurer of last resort. Covers fire and basic perils for properties declined by standard market."},
    {"name": "Arbella Insurance", "states": ["MA", "CT"], "coverage_type": "Full HO-3", "specialties": ["wind", "flood"],
     "fair_plan": False, "max_risk_appetite": 60,
     "notes": "New England specialist. Competitive coastal coverage. Local claims service."},

    # Southeast / Carolinas
    {"name": "NC FAIR Plan", "states": ["NC"], "coverage_type": "BEACH Plan", "specialties": ["wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "NC Beach Plan covers 18 coastal counties for wind/hail. Separate from standard homeowner policy."},
    {"name": "SC Wind and Hail Pool", "states": ["SC"], "coverage_type": "Wind + Hail", "specialties": ["wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "SC residual market for coastal wind coverage. Required for properties in wind pool territory."},
    {"name": "North Carolina Farm Bureau", "states": ["NC"], "coverage_type": "Full HO-3", "specialties": ["wind", "flood"],
     "fair_plan": False, "max_risk_appetite": 60,
     "notes": "NC largest domestic insurer. Membership-based. Strong presence in rural and suburban markets."},

    # Midwest / Tornado Alley
    {"name": "Shelter Insurance", "states": ["AR", "CO", "IL", "IN", "IA", "KS", "KY", "LA", "MO", "MS", "NE", "OH", "OK", "TN"],
     "coverage_type": "Full HO-3", "specialties": ["wind"],
     "fair_plan": False, "max_risk_appetite": 65,
     "notes": "Midwest specialist. Strong tornado/hail coverage. Agents in every county."},
    {"name": "Country Financial", "states": ["AZ", "CO", "GA", "IL", "IN", "IA", "KS", "MI", "MN", "MO", "NV", "OH", "OK", "OR", "TN", "WA", "WI"],
     "coverage_type": "Full HO-3", "specialties": ["wind", "fire"],
     "fair_plan": False, "max_risk_appetite": 60,
     "notes": "Farm/rural specialist. Comprehensive coverage for agricultural properties. Competitive in Tornado Alley."},

    # Mountain West / Pacific Northwest
    {"name": "Oregon FAIR Plan", "states": ["OR"], "coverage_type": "Fire + Basic Perils", "specialties": ["fire"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "OR insurer of last resort for wildfire-risk properties. Fire and basic perils coverage only."},
    {"name": "Pemco Insurance", "states": ["WA", "OR"], "coverage_type": "Full HO-3", "specialties": ["fire", "flood"],
     "fair_plan": False, "max_risk_appetite": 60,
     "notes": "Pacific Northwest specialist. Strong wildfire coverage. Local claims adjusters."},
    {"name": "Mutual of Enumclaw", "states": ["WA", "OR", "ID", "MT", "UT", "AZ"], "coverage_type": "Full HO-3", "specialties": ["fire", "wind"],
     "fair_plan": False, "max_risk_appetite": 60,
     "notes": "Northwest regional. Competitive rates for moderate wildfire zones. Strong community presence."},

    # Hawaii / Alaska
    {"name": "First Insurance Company of Hawaii", "states": ["HI"], "coverage_type": "Full HO-3", "specialties": ["wind", "flood"],
     "fair_plan": False, "max_risk_appetite": 70,
     "notes": "Hawaii's largest domestic insurer. Hurricane and volcanic coverage available. Local claims expertise."},
    {"name": "Hawaii Property Insurance Association", "states": ["HI"], "coverage_type": "Wind + Basic", "specialties": ["wind"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "HI residual market for hurricane/windstorm coverage. For properties unable to obtain private market wind."},

    # Territories
    {"name": "USVI Property Insurance", "states": ["VI"], "coverage_type": "Wind + Property", "specialties": ["wind", "flood"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "US Virgin Islands coverage. Limited market — most residents rely on federal flood insurance + wind pool."},
    {"name": "Puerto Rico Joint Underwriting", "states": ["PR"], "coverage_type": "Wind + Property", "specialties": ["wind", "flood"],
     "fair_plan": True, "max_risk_appetite": 100,
     "notes": "PR residual market. Critical after Hurricane Maria/Fiona. High wind deductibles common."},
]


# FAIR Plan states for quick lookup
FAIR_PLAN_STATES = {c["states"][0] for c in _STATE_CARRIERS if c["fair_plan"]}

# Merge all carriers
_ALL_CARRIERS = _NATIONAL_CARRIERS + _STATE_CARRIERS


def _carrier_available_in_state(carrier: dict, state: str) -> bool:
    """Check if carrier operates in the given state."""
    states = carrier["states"]
    if states == "ALL":
        return True
    return state in states


def _match_score(carrier: dict, profile: RiskProfile) -> float:
    """
    Calculate how well an insurer matches a property's risk profile.
    Higher = better match. Range 0-100.
    """
    score = 0.0
    top_hazards = sorted(profile.hazards.items(), key=lambda x: x[1].score, reverse=True)
    specialties = carrier.get("specialties", [])

    # Specialty match: +20 per matching top-3 hazard
    for i, (hazard, detail) in enumerate(top_hazards[:3]):
        if hazard in specialties:
            weight = 20 - (i * 5)  # 20, 15, 10
            score += weight * (detail.score / 10)

    # Risk appetite: penalize carriers that won't write high-risk
    max_appetite = carrier.get("max_risk_appetite", 60)
    if profile.composite_score <= max_appetite:
        score += 25
    elif profile.composite_score <= max_appetite + 15:
        score += 10
    # else: no bonus (carrier unlikely to write)

    # FAIR plan bonus when in stress
    if profile.fair_plan_stress and carrier["fair_plan"]:
        score += 30

    return min(100, score)


def get_matched_insurers(profile: RiskProfile, count: int = 5) -> list[dict]:
    """
    Return the best-matched insurers for a given risk profile.
    - Filters by state availability
    - FAIR Plan carriers float to top if fair_plan_stress is True
    - Remaining carriers ranked by specialty match
    """
    state = profile.state

    # Filter to carriers available in this state
    available = [c for c in _ALL_CARRIERS if _carrier_available_in_state(c, state)]

    # Score each carrier
    scored: list[tuple[float, dict]] = []
    for carrier in available:
        ms = _match_score(carrier, profile)
        scored.append((ms, carrier))

    scored.sort(key=lambda x: x[0], reverse=True)

    # Build results
    results: list[dict] = []
    seen_names: set[str] = set()

    # FAIR Plan first if stressed
    if profile.fair_plan_stress:
        for ms, carrier in scored:
            if carrier["fair_plan"] and carrier["name"] not in seen_names:
                results.append({
                    "name": carrier["name"],
                    "coverage_type": carrier["coverage_type"],
                    "notes": carrier["notes"],
                    "match_score": round(ms),
                    "fair_plan": True,
                })
                seen_names.add(carrier["name"])
                if len(results) >= 2:
                    break

    # Fill remaining with best-matched non-FAIR carriers
    for ms, carrier in scored:
        if carrier["name"] not in seen_names:
            results.append({
                "name": carrier["name"],
                "coverage_type": carrier["coverage_type"],
                "notes": carrier["notes"],
                "match_score": round(ms),
                "fair_plan": carrier["fair_plan"],
            })
            seen_names.add(carrier["name"])
        if len(results) >= count:
            break

    return results
