from fastapi import FastAPI
from database import engine
import models
from router import router

from fastapi.middleware.cors import CORSMiddleware

# Automatically create SQLAlchemy tables (simplifies SQLite initialization)
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI App with Swagger description
app = FastAPI(
    title="Route 53 Clone API (Route-52)",
    description=(
        "A modular, robust REST API that simulates AWS Route53 hosted zones "
        "and DNS records. Built using FastAPI, SQLAlchemy, SQLite, and Pydantic v2."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root status/welcome endpoint
@app.get("/", tags=["General"], summary="Welcome or service health status")
def root_status():
    return {
        "status": "online",
        "service": "Route-53 Scalar API",
        "documentation": "/docs"
    }

# Register the routes
app.include_router(router)
