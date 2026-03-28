from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

_ENV_FILE = Path(__file__).parent / ".env"

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=str(_ENV_FILE))
    
    gemini_api_key: str = ""
    database_url: str = "postgresql://postgres:postgres@localhost:5432/climateguard"
    maptiler_key: str = ""
    firststreet_api_key: str = ""
    nasa_firms_key: str = ""
    app_env: str = "development"
    miami_bbox_south: float = 25.5
    miami_bbox_north: float = 25.9
    miami_bbox_west: float = -80.5
    miami_bbox_east: float = -80.1

settings = Settings()
