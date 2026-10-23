from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app.database import test_database_connection, engine, init_db
from app.routers.animals import router as animals_router
from app.routers.devices import router as devices_router
from app.routers.sensor_readings import router as sensor_readings_router
from app.routers.predictions import router as predictions_router
from app.routers.alerts import router as alerts_router
from app.routers.activity_sessions import router as activity_sessions_router
from app.routers.dashboard import router as dashboard_router
from app.routers.auth import router as auth_router
from app.routers.reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema and initial data are ready
    try:
        init_db()
    except Exception as exc:
        print("[WARNING] Database auto-init error:", exc)
    yield


app = FastAPI(
    title="Animal Behavioural Monitoring API",
    description="Backend for IoT-based animal monitoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(animals_router)
app.include_router(devices_router)
app.include_router(sensor_readings_router)
app.include_router(predictions_router)
app.include_router(alerts_router)
app.include_router(activity_sessions_router)
app.include_router(dashboard_router)
app.include_router(reports_router)


@app.get("/")
def home():
    return {
        "message": "Animal Monitoring Backend is running",
        "status": "success"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "Animal Behavioural Monitoring System",
        "database": test_database_connection()
    }


@app.get("/api/health/database")
def database_health():
    try:
        database_name = test_database_connection()
        return {
            "status": "connected",
            "database": database_name
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )


@app.get("/api/db/tables")
def list_database_tables():
    try:
        inspector = inspect(engine)
        return {
            "database": engine.url.database or "animaldb",
            "tables": inspector.get_table_names()
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to inspect database tables"
        )
