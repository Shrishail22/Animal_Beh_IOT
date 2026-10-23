from datetime import datetime
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

router = APIRouter(
    prefix="/api/activity-sessions",
    tags=["Activity Sessions"],
)

ActivityType = Literal[
    "NORMAL_ACTIVITY",
    "LOW_ACTIVITY",
    "HIGH_ACTIVITY",
    "REST",
    "ABNORMAL",
]


class ActivitySessionCreate(BaseModel):
    animal_id: int = Field(gt=0)
    start_time: datetime | None = None
    activity_type: ActivityType
    average_movement: Decimal | None = Field(
        default=None, ge=0, max_digits=10, decimal_places=4
    )


class ActivitySessionEnd(BaseModel):
    end_time: datetime | None = None


@router.post("/", status_code=201)
def start_activity_session(session: ActivitySessionCreate):
    start_time = session.start_time or datetime.now()

    try:
        with engine.begin() as conn:
            animal = conn.execute(
                text("SELECT id FROM animals WHERE id = :id"),
                {"id": session.animal_id},
            ).first()

            if animal is None:
                raise HTTPException(
                    status_code=404,
                    detail="Animal not found",
                )

            result = conn.execute(
                text("""
                    INSERT INTO activity_sessions (
                        animal_id,
                        start_time,
                        activity_type,
                        average_movement
                    )
                    VALUES (
                        :animal_id,
                        :start_time,
                        :activity_type,
                        :average_movement
                    )
                """),
                {
                    "animal_id": session.animal_id,
                    "start_time": start_time,
                    "activity_type": session.activity_type,
                    "average_movement": session.average_movement,
                },
            )

            session_id = result.lastrowid

            row = conn.execute(
                text("""
                    SELECT *
                    FROM activity_sessions
                    WHERE id = :id
                """),
                {"id": session_id},
            ).mappings().one()

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to start activity session",
        )


@router.get("/")
def list_activity_sessions(
    animal_id: int | None = Query(default=None, gt=0),
    activity_type: ActivityType | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    conditions = []
    params = {"limit": limit, "offset": offset}

    if animal_id is not None:
        conditions.append("animal_id = :animal_id")
        params["animal_id"] = animal_id

    if activity_type is not None:
        conditions.append("activity_type = :activity_type")
        params["activity_type"] = activity_type

    where_clause = (
        " WHERE " + " AND ".join(conditions) if conditions else ""
    )

    try:
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM activity_sessions"
                    + where_clause
                ),
                params,
            ).scalar_one()

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM activity_sessions
                """ + where_clause + """
                    ORDER BY start_time DESC, id DESC
                    LIMIT :limit OFFSET :offset
                """),
                params,
            ).mappings().all()

        return {
            "count": count,
            "limit": limit,
            "offset": offset,
            "sessions": [dict(row) for row in rows],
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve activity sessions",
        )


@router.get("/{session_id}")
def get_activity_session(session_id: int):
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("""
                    SELECT *
                    FROM activity_sessions
                    WHERE id = :id
                """),
                {"id": session_id},
            ).mappings().first()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Activity session not found",
            )

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve activity session",
        )


@router.patch("/{session_id}/end")
def end_activity_session(
    session_id: int,
    request: ActivitySessionEnd,
):
    end_time = request.end_time or datetime.now()

    try:
        with engine.begin() as conn:
            row = conn.execute(
                text("""
                    SELECT start_time, end_time
                    FROM activity_sessions
                    WHERE id = :id
                """),
                {"id": session_id},
            ).mappings().first()

            if row is None:
                raise HTTPException(
                    status_code=404,
                    detail="Activity session not found",
                )

            if row["end_time"] is not None:
                raise HTTPException(
                    status_code=409,
                    detail="Activity session has already ended",
                )

            if end_time < row["start_time"]:
                raise HTTPException(
                    status_code=422,
                    detail="End time cannot be before start time",
                )

            duration_minutes = int(
                (end_time - row["start_time"]).total_seconds() // 60
            )

            conn.execute(
                text("""
                    UPDATE activity_sessions
                    SET end_time = :end_time,
                        duration_minutes = :duration_minutes
                    WHERE id = :id
                """),
                {
                    "id": session_id,
                    "end_time": end_time,
                    "duration_minutes": duration_minutes,
                },
            )

            saved = conn.execute(
                text("""
                    SELECT *
                    FROM activity_sessions
                    WHERE id = :id
                """),
                {"id": session_id},
            ).mappings().one()

        return dict(saved)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to end activity session",
        )
