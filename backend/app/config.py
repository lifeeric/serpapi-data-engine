"""Application configuration using Pydantic settings."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/intent_data_engine"
    
    # API Keys
    serpapi_api_key: str = "ef8f4827af8e98b65b19213d532a745a94a19f0f6bb279f35052099ae7e72adf"
    skiptrace_api_key: str = ""
    skiptrace_api_url: str = ""
    
    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    # CORS Configuration
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003"
    ]
    
    # Intent Scoring Configuration
    intent_high_threshold: float = 0.7
    intent_medium_threshold: float = 0.4
    intent_recency_days: int = 90
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
