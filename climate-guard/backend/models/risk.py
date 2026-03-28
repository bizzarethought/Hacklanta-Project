from pydantic import BaseModel
from typing import Literal

class HazardDetail(BaseModel):
    score: int  # 1-10
    source: str
    trajectory: Literal["increasing", "stationary", "decreasing"]

class PropertyInfo(BaseModel):
    building_type: str            # "Single-Family Residential", "Commercial", etc.
    damage_category: str          # "RES", "COM", "IND", "PUB", "UNKNOWN"
    structure_value: int | None   # From NSI val_struct
    contents_value: int | None    # From NSI val_cont
    num_stories: int | None
    year_built: int | None
    foundation_type: str | None
    source: str                   # "USACE NSI", "user_input", "default"

class DisasterHistory(BaseModel):
    total_declarations: int          # Total disasters in state (20yr)
    by_type: dict[str, int]          # {"Hurricane": 23, "Flood": 45, ...}
    recent_5yr: int                  # Disasters in last 5 years
    trend: Literal["increasing", "stable", "decreasing"]

class RiskProfile(BaseModel):
    address: str
    lat: float
    lng: float
    composite_score: int               # 1-100
    hazards: dict[str, HazardDetail]
    annual_premium_estimate: int
    insured_value: int
    state: str
    fair_plan_stress: bool
    in_miami_zone: bool
    property_info: PropertyInfo | None = None
    disaster_history: DisasterHistory | None = None
    user_provided_premium: int | None = None
