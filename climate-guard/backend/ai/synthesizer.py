import json
import google.generativeai as genai
from backend.models.risk import RiskProfile
from backend.models.recommendations import Recommendations, Improvement, Insurer
from backend.cache.store import get_cached, set_cached
from backend.config import settings
from backend.risk.insurer_db import get_matched_insurers

SYSTEM_PROMPT = """
You are Climate Guard's property risk advisor. You receive a structured JSON risk profile
for a property and return ONLY a valid JSON object with exactly three keys:

- "summary": exactly 2 sentences. Plain language. Financial advisor tone, not environmentalist.
  State the top two risks and whether they are worsening. Be specific.

- "improvements": a list of objects, each with keys:
  "action" (string), "cost_usd" (integer), "annual_saving_usd" (integer), "roi_pct" (float).
  Return exactly 3 improvements ranked by roi_pct descending.
  Base savings estimates on the property's specific dominant hazards.

- "insurers": a list of objects, each with keys:
  "name" (string), "coverage_type" (string), "notes" (string).
  Return exactly 3 insurers active in the property's state that match its risk profile.
  If fair_plan_stress is true, include the state FAIR Plan insurer and flag it.

Return ONLY the JSON object. No markdown. No explanation. No preamble.
""".strip()

# Gemini client — initialised after SYSTEM_PROMPT is defined
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    _gemini_model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            max_output_tokens=8192,
        ),
        system_instruction=SYSTEM_PROMPT,
    )
else:
    _gemini_model = None

# Hazard-specific improvement options, sorted by ROI
_IMPROVEMENTS: dict[str, list[dict]] = {
    "flood": [
        {"action": "Flood Vents Installation",      "cost_usd": 4000,  "annual_saving_usd": 820,  "roi_pct": 20.5},
        {"action": "Elevated HVAC Unit",             "cost_usd": 12000, "annual_saving_usd": 1900, "roi_pct": 15.8},
        {"action": "Sump Pump + Battery Backup",     "cost_usd": 3500,  "annual_saving_usd": 600,  "roi_pct": 17.1},
        {"action": "Flood-Resistant Door Barriers",  "cost_usd": 2500,  "annual_saving_usd": 430,  "roi_pct": 17.2},
        {"action": "Elevated Electrical Panel",      "cost_usd": 8000,  "annual_saving_usd": 950,  "roi_pct": 11.9},
    ],
    "wind": [
        {"action": "Hurricane Straps + Clips",       "cost_usd": 3000,  "annual_saving_usd": 550,  "roi_pct": 18.3},
        {"action": "Impact-Rated Windows",           "cost_usd": 25000, "annual_saving_usd": 2400, "roi_pct": 9.6},
        {"action": "Fortified Roof System",          "cost_usd": 38000, "annual_saving_usd": 3100, "roi_pct": 8.2},
        {"action": "Garage Door Wind Bracing",       "cost_usd": 1200,  "annual_saving_usd": 220,  "roi_pct": 18.3},
    ],
    "fire": [
        {"action": "Ember-Resistant Vents",          "cost_usd": 2500,  "annual_saving_usd": 480,  "roi_pct": 19.2},
        {"action": "Defensible Space Clearing",      "cost_usd": 2000,  "annual_saving_usd": 380,  "roi_pct": 19.0},
        {"action": "Class A Fire-Rated Roof",        "cost_usd": 18000, "annual_saving_usd": 1600, "roi_pct": 8.9},
        {"action": "Non-Combustible Deck/Siding",    "cost_usd": 12000, "annual_saving_usd": 1100, "roi_pct": 9.2},
    ],
    "heat": [
        {"action": "Solar Attic Fan",                "cost_usd": 1500,  "annual_saving_usd": 270,  "roi_pct": 18.0},
        {"action": "Cool Roof Reflective Coating",   "cost_usd": 5000,  "annual_saving_usd": 720,  "roi_pct": 14.4},
        {"action": "High-Efficiency HVAC Upgrade",   "cost_usd": 8000,  "annual_saving_usd": 950,  "roi_pct": 11.9},
        {"action": "Radiant Barrier Insulation",     "cost_usd": 3000,  "annual_saving_usd": 400,  "roi_pct": 13.3},
    ],
    "seismic": [
        {"action": "Water Heater Strapping",         "cost_usd": 300,   "annual_saving_usd": 100,  "roi_pct": 33.3},
        {"action": "Cripple Wall Bracing",           "cost_usd": 7000,  "annual_saving_usd": 850,  "roi_pct": 12.1},
        {"action": "Foundation Anchor Bolting",      "cost_usd": 4000,  "annual_saving_usd": 520,  "roi_pct": 13.0},
        {"action": "Soft-Story Retrofit",            "cost_usd": 15000, "annual_saving_usd": 1400, "roi_pct": 9.3},
    ],
}


