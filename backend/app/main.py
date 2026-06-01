from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.models import Base
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Inventory & Order Management API",
    description="A simplified full-stack Inventory & Order Management API",
    version="1.0.0",
    lifespan=lifespan
)

# Set CORS origins (comma-separated in CORS_ORIGIN env var)
origins = [
    o.strip()
    for o in settings.CORS_ORIGIN.split(",")
    if o.strip()
]
origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])
origins = list(dict.fromkeys(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
