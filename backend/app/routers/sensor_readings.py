from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

router = APIRouter(
    prefix="/api/sensor-readings",
    tags=["Sensor Readings"],
)


class SensorReadingCreate(BaseModel):
    device_id: int = Field(gt=0)
    movement: Decimal = Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=4)
    temperature: Decimal | None = Field(
        default=None, ge=0, le=100, max_digits=5, decimal_places=2
    )
    activity_duration: int = Field(default=0, ge=0, le=4294967295)
    rest_duration: int = Field(default=0, ge=0, le=4294967295)
    activity_frequency: int = Field(default=0, ge=0, le=4294967295)
    recorded_at: datetime | None = None


@router.post("/", status_code=201)
def create_sensor_reading(reading: SensorReadingCreate):
    data = reading.model_dump()

    try:
        with engine.begin() as conn:
            device = conn.execute(
                text("""
                    SELECT id, animal_id, status
                    FROM devices
                    WHERE id = :device_id
                """),
                {"device_id": data["device_id"]},
            ).mappings().first()

            if device is None:
                raise HTTPException(
                    status_code=404,
                    detail="Device not found. Register the device first.",
                )

            if device["status"] == "MAINTENANCE":
                raise HTTPException(
                    status_code=409,
                    detail="Device is in maintenance and cannot submit readings",
                )

            recorded_at = data["recorded_at"] or datetime.now()

            result = conn.execute(
                text("""
                    INSERT INTO sensor_readings (
                        device_id,
                        animal_id,
                        movement,
                        temperature,
                        activity_duration,
                        rest_duration,
                        activity_frequency,
                        recorded_at
                    )
                    VALUES (
                        :device_id,
                        :animal_id,
                        :movement,
                        :temperature,
                        :activity_duration,
                        :rest_duration,
                        :activity_frequency,
                        :recorded_at
                    )
                """),
                {
                    **data,
                    "animal_id": device["animal_id"],
                    "recorded_at": recorded_at,
                },
            )

            reading_id = result.lastrowid

            # Successful ingestion means the device was recently seen.
            # Do not overwrite the device's status if it is in maintenance.
            conn.execute(
                text("""
                    UPDATE devices
                    SET status = 'ONLINE', last_seen = :last_seen
                    WHERE id = :device_id
                """),
                {
                    "last_seen": recorded_at,
                    "device_id": data["device_id"],
                },
            )

            row = conn.execute(
                text("""
                    SELECT *
                    FROM sensor_readings
                    WHERE id = :id
                """),
                {"id": reading_id},
            ).mappings().one()

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to save sensor reading",
        )


@router.get("/")
def list_sensor_readings(
    animal_id: int | None = Query(default=None, gt=0),
    device_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    conditions = []
    params = {"limit": limit, "offset": offset}

    if animal_id is not None:
        conditions.append("animal_id = :animal_id")
        params["animal_id"] = animal_id

    if device_id is not None:
        conditions.append("device_id = :device_id")
        params["device_id"] = device_id

    where_clause = (
        " WHERE " + " AND ".join(conditions) if conditions else ""
    )

    try:
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM sensor_readings"
                    + where_clause
                ),
                params,
            ).scalar_one()

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM sensor_readings
                """ + where_clause + """
                    ORDER BY recorded_at DESC, id DESC
                    LIMIT :limit OFFSET :offset
                """),
                params,
            ).mappings().all()

        return {
            "count": count,
            "limit": limit,
            "offset": offset,
            "readings": [dict(row) for row in rows],
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve sensor readings",
        )


@router.get("/{reading_id}")
def get_sensor_reading(reading_id: int):
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("""
                    SELECT *
                    FROM sensor_readings
                    WHERE id = :id
                """),
                {"id": reading_id},
            ).mappings().first()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Sensor reading not found",
            )

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve sensor reading",
        )