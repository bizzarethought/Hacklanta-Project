from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
from backend.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

CHAT_SYSTEM = """
You are Climate Guard's sustainability advisor — a friendly, direct expert on property
resilience, green upgrades, and climate risk reduction.

When given a user question and optional property context (address, risk scores, hazards),
give concise, practical advice. Focus on:
- Actionable sustainability upgrades (solar, insulation, green roofs, rainwater harvesting, etc.)
- Estimated costs and ROI where relevant
- How upgrades reduce insurance premiums or climate risk
- Local incentives or rebates when applicable

Keep responses under 150 words. Be direct and helpful, not preachy.
Never use bullet points with more than 4 items. No fluff.
""".strip()

# Keyword-based fallback responses when Gemini is unavailable
_FALLBACK_RESPONSES = [
    ("solar", "Solar panels typically cost $15,000–$25,000 after the 30% federal ITC. In Florida, net metering + no state income tax on solar savings improve ROI significantly. A battery backup (add ~$10k) is strongly recommended for flood/wind-prone properties where grid outages are common. Payback: 7–10 years."),
    ("flood", "For flood risk: elevate critical systems (HVAC, electrical panel) above base flood elevation — ~$8,000–$12,000. Install flood vents ($3,000–$5,000) and a sump pump with battery backup ($3,500). These upgrades can cut NFIP flood insurance premiums 15–30% and reduce storm damage significantly."),
    ("wind", "Wind mitigation starts with hurricane straps/clips ($2,000–$4,000), then impact windows ($20,000–$30,000). A fortified roof system ($35,000–$45,000) delivers the biggest premium discount — FL insurers can cut wind coverage costs 25–45% for verified fortified roofs. ROI is strong in coastal counties."),
    ("insurance", "Top upgrades that lower premiums: fortified roof (wind), impact windows, flood vents, elevated HVAC, ember-resistant vents (wildfire). Pair mitigation with a wind mitigation inspection report — FL insurers are required to credit discounts for verified upgrades. Can save $2,000–$5,000/year."),
    ("green roof", "A green roof costs $15–$30/sq ft installed. Benefits: reduces stormwater runoff (lowers flood risk), insulates against heat, extends roof life 2–3×. In urban heat risk areas, it can cut HVAC costs 15–25%. LEED credits may apply. Best for flat/low-slope roofs with adequate structural load."),
    ("heat", "For heat resilience: cool roof reflective coating ($4,000–$6,000, ROI ~14%), radiant barrier insulation ($2,000–$4,000), high-efficiency HVAC upgrade ($8,000–$12,000). These cut energy bills 15–30% and help maintain insurability in extreme heat zones. Desert Southwest properties recover costs fastest."),
    ("insulation", "Upgrading to spray foam insulation ($3,000–$7,000) reduces energy bills 30–50% and improves air sealing against wildfire smoke and humidity. Pair with a cool roof coating for maximum heat reduction. Federal 25C tax credit covers 30% of costs up to $1,200/year for insulation upgrades."),
    ("rainwater", "Rainwater harvesting systems cost $2,000–$5,000 for residential. They reduce stormwater runoff (lowering flood risk), cut water bills 30–50%, and earn LEED credits. Most effective in high-rainfall areas. Check local ordinances — some states restrict collection; Florida actively encourages it."),
]

def _fallback_reply(message: str, context: dict | None) -> str:
    msg = message.lower()
    for keyword, reply in _FALLBACK_RESPONSES:
        if keyword in msg:
            if context and context.get("state") == "FL" and "FL" not in reply:
                pass  # use as-is
            return reply

    # Generic fallback
    top_hazard = "flood"
    if context:
        hazards = context.get("hazards", {})
        if hazards:
            top_hazard = max(hazards.items(), key=lambda x: x[1].get("score", 0))[0]

    responses = {
        "flood": "For flood-prone properties, prioritize: elevated HVAC/electrical ($8,000), flood vents ($4,000), and sump pump with backup ($3,500). These reduce damage and can cut NFIP premiums 15–30%. Also consider rainwater harvesting to manage runoff.",
        "fire": "For wildfire risk: ember-resistant vents ($2,500), defensible space clearing ($2,000), and Class A fire-rated roof ($18,000). California's FAIR Plan requires these for coverage. These upgrades also qualify for insurer discounts of 10–20%.",
        "wind": "For wind/hurricane risk: hurricane straps ($3,000) offer the best ROI. Impact windows and a fortified roof system follow. FL insurers discount 25–45% for fortified roofs — get a wind mitigation inspection to document upgrades.",
        "heat": "For heat resilience: cool roof coating ($5,000), attic radiant barrier ($3,000), and HVAC upgrade ($10,000). Combined, these cut energy costs 25–35% and improve comfort. Federal 25C tax credit covers 30% of efficiency upgrade costs.",
        "seismic": "For seismic risk: water heater strapping ($300, best ROI at 33%), cripple wall bracing ($7,000), and foundation anchor bolting ($4,000). A seismic retrofit can reduce earthquake insurance premiums 10–20% and is often required for older homes.",
    }
    return responses.get(top_hazard, "Focus on your property's top risk first. Flood vents, solar with battery backup, and cool roofs offer the best combined ROI for most US properties. The 30% federal ITC applies to solar, and the 25C credit covers insulation and HVAC upgrades.")


_model = None

def _get_model():
    global _model
    if _model is None and settings.gemini_api_key:
        genai.configure(api_key=settings.gemini_api_key)
        _model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=genai.GenerationConfig(max_output_tokens=2048),
            system_instruction=CHAT_SYSTEM,
        )
    return _model


class ChatMessage(BaseModel):
    message: str
    property_context: dict | None = None


@router.post("")
async def chat(body: ChatMessage):
    context_str = ""
    if body.property_context:
        ctx = body.property_context
        hazards = ctx.get("hazards", {})
        top = sorted(hazards.items(), key=lambda x: x[1].get("score", 0), reverse=True)[:2]
        top_str = ", ".join(f"{h} (score {d['score']}/10)" for h, d in top)
        context_str = (
            f"\nProperty: {ctx.get('address', 'unknown')}, State: {ctx.get('state', '?')}, "
            f"Composite risk: {ctx.get('composite_score', '?')}/100, "
            f"Top hazards: {top_str}."
        )

    model = _get_model()
    if model:
        try:
            prompt = f"{context_str}\n\nUser: {body.message}" if context_str else body.message
            response = model.generate_content(prompt)
            return {"reply": response.text.strip()}
        except Exception:
            pass  # fall through to rule-based

    return {"reply": _fallback_reply(body.message, body.property_context)}
