from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/")
def list_alerts(
    animal_id: int | None = Query(default=None, gt=0),
    status: str | None = Query(
        default=None,
        pattern="^(OPEN|ACKNOWLEDGED|RESOLVED)$",
    ),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
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
                text("SELECT COUNT(*) FROM alerts" + where_clause),
                params,
            ).scalar_one()

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM alerts
                """ + where_clause + """
                    ORDER BY created_at DESC, id DESC
                    LIMIT :limit OFFSET :offset
                """),
                params,
            ).mappings().all()

        return {
            "count": count,
            "limit": limit,
            "offset": offset,
            "alerts": [dict(row) for row in rows],
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve alerts",
        )


@router.get("/{alert_id}")
def get_alert(alert_id: int):
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT * FROM alerts WHERE id = :id"),
                {"id": alert_id},
            ).mappings().first()

        if row is None:
            raise HTTPException(status_code=404, detail="Alert not found")

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve alert",
        )


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int):
    try:
        with engine.begin() as conn:
            row = conn.execute(
                text("SELECT status FROM alerts WHERE id = :id"),
                {"id": alert_id},
            ).first()

            if row is None:
                raise HTTPException(status_code=404, detail="Alert not found")

            if row[0] == "RESOLVED":
                raise HTTPException(
                    status_code=409,
                    detail="A resolved alert cannot be acknowledged",
                )

            conn.execute(
                text("""
                    UPDATE alerts
                    SET status = 'ACKNOWLEDGED'
                    WHERE id = :id
                """),
                {"id": alert_id},
            )

            saved = conn.execute(
                text("SELECT * FROM alerts WHERE id = :id"),
                {"id": alert_id},
            ).mappings().one()

        return dict(saved)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to acknowledge alert",
        )


@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    try:
        with engine.begin() as conn:
            row = conn.execute(
                text("SELECT id FROM alerts WHERE id = :id"),
                {"id": alert_id},
            ).first()

            if row is None:
                raise HTTPException(status_code=404, detail="Alert not found")

            conn.execute(
                text("""
                    UPDATE alerts
                    SET status = 'RESOLVED',
                        resolved_at = COALESCE(resolved_at, :now)
                    WHERE id = :id
                """),
                {"id": alert_id, "now": datetime.now()},
            )

            saved = conn.execute(
                text("SELECT * FROM alerts WHERE id = :id"),
                {"id": alert_id},
            ).mappings().one()

        return dict(saved)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to resolve alert",
        )
