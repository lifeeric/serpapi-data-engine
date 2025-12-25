"""Application configuration using Pydantic settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Any
from pydantic import field_validator
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database (Loads from DATABASE_URL)
    database_url: str = "postgresql://postgres:postgres@localhost:5432/intent_data_engine"
    
    # API Keys
    serpapi_api_key: str = ""
    skiptrace_api_key: str = ""
    skiptrace_api_url: str = ""
    
    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    # CORS Configuration
    # We use Any here to prevent Pydantic-Settings from trying to JSON-parse
    # the string before our validator can split it by commas.
    cors_origins: Any = ["http://localhost:3000", "http://localhost:3001"]
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            # If it's a JSON-like string, try parsing it, otherwise split by comma
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except:
                    pass
            return [i.strip() for i in v.split(",")]
        return v
    
    # Intent Scoring Configuration
    intent_high_threshold: float = 0.7
    intent_medium_threshold: float = 0.4
    intent_recency_days: int = 90
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
