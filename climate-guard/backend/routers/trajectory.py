from fastapi import APIRouter
from backend.risk.scorer import build_risk_profile
from backend.risk.trajectory import get_premium_trajectory

router = APIRouter(prefix="/trajectory", tags=["trajectory"])

@router.get("")
async def get_trajectory(address: str, insured_value: int = 1_200_000):
    profile = build_risk_profile(address, insured_value)
    return get_premium_trajectory(profile)
