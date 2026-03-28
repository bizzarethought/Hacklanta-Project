from fastapi import APIRouter, HTTPException
from backend.ai.synthesizer import get_recommendations
from backend.risk.scorer import build_risk_profile
from backend.models.recommendations import Recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=Recommendations)
async def get_recommendations_endpoint(
    address: str,
    insured_value: int | None = None,
    user_premium: int | None = None,
    building_type: str | None = None,
):
    try:
        profile = build_risk_profile(address, insured_value, user_premium, building_type)
        return get_recommendations(profile)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