def _contextual_fallback(profile: RiskProfile) -> dict:
    """Generate property-specific recommendations from actual hazard scores — no AI key needed."""
    ranked = sorted(profile.hazards.items(), key=lambda x: x[1].score, reverse=True)

    # Pick top 3 improvements, pulling from highest-scoring hazards first
    improvements: list[dict] = []
    used_actions: set[str] = set()
    for hazard, detail in ranked:
        if detail.score < 3:
            continue
        for imp in _IMPROVEMENTS.get(hazard, []):
            if imp["action"] not in used_actions and len(improvements) < 3:
                improvements.append(imp)
                used_actions.add(imp["action"])

    # Fill remainder if needed
    for hazard, _ in ranked:
        for imp in _IMPROVEMENTS.get(hazard, []):
            if imp["action"] not in used_actions and len(improvements) < 3:
                improvements.append(imp)
                used_actions.add(imp["action"])

    improvements.sort(key=lambda x: x["roi_pct"], reverse=True)

    # Build summary from actual top 2 hazards
    top = ranked[:2]
    h1_name, h1 = top[0]
    h2_name, h2 = top[1] if len(top) > 1 else (top[0][0], top[0][1])
    traj1 = "worsening" if h1.trajectory == "increasing" else "stable"
    traj2 = "worsening" if h2.trajectory == "increasing" else "stable"
    summary = (
        f"This property's dominant exposure is {h1_name} risk (score {h1.score}/10, {traj1}), "
        f"followed by {h2_name} risk (score {h2.score}/10, {traj2}). "
        f"Targeted mitigation addressing these hazards offers the strongest ROI for reducing "
        f"annual insurance costs and preserving long-term insurability."
    )

    # Use the new insurer database for state-matched recommendations
    matched = get_matched_insurers(profile, count=3)
    insurers = [
        {"name": m["name"], "coverage_type": m["coverage_type"], "notes": m["notes"]}
        for m in matched
    ]

    return {
        "summary": summary,
        "improvements": improvements[:3],
        "insurers": insurers,
    }


def get_recommendations(profile: RiskProfile) -> Recommendations:
    cached = get_cached(profile.address)
    if cached:
        return _parse(cached)

    # Try Gemini if key is set
    if _gemini_model:
        try:
            user_message = json.dumps({
                "address": profile.address,
                "composite_score": profile.composite_score,
                "hazards": {k: {"score": v.score, "trajectory": v.trajectory} for k, v in profile.hazards.items()},
                "annual_premium_estimate": profile.annual_premium_estimate,
                "insured_value": profile.insured_value,
                "state": profile.state,
                "fair_plan_stress": profile.fair_plan_stress,
            })
            response = _gemini_model.generate_content(user_message)
            data = json.loads(response.text)
            set_cached(profile.address, data)
            return _parse(data)
        except Exception:
            pass

    # Contextual rule-based fallback — property-specific, no AI key needed
    data = _contextual_fallback(profile)
    return _parse(data)


def _parse(data: dict) -> Recommendations:
    improvements = [Improvement(**i) for i in data["improvements"]]
    insurers = [Insurer(**i) for i in data["insurers"]]
    return Recommendations(
        summary=data["summary"],
        improvements=improvements,
        insurers=insurers,
        total_potential_saving_usd=sum(i.annual_saving_usd for i in improvements),
    )
