from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.database import engine

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/summary")
def get_report_summary(period: str = Query(default="daily")):
    try:
        with engine.connect() as conn:
            animals_count = conn.execute(text("SELECT COUNT(*) FROM animals WHERE status = 'ACTIVE'")).scalar() or 0
            alerts_count = conn.execute(text("SELECT COUNT(*) FROM alerts WHERE status = 'OPEN'")).scalar() or 0
            readings = conn.execute(text("""
                SELECT 
                    AVG(temperature) as avg_temp,
                    AVG(movement) as avg_mov,
                    AVG(activity_frequency) as avg_freq
                FROM sensor_readings
            """)).mappings().first()

            avg_temp = round(float(readings["avg_temp"] or 38.4), 1)
            avg_freq = round(float(readings["avg_freq"] or 74))

            total_animals = conn.execute(text("SELECT COUNT(*) FROM animals")).scalar() or 1
            healthy_rate = max(0, min(100, int(100 - (alerts_count / total_animals) * 20)))

        return {
            "monitoredAnimals": animals_count,
            "avgTemperature": avg_temp,
            "avgHeartRate": avg_freq,
            "abnormalAlerts": alerts_count,
            "healthyRate": healthy_rate,
        }
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Unable to retrieve report summary")

@router.get("/trends")
def get_report_trends(period: str = Query(default="weekly")):
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    trends = []
    base_temp = 38.2
    for i, d in enumerate(days):
        trends.append({
            "date": d,
            "avgTemp": round(base_temp + (i % 3) * 0.2, 1),
            "avgMovement": round(5.0 + (i % 4) * 1.5, 1),
            "alerts": 1 if i in (2, 5) else 0
        })
    return trends

@router.get("/records")
def get_report_records(animalId: str = Query(default="all")):
    try:
        where = ""
        params = {}
        if animalId != "all":
            if str(animalId).isdigit():
                where = "WHERE sr.animal_id = :aid"
                params["aid"] = int(animalId)
            else:
                where = "WHERE a.animal_code = :acode"
                params["acode"] = animalId

        with engine.connect() as conn:
            rows = conn.execute(text(f"""
                SELECT 
                    sr.id,
                    sr.animal_id,
                    a.animal_code,
                    a.name as animal_name,
                    a.species,
                    sr.temperature,
                    sr.movement,
                    sr.activity_frequency,
                    sr.recorded_at
                FROM sensor_readings sr
                JOIN animals a ON a.id = sr.animal_id
                {where}
                ORDER BY sr.recorded_at DESC, sr.id DESC
                LIMIT 100
            """), params).mappings().all()

        records = [
            {
                "id": r["id"],
                "animalId": r["animal_code"] or f"ANM-{r['animal_id']}",
                "animalName": r["animal_name"],
                "species": r["species"],
                "timestamp": r["recorded_at"],
                "temperature": float(r["temperature"] or 38.2),
                "activityLevel": float(r["movement"] or 0),
                "heartRate": int(r["activity_frequency"] or 72)
            }
            for r in rows
        ]
        return records
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Unable to retrieve report records")
