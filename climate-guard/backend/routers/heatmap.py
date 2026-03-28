from fastapi import APIRouter, Query
from backend.risk.heatmap_data import get_available_layers, get_layer_geojson

router = APIRouter(prefix="/heatmap", tags=["heatmap"])

@router.get("/layers")
async def list_layers():
    """Return all available heatmap layer metadata."""
    return get_available_layers()

@router.get("/data")
async def get_data(layers: str = Query("flood,fire,wind,heat,seismic,disasters")):
    """Return GeoJSON data for requested layers (comma-separated)."""
    layer_ids = [l.strip() for l in layers.split(",") if l.strip()]
    return get_layer_geojson(layer_ids)
