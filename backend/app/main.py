from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api.v1.clients import router as clients_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.batch import router as batch_router
from app.api.v1.clusters import router as clusters_router
from app.api.v1.offers import router as offers_router
import os

app = FastAPI(title=settings.APP_NAME)

# CORS (frontend) - MUST be added before other middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers are sent even on unhandled exceptions"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with CORS headers"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with CORS headers"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
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
app.include_router(offers_router, prefix=api_prefix)

# Debug router only in development
if os.getenv("ENVIRONMENT", "production") == "development":
    from app.api.v1.debug import router as debug_router
    app.include_router(debug_router, prefix=api_prefix)
