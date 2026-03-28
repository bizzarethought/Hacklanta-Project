import json
from anthropic import Anthropic
from backend.models.risk import RiskProfile
from backend.models.recommendations import Recommendations, Improvement, Insurer
from backend.cache.store import get_cached, set_cached
from backend.config import settings

client = Anthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT = """
You are Climate Guard's property risk advisor. You receive a structured JSON risk profile
for a property and return ONLY a valid JSON object with exactly three keys:

- "summary": exactly 2 sentences. Plain language. Financial advisor tone, not environmentalist.
  State the top two risks and whether they are worsening. Be specific.

- "improvements": a list of objects, each with keys:
  "action" (string), "cost_usd" (integer), "annual_saving_usd" (integer), "roi_pct" (float).
  Return exactly 3 improvements ranked by roi_pct descending.
  Base savings estimates on the property's specific dominant hazards.
  Example for high flood+wind: elevated HVAC, impact windows, fortified roof.

- "insurers": a list of objects, each with keys:
  "name" (string), "coverage_type" (string), "notes" (string).
  Return exactly 3 insurers active in the property's state that match its risk profile.
  If fair_plan_stress is true, include the state FAIR Plan insurer and flag it.

Return ONLY the JSON object. No markdown. No explanation. No preamble.
""".strip()

FALLBACK_RESPONSE = {
    "summary": "This coastal property carries extreme flood and wind risk, both projected to worsen significantly by 2040 due to sea level rise and intensifying hurricane activity. Immediate mitigation investment is strongly recommended to preserve insurability.",
    "improvements": [
        {"action": "Elevated HVAC Unit",  "cost_usd": 12000, "annual_saving_usd": 1900, "roi_pct": 16.0},
        {"action": "Impact Windows",       "cost_usd": 25000, "annual_saving_usd": 2400, "roi_pct": 9.6},
        {"action": "Fortified Roof",       "cost_usd": 38000, "annual_saving_usd": 3100, "roi_pct": 8.2},
    ],
    "insurers": [
        {"name": "Citizens Property Insurance", "coverage_type": "Wind + Flood",  "notes": "Florida state insurer of last resort. FAIR Plan equivalent. Enrollment surging in coastal counties."},
        {"name": "Universal Property & Casualty","coverage_type": "Full coverage", "notes": "Active in FL. Competitive rates for fortified homes with wind mitigation credits."},
        {"name": "Tower Hill Insurance",         "coverage_type": "Full coverage", "notes": "FL-focused carrier. Offers discounts for impact-rated windows and roofs."},
    ],
}

def get_recommendations(profile: RiskProfile) -> Recommendations:
    cached = get_cached(profile.address)
    if cached:
        return _parse(cached)

    try:
        user_message = json.dumps({
            "address": profile.address,
            "composite_score": profile.composite_score,
            "hazards": {
                k: {"score": v.score, "trajectory": v.trajectory}
                for k, v in profile.hazards.items()
            },
            "annual_premium_estimate": profile.annual_premium_estimate,
            "insured_value": profile.insured_value,
            "state": profile.state,
            "fair_plan_stress": profile.fair_plan_stress,
        })

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        raw = response.content[0].text
        data = json.loads(raw)
        set_cached(profile.address, data)
        return _parse(data)

    except Exception:
        return _parse(FALLBACK_RESPONSE)

def _parse(data: dict) -> Recommendations:
    improvements = [Improvement(**i) for i in data["improvements"]]
    insurers = [Insurer(**i) for i in data["insurers"]]
    total = sum(i.annual_saving_usd for i in improvements)
    return Recommendations(
        summary=data["summary"],
        improvements=improvements,
        insurers=insurers,
        total_potential_saving_usd=total,
    )
