from pydantic import BaseModel
from typing import Literal

class HazardDetail(BaseModel):
    score: int  # 1-10
    source: str
    trajectory: Literal["increasing", "stationary", "decreasing"]

class RiskProfile(BaseModel):
    address: str
    lat: float
    lng: float
    composite_score: int  # 1-100
    hazards: dict[str, HazardDetail]
    annual_premium_estimate: int
    insured_value: int
    state: str
    fair_plan_stress: bool
    in_miami_zone: bool
