from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import risk, properties, trajectory

app = FastAPI(title="Climate Guard API")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router)
app.include_router(risk.router)
app.include_router(trajectory.router)

@app.get("/")
def read_root():
    return {"status": "healthy"}
