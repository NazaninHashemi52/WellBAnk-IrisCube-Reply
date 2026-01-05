from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.clients import router as clients_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.batch import router as batch_router
from app.api.v1.clusters import router as clusters_router
from app.api.v1.debug import router as debug_router
from app.api.v1.offers import router as offers_router

app = FastAPI(title=settings.APP_NAME)

# CORS (frontend)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include all routers with consistent API prefix
api_prefix = settings.API_V1_STR
app.include_router(clients_router, prefix=api_prefix)
app.include_router(datasets_router, prefix=api_prefix)
app.include_router(batch_router, prefix=api_prefix)
app.include_router(clusters_router, prefix=api_prefix)
app.include_router(debug_router, prefix=api_prefix)
app.include_router(offers_router, prefix=api_prefix)
