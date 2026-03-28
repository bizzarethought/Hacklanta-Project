from fastapi import APIRouter
from backend.risk.scorer import build_risk_profile
from backend.risk.trajectory import get_premium_trajectory
from backend.ai.synthesizer import get_recommendations

router = APIRouter(prefix="/trajectory", tags=["trajectory"])

@router.get("")
async def get_trajectory(
    address: str,
    insured_value: int | None = None,
    user_premium: int | None = None,
    building_type: str | None = None,
):
    profile = build_risk_profile(address, insured_value, user_premium, building_type)

    # Get total mitigation savings from recommendations to compute mitigated trajectory
    recs = get_recommendations(profile)
    total_savings = recs.total_potential_saving_usd

    return get_premium_trajectory(profile, total_mitigation_savings=total_savings)
