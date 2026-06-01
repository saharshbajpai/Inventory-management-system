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

settings = Settings()
