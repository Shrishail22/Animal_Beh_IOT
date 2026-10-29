from datetime import datetime
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import engine

router = APIRouter(prefix="/api/devices", tags=["Devices"])


class DeviceCreate(BaseModel):
    device_code: str = Field(min_length=1, max_length=50)
    animal_id: int | None = Field(default=None, gt=0)
    device_type: str = Field(default="ESP32", min_length=1, max_length=100)
    firmware_version: str | None = Field(default=None, max_length=50)
    battery_level: Decimal | float | None = Field(
        default=None, ge=0, le=100
    )
    status: Literal["ONLINE", "OFFLINE", "MAINTENANCE"] = "OFFLINE" 


class DeviceUpdate(BaseModel):
    device_type: str | None = Field(default=None, min_length=1, max_length=100)
    firmware_version: str | None = Field(default=None, max_length=50)
    battery_level: Decimal | None = Field(
        default=None, ge=0, le=100, max_digits=5, decimal_places=2
    )
    status: Literal["ONLINE", "OFFLINE", "MAINTENANCE"] | None = None


def get_device(device_id: int):
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM devices WHERE id = :id"),
            {"id": device_id},
        ).mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Device not found")

    return dict(row)


@router.get("/")
def list_devices(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    animal_id: int | None = Query(default=None, gt=0),
    status: Literal["ONLINE", "OFFLINE", "MAINTENANCE"] | None = None,
):
    conditions = []
    params = {"limit": limit, "offset": offset}

    if animal_id is not None:
        conditions.append("animal_id = :animal_id")
        params["animal_id"] = animal_id

    if status is not None:
        conditions.append("status = :status")
        params["status"] = status

    where_clause = (
        " WHERE " + " AND ".join(conditions) if conditions else ""
    )

    try:
        with engine.connect() as conn:
            count = conn.execute(
                text("SELECT COUNT(*) FROM devices" + where_clause),
                params,
            ).scalar_one()

            rows = conn.execute(
                text(
                    "SELECT * FROM devices"
                    + where_clause
                    + " ORDER BY id DESC LIMIT :limit OFFSET :offset"
                ),
                params,
            ).mappings().all()

        return {
            "count": count,
            "limit": limit,
            "offset": offset,
            "devices": [dict(row) for row in rows],
        }
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Unable to retrieve devices")


@router.get("/{device_id}")
def read_device(device_id: int):
    return get_device(device_id)


@router.post("/", status_code=201)
def create_device(device: DeviceCreate):
    data = device.model_dump()
    data["device_code"] = data["device_code"].strip()
    data["device_type"] = data["device_type"].strip()

    if not data["device_code"] or not data["device_type"]:
        raise HTTPException(
            status_code=422,
            detail="Device code and device type cannot be blank",
        )

    if data.get("battery_level") is not None:
        data["battery_level"] = float(data["battery_level"])

    try:
        with engine.begin() as conn:
            if data.get("animal_id") is not None:
                animal = conn.execute(
                    text("SELECT id FROM animals WHERE id = :id"),
                    {"id": data["animal_id"]},
                ).first()

                if animal is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Animal not found",
                    )

            result = conn.execute(
                text("""
                    INSERT INTO devices (
                        device_code, animal_id, device_type,
                        firmware_version, battery_level, status
                    )
                    VALUES (
                        :device_code, :animal_id, :device_type,
                        :firmware_version, :battery_level, :status
                    )
                """),
                data,
            )

            new_id = result.lastrowid

            row = conn.execute(
                text("SELECT * FROM devices WHERE id = :id"),
                {"id": new_id},
            ).mappings().one()

        return dict(row)

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Device code already exists or database constraint failed",
        )
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Unable to create device")


@router.put("/{device_id}")
def update_device(device_id: int, device: DeviceUpdate):
    data = device.model_dump(exclude_unset=True)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update",
        )

    allowed_fields = {
        "device_type",
        "firmware_version",
        "battery_level",
        "status",
    }

    for field in data:
        if field not in allowed_fields:
            raise HTTPException(status_code=400, detail="Invalid update field")

    if "device_type" in data:
        if data["device_type"] is None or not data["device_type"].strip():
            raise HTTPException(
                status_code=422,
                detail="Device type cannot be blank",
            )
        data["device_type"] = data["device_type"].strip()

    assignments = ", ".join(
        f"{field} = :{field}" for field in data
    )
    data["id"] = device_id

    try:
        with engine.begin() as conn:
            existing = conn.execute(
                text("SELECT id FROM devices WHERE id = :id"),
                {"id": device_id},
            ).first()

            if existing is None:
                raise HTTPException(status_code=404, detail="Device not found")

            conn.execute(
                text(
                    "UPDATE devices SET "
                    + assignments
                    + " WHERE id = :id"
                ),
                data,
            )

            row = conn.execute(
                text("SELECT * FROM devices WHERE id = :id"),
                {"id": device_id},
            ).mappings().one()

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Unable to update device")


@router.patch("/{device_id}/status")
def update_device_status(
    device_id: int,
    status: Literal["ONLINE", "OFFLINE", "MAINTENANCE"],
):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    UPDATE devices
                    SET status = :status
                    WHERE id = :id
                """),
                {"id": device_id, "status": status},
            )

            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Device not found")

            row = conn.execute(
                text("SELECT * FROM devices WHERE id = :id"),
                {"id": device_id},
            ).mappings().one()

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to update device status",
        )


@router.patch("/{device_id}/assign/{animal_id}")
def assign_device(device_id: int, animal_id: int):
    try:
        with engine.begin() as conn:
            device = conn.execute(
                text("SELECT id FROM devices WHERE id = :id"),
                {"id": device_id},
            ).first()

            if device is None:
                raise HTTPException(status_code=404, detail="Device not found")

            animal = conn.execute(
                text("SELECT id FROM animals WHERE id = :id"),
                {"id": animal_id},
            ).first()

            if animal is None:
                raise HTTPException(status_code=404, detail="Animal not found")

            conn.execute(
                text("""
                    UPDATE devices
                    SET animal_id = :animal_id
                    WHERE id = :device_id
                """),
                {"animal_id": animal_id, "device_id": device_id},
            )

            row = conn.execute(
                text("SELECT * FROM devices WHERE id = :id"),
                {"id": device_id},
            ).mappings().one()

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Unable to assign device")


@router.patch("/{device_id}/unassign")
def unassign_device(device_id: int):
    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    UPDATE devices
                    SET animal_id = NULL, status = 'OFFLINE'
                    WHERE id = :id
                """),
                {"id": device_id},
            )

            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Device not found")

            row = conn.execute(
                text("SELECT * FROM devices WHERE id = :id"),
                {"id": device_id},
            ).mappings().one()

        return dict(row)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to unassign device",
        )


@router.delete("/{device_id}")
def delete_device(device_id: int):
    try:
        with engine.begin() as conn:
            existing = conn.execute(
                text("SELECT id FROM devices WHERE id = :id"),
                {"id": device_id}
            ).first()

            if existing is None:
                raise HTTPException(status_code=404, detail="Device not found")

            conn.execute(
                text("DELETE FROM devices WHERE id = :id"),
                {"id": device_id}
            )

        return {"message": "Device deleted successfully", "device_id": device_id}
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Unable to delete device")
