from fastapi import APIRouter
from typing import List, Dict
import random

# In a real app we'd load baseline_premium based on property lookup,
# but for the MVP, we can simulate based on geocoded location.
from risk.trajectory import get_trajectory_data

router = APIRouter(prefix="/trajectory", tags=["Trajectory"])

@router.get("/")
def get_trajectory(address: str) -> List[Dict[str, int]]:
    """
    Returns year-by-year premium projection data (feeds the bar chart).
    """
    if "125 ocean" in address.lower():
        baseline_premium = 9450
    else:
        # Simulate base premium based on standard generic CA or logic
        baseline_premium = 4500
        
    return get_trajectory_data(baseline_premium)
