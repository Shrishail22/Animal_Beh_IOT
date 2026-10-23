
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary():
    """Return summary statistics for the main dashboard."""

    try:
        with engine.connect() as conn:
            # Animal statistics
            animals = conn.execute(text("""
                SELECT
                    COUNT(*) AS total_animals,
                    COALESCE(SUM(status = 'ACTIVE'), 0) AS active_animals
                FROM animals
            """)).mappings().one()

            # Device statistics
            devices = conn.execute(text("""
                SELECT
                    COUNT(*) AS total_devices,
                    COALESCE(SUM(status = 'ONLINE'), 0) AS online_devices,
                    COALESCE(SUM(status = 'OFFLINE'), 0) AS offline_devices,
                    COALESCE(SUM(status = 'MAINTENANCE'), 0)
                        AS maintenance_devices
                FROM devices
            """)).mappings().one()

            # Sensor readings
            readings = conn.execute(text("""
                SELECT
                    COUNT(*) AS total_readings,
                    MAX(recorded_at) AS latest_reading_at
                FROM sensor_readings
            """)).mappings().one()

            # Alerts that still need attention
            alerts = conn.execute(text("""
                SELECT
                    COUNT(*) AS total_alerts,
                    COALESCE(SUM(status = 'OPEN'), 0) AS open_alerts,
                    COALESCE(SUM(status = 'ACKNOWLEDGED'), 0)
                        AS acknowledged_alerts,
                    COALESCE(SUM(severity = 'CRITICAL'
                        AND status != 'RESOLVED'), 0) AS critical_alerts
                FROM alerts
            """)).mappings().one()

            # Latest prediction for each behavior category
            behavior_rows = conn.execute(text("""
                SELECT predicted_behavior, COUNT(*) AS count
                FROM behavioral_predictions
                GROUP BY predicted_behavior
            """)).mappings().all()

            behavior_distribution = {
                row["predicted_behavior"]: row["count"]
                for row in behavior_rows
            }

            # Latest sensor readings with animal and device details
            recent_readings = conn.execute(text("""
                SELECT
                    sr.id,
                    sr.animal_id,
                    a.name AS animal_name,
                    a.animal_code,
                    sr.device_id,
                    d.device_code,
                    sr.movement,
                    sr.temperature,
                    sr.activity_duration,
                    sr.rest_duration,
                    sr.activity_frequency,
                    sr.recorded_at
                FROM sensor_readings sr
                JOIN animals a ON a.id = sr.animal_id
                JOIN devices d ON d.id = sr.device_id
                ORDER BY sr.recorded_at DESC, sr.id DESC
                LIMIT 10
            """)).mappings().all()

            # Recent alerts
            recent_alerts = conn.execute(text("""
                SELECT
                    al.id,
                    al.animal_id,
                    a.name AS animal_name,
                    al.alert_type,
                    al.severity,
                    al.message,
                    al.status,
                    al.created_at
                FROM alerts al
                JOIN animals a ON a.id = al.animal_id
                ORDER BY al.created_at DESC, al.id DESC
                LIMIT 10
            """)).mappings().all()

            return {
                "success": True,
                "summary": {
                    "total_animals": animals["total_animals"],
                    "active_animals": animals["active_animals"],
                    "total_devices": devices["total_devices"],
                    "online_devices": devices["online_devices"],
                    "offline_devices": devices["offline_devices"],
                    "maintenance_devices": devices["maintenance_devices"],
                    "total_sensor_readings": readings["total_readings"],
                    "latest_reading_at": readings["latest_reading_at"],
                    "total_alerts": alerts["total_alerts"],
                    "open_alerts": alerts["open_alerts"],
                    "acknowledged_alerts": alerts["acknowledged_alerts"],
                    "critical_alerts": alerts["critical_alerts"],
                    "total_predictions": sum(
                        behavior_distribution.values()
                    ),
                },
                "behavior_distribution": behavior_distribution,
                "recent_readings": [dict(row) for row in recent_readings],
                "recent_alerts": [dict(row) for row in recent_alerts],
            }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve dashboard data from the database."
        ) from exc
