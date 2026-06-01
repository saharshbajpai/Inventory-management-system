import os
from dotenv import load_dotenv

# Load local .env if available (mainly for local development without docker)
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/inventory_db"
    )
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:3000")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours


settings = Settings()
