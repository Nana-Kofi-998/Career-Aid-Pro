"""
Career-Aid Pro API — run from project root:

  uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import os
import sys
import logging
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import artifacts, auth, chat, chats, cv, cv_builder, personality, users, document, recovery
from api.routers import cv_analyzer
from api.schemas import HealthResponse

from career_aid_pro import database as db
from career_aid_pro.ai_client import check_ai_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ensure project root is on path when started as `uvicorn api.main:app`
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Maximum request size (10MB)
MAX_REQUEST_SIZE = 10 * 1024 * 1024
IS_PRODUCTION = os.environ.get("CAREER_AID_ENV", "development").lower() == "production"
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("CAREER_AID_RATE_LIMIT_WINDOW", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("CAREER_AID_RATE_LIMIT_MAX", "180"))
_request_times: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = Lock()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Application lifespan management."""
    # Startup
    if IS_PRODUCTION and not os.environ.get("CAREER_AID_JWT_SECRET"):
        raise RuntimeError("CAREER_AID_JWT_SECRET must be set when CAREER_AID_ENV=production")
    db.init_db()
    
    # Check AI service status
    if check_ai_service():
        logger.info("AI service is reachable")
    else:
        logger.warning("AI service is currently unreachable")
    
    yield
    
    # Shutdown (cleanup if needed)
    logger.info("Application shutting down")


app = FastAPI(
    title="Career-Aid Pro API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
_origins = os.environ.get(
    "CAREER_AID_CORS",
    "https://app.career-aid-pro.com",
).split(",")

# Validate and clean origins
allowed_origins = []
for origin in _origins:
    origin = origin.strip()
    if origin and origin.startswith(("http://", "https://")):
        allowed_origins.append(origin)
    elif origin:
        logger.warning("Invalid CORS origin (must start with http:// or https://): %s", origin)

if not allowed_origins:
    logger.warning("No valid CORS origins configured. Using development defaults.")
    allowed_origins = ["https://app.career-aid-pro.com"]

logger.info("CORS allowed origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Request-Id", "Content-Disposition"],
)


@app.middleware("http")
async def request_size_middleware(request: Request, call_next):
    """Middleware to enforce maximum request size."""
    content_length = request.headers.get("content-length")
    try:
        request_size = int(content_length) if content_length else 0
    except ValueError:
        return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header"})
    if request_size > MAX_REQUEST_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": f"Request too large. Maximum size is {MAX_REQUEST_SIZE // (1024*1024)}MB"}
        )
    return await call_next(request)


@app.middleware("http")
async def global_rate_limit_middleware(request: Request, call_next):
    """Apply a coarse per-client rate limit to protect all API features."""
    if not request.url.path.startswith("/api"):
        return await call_next(request)

    forwarded_for = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded_for.split(",", 1)[0].strip() or (request.client.host if request.client else "unknown")
    now = time.time()
    with _rate_limit_lock:
      window_start = now - RATE_LIMIT_WINDOW_SECONDS
      times = _request_times[client_ip]
      while times and times[0] < window_start:
          times.popleft()
      if len(times) >= RATE_LIMIT_MAX_REQUESTS:
          return JSONResponse(
              status_code=429,
              content={"detail": "Too many requests. Please wait a moment and try again."},
          )
      times.append(now)

    return await call_next(request)


@app.middleware("http")
async def add_security_headers_and_request_id(request: Request, call_next):
    """Add request IDs and browser security headers to every response."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'; "
        "object-src 'none'"
    )
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Normalize handled API errors and include a request ID."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "request_id": getattr(request.state, "request_id", "unknown"),
        },
        headers=exc.headers,
    )


from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format Pydantic schema validation errors into human-readable sentences."""
    errors = exc.errors()
    if errors:
        err = errors[0]
        # Get the field name (e.g. "username")
        field = str(err.get("loc", ["field"])[-1])
        # Clean up field name for UI (e.g., "first_name" -> "First name")
        field_display = field.replace("_", " ").capitalize()
        
        # Check specific validation conditions
        msg = err.get("msg", "Invalid input")
        
        if "at least 3 characters" in msg:
            detail = f"{field_display} must be at least 3 characters long."
        elif "at least 8 characters" in msg:
            detail = f"{field_display} must be at least 8 characters long."
        elif "at most" in msg:
            detail = f"{field_display} is too long."
        elif "value is not a valid integer" in msg:
            detail = f"Please enter a valid number for {field_display.lower()}."
        else:
            detail = f"{field_display}: {msg}."
    else:
        detail = "Please check your inputs and try again."

    return JSONResponse(
        status_code=422,
        content={
            "detail": detail,
            "request_id": getattr(request.state, "request_id", "unknown"),
        },
    )



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": getattr(request.state, "request_id", "unknown")}
    )


# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(recovery.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(cv.router, prefix="/api")
app.include_router(cv_builder.router, prefix="/api")
app.include_router(cv_analyzer.router, prefix="/api")
app.include_router(personality.router, prefix="/api")

app.include_router(document.router, prefix="/api")
app.include_router(artifacts.router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    ai_service_online = check_ai_service()
    db_status = "ok"
    
    try:
        # Quick database check
        conn = db.get_connection()
        conn.execute("SELECT 1")
        conn.close()
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error("Database health check failed: %s", e)
    
    overall_status = "ok"
    if not ai_service_online:
        overall_status = "degraded"
    if db_status != "ok":
        overall_status = "degraded"
    
    return HealthResponse(
        status=overall_status,
        ai_service_online=ai_service_online,
    )


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(_ROOT, "frontend", "dist")

# Register a custom 404 handler to handle SPA client-side routing
@app.exception_handler(404)
async def spa_404_handler(request: Request, exc: HTTPException):
    # If the error is on an API route, return standard JSON 404
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=404,
            content={"detail": "Not Found", "request_id": getattr(request.state, "request_id", "unknown")}
        )
    
    # Otherwise, fall back to index.html for React SPA
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

# Mount the static files at the root so they are served directly with correct MIME types
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")



