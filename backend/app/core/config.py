import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "AeroLux Airlines Management Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aerolux_super_secret_jwt_key_2026_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aerolux.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # Airline specific business rules
    CURRENCY: str = "USD"
    CHECKIN_WINDOW_HOURS_BEFORE_DEPARTURE: int = 48
    TAX_RATE: float = 0.12  # 12% airport tax & fees
    FUEL_SURCHARGE: float = 45.0  # $45 fixed surcharge per passenger
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
