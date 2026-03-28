from pydantic import BaseModel

class Improvement(BaseModel):
    action: str
    cost_usd: int
    annual_saving_usd: int
    roi_pct: float

class Insurer(BaseModel):
    name: str
    coverage_type: str
    notes: str

class Recommendations(BaseModel):
    summary: str
    improvements: list[Improvement]
    insurers: list[Insurer]
    total_potential_saving_usd: int
