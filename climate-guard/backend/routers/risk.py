from fastapi import APIRouter, HTTPException
from backend.risk.scorer import build_risk_profile
from backend.models.risk import RiskProfile

router = APIRouter(prefix="/risk", tags=["risk"])

@router.get("", response_model=RiskProfile)
async def get_risk(
    address: str,
    insured_value: int | None = None,
    user_premium: int | None = None,
    building_type: str | None = None,
):
    try:
        return build_risk_profile(address, insured_value, user_premium, building_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
