from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import risk, recommendations, trajectory, properties, heatmap

app = FastAPI(title="Climate Guard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router)
app.include_router(risk.router)
app.include_router(recommendations.router)
app.include_router(trajectory.router)
app.include_router(heatmap.router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "climate-guard-api", "version": "2.0.0"}
