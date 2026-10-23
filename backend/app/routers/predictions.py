from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine

router = APIRouter(
    prefix="/api/predictions",
    tags=["Behaviour Predictions"],
)

MODEL_VERSION = "RULE_BASELINE_v1"


def classify_reading(reading):
    """
    Transparent baseline rules for pipeline testing only.
    These thresholds are not clinically validated.
    """

    movement = float(reading["movement"])
    activity = int(reading["activity_duration"])
    rest = int(reading["rest_duration"])
    frequency = int(reading["activity_frequency"])

    # Illustrative rules, not a trained ML model.
    if movement < 1.0 and activity <= 2 and rest >= 20:
        behavior = "LOW_ACTIVITY"
        risk = "MEDIUM"
        confidence = 0.70

    elif movement >= 15.0 and activity >= 15 and frequency >= 8:
        behavior = "HIGH_ACTIVITY"
        risk = "MEDIUM"
        confidence = 0.70

    elif movement >= 1.0 and movement < 15.0:
        behavior = "NORMAL"
        risk = "LOW"
        confidence = 0.65

    else:
        behavior = "ABNORMAL"
        risk = "MEDIUM"
        confidence = 0.55

    return {
        "predicted_behavior": behavior,
        "risk_level": risk,
        "confidence": confidence,
        "model_version": MODEL_VERSION,
    }


def create_alert_if_needed(conn, animal_id, prediction_id, behavior, risk):
    alert_details = {
        "LOW_ACTIVITY": (
            "LOW_ACTIVITY",
            "Low activity detected by the rule-based baseline.",
        ),
        "HIGH_ACTIVITY": (
            "HIGH_ACTIVITY",
            "High activity detected by the rule-based baseline.",
        ),
        "ABNORMAL": (
            "ABNORMAL_BEHAVIOR",
            "An unusual sensor pattern was detected by the rule-based baseline.",
        ),
    }

    # NORMAL/LOW predictions do not create alerts.
    if behavior == "NORMAL" and risk == "LOW":
        return None

    alert_type, message = alert_details.get(
        behavior,
        (
            "ABNORMAL_BEHAVIOR",
            "A potential behaviour concern was flagged by the baseline.",
        ),
    )

    severity = "MEDIUM" if risk == "MEDIUM" else "LOW"

    # Avoid repeated open alerts of the same type for the same animal.
    existing = conn.execute(
        text("""
            SELECT id
            FROM alerts
            WHERE animal_id = :animal_id
              AND alert_type = :alert_type
              AND status = 'OPEN'
            LIMIT 1
        """),
        {
            "animal_id": animal_id,
            "alert_type": alert_type,
        },
    ).first()

    if existing:
        return existing[0]

    result = conn.execute(
        text("""
            INSERT INTO alerts (
                animal_id,
                prediction_id,
                alert_type,
                severity,
                message,
                status
            )
            VALUES (
                :animal_id,
                :prediction_id,
                :alert_type,
                :severity,
                :message,
                'OPEN'
            )
        """),
        {
            "animal_id": animal_id,
            "prediction_id": prediction_id,
            "alert_type": alert_type,
            "severity": severity,
            "message": message,
        },
    )

    return result.lastrowid


@router.post("/from-reading/{reading_id}", status_code=201)
def predict_from_reading(reading_id: int):
    try:
        with engine.begin() as conn:
            reading = conn.execute(
                text("""
                    SELECT *
                    FROM sensor_readings
                    WHERE id = :reading_id
                """),
                {"reading_id": reading_id},
            ).mappings().first()

            if reading is None:
                raise HTTPException(
                    status_code=404,
                    detail="Sensor reading not found",
                )

            prediction = classify_reading(reading)

            result = conn.execute(
                text("""
                    INSERT INTO behavioral_predictions (
                        animal_id,
                        reading_id,
                        predicted_behavior,
                        confidence,
                        risk_level,
                        model_version
                    )
                    VALUES (
                        :animal_id,
                        :reading_id,
                        :predicted_behavior,
                        :confidence,
                        :risk_level,
                        :model_version
                    )
                """),
                {
                    "animal_id": reading["animal_id"],
                    "reading_id": reading_id,
                    **prediction,
                },
            )

            prediction_id = result.lastrowid

            alert_id = create_alert_if_needed(
                conn=conn,
                animal_id=reading["animal_id"],
                prediction_id=prediction_id,
                behavior=prediction["predicted_behavior"],
                risk=prediction["risk_level"],
            )

            saved = conn.execute(
                text("""
                    SELECT *
                    FROM behavioral_predictions
                    WHERE id = :id
                """),
                {"id": prediction_id},
            ).mappings().one()

        return {
            "prediction": dict(saved),
            "alert_id": alert_id,
            "notice": (
                "Rule-based baseline only; not a trained or clinically "
                "validated ML prediction."
            ),
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to save prediction",
        )


@router.get("/")
def list_predictions(
    animal_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    where_clause = ""
    params = {"limit": limit, "offset": offset}

    if animal_id is not None:
        where_clause = " WHERE animal_id = :animal_id"
        params["animal_id"] = animal_id

    try:
        with engine.connect() as conn:
            count = conn.execute(
                text(
                    "SELECT COUNT(*) FROM behavioral_predictions"
                    + where_clause
                ),
                params,
            ).scalar_one()

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM behavioral_predictions
                """ + where_clause + """
                    ORDER BY predicted_at DESC, id DESC
                    LIMIT :limit OFFSET :offset
                """),
                params,
            ).mappings().all()

        return {
            "count": count,
            "limit": limit,
            "offset": offset,
            "predictions": [dict(row) for row in rows],
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve predictions",
        )


@router.get("/{prediction_id}")
def get_prediction(prediction_id: int):
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("""
                    SELECT *
                    FROM behavioral_predictions
                    WHERE id = :id
                """),
                {"id": prediction_id},
            ).mappings().first()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Prediction not found",
            )

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve prediction",
        )
