import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.events.dispatcher import process_pending_outbox_events

# Import all models to ensure registration with Base.metadata
import backend.app.models

# Routers
from backend.app.controllers import (
    auth_controller,
    flight_controller,
    seat_controller,
    booking_controller,
    checkin_controller,
    admin_controller,
    analytics_controller
)


async def outbox_poller_worker():
    """
    Background worker loop for the Event-Driven Architecture (EDA).
    Regularly polls the Outbox table and dispatches pending events.
    """
    while True:
        try:
            db = SessionLocal()
            try:
                process_pending_outbox_events(db, limit=20)
            finally:
                db.close()
        except Exception:
            pass
        await asyncio.sleep(5)  # Poll every 5 seconds


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Start EDA outbox background worker task
    worker_task = asyncio.create_task(outbox_poller_worker())
    yield
    # Shutdown worker
    worker_task.cancel()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack Airline Management Platform inspired by luxury international carriers (AeroLux Airlines). Built with hybrid MVC and EDA architecture.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_prefix = settings.API_V1_STR
app.include_router(auth_controller.router, prefix=api_prefix)
app.include_router(flight_controller.router, prefix=api_prefix)
app.include_router(seat_controller.router, prefix=api_prefix)
app.include_router(booking_controller.router, prefix=api_prefix)
app.include_router(checkin_controller.router, prefix=api_prefix)
app.include_router(admin_controller.router, prefix=api_prefix)
app.include_router(analytics_controller.router, prefix=api_prefix)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": engine.name
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
