
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


class AnimalCreate(BaseModel):
    animal_code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    species: str = Field(min_length=1, max_length=100)

    breed: str | None = Field(default=None, max_length=100)
    gender: Literal["MALE", "FEMALE", "UNKNOWN"] = "UNKNOWN"
    date_of_birth: date | None = None
    weight_kg: Decimal | None = Field(
        default=None,
        ge=0,
        le=9999.99,
        max_digits=6,
        decimal_places=2
    )
    owner_name: str | None = Field(default=None, max_length=150)
    status: Literal["ACTIVE", "INACTIVE", "REMOVED"] = "ACTIVE"


class AnimalUpdate(BaseModel):
    animal_code: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    species: str | None = Field(default=None, min_length=1, max_length=100)
    breed: str | None = Field(default=None, max_length=100)
    gender: Literal["MALE", "FEMALE", "UNKNOWN"] | None = None
    date_of_birth: date | None = None
    weight_kg: Decimal | None = Field(
        default=None,
        ge=0,
        le=9999.99,
        max_digits=6,
        decimal_places=2
    )
    owner_name: str | None = Field(default=None, max_length=150)
    status: Literal["ACTIVE", "INACTIVE", "REMOVED"] | None = None


router = APIRouter(
    prefix="/api/animals",
    tags=["Animals"]
)


@router.get("/")
def get_animals(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):
    """Retrieve animal records from the existing MySQL table."""

    query = text("""
        SELECT
            id,
            animal_code,
            name,
            species,
            breed,
            gender,
            date_of_birth,
            weight_kg,
            owner_name,
            status,
            created_at,
            updated_at
        FROM animals
        ORDER BY id
        LIMIT :limit OFFSET :offset
    """)

    try:
        with engine.connect() as connection:
            rows = connection.execute(
                query,
                {"limit": limit, "offset": offset}
            ).mappings().all()

            animals = [dict(row) for row in rows]

        return {
            "count": len(animals),
            "limit": limit,
            "offset": offset,
            "animals": animals
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve animal records"
        )


@router.get("/{animal_id}")
def get_animal(animal_id: int):
    """Retrieve one animal by its database ID."""

    query = text("""
        SELECT
            id,
            animal_code,
            name,
            species,
            breed,
            gender,
            date_of_birth,
            weight_kg,
            owner_name,
            status,
            created_at,
            updated_at
        FROM animals
        WHERE id = :animal_id
    """)

    try:
        with engine.connect() as connection:
            row = connection.execute(
                query,
                {"animal_id": animal_id}
            ).mappings().first()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Animal not found"
            )

        return dict(row)

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve animal record"
        )


@router.post("/", status_code=201)
def create_animal(animal: AnimalCreate):
    query = text("""
        INSERT INTO animals (
            animal_code,
            name,
            species,
            breed,
            gender,
            date_of_birth,
            weight_kg,
            owner_name,
            status
        )
        VALUES (
            :animal_code,
            :name,
            :species,
            :breed,
            :gender,
            :date_of_birth,
            :weight_kg,
            :owner_name,
            :status
        )
    """)

    values = animal.model_dump()

    # Avoid accidental leading/trailing spaces in text fields.
    for field in ("animal_code", "name", "species"):
        values[field] = values[field].strip()

    if not all(values[field] for field in (
        "animal_code", "name", "species"
    )):
        raise HTTPException(
            status_code=422,
            detail="Animal code, name, and species cannot be blank"
        )

    try:
        with engine.begin() as connection:
            result = connection.execute(query, values)
            new_id = result.lastrowid

            created = connection.execute(
                text("""
                    SELECT *
                    FROM animals
                    WHERE id = :animal_id
                """),
                {"animal_id": new_id}
            ).mappings().one()

            return dict(created)

    except IntegrityError as error:
        message = str(error.orig)

        if "Duplicate entry" in message:
            raise HTTPException(
                status_code=409,
                detail="Animal code already exists"
            )

        raise HTTPException(
            status_code=409,
            detail="Animal record violates a database constraint"
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to register animal"
        )


@router.put("/{animal_id}")
def update_animal(animal_id: int, animal: AnimalUpdate):
    updates = animal.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update"
        )

    for field in ("animal_code", "name", "species"):
        if field in updates:
            if updates[field] is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} cannot be null"
                )
            updates[field] = updates[field].strip()

            if not updates[field]:
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} cannot be blank"
                )

    if "gender" in updates and updates["gender"] is None:
        raise HTTPException(status_code=422, detail="Gender cannot be null")

    if "status" in updates and updates["status"] is None:
        raise HTTPException(status_code=422, detail="Status cannot be null")

    allowed_fields = {
        "animal_code", "name", "species", "breed", "gender",
        "date_of_birth", "weight_kg", "owner_name", "status"
    }

    try:
        with engine.begin() as connection:
            existing = connection.execute(
                text("SELECT id FROM animals WHERE id = :id"),
                {"id": animal_id}
            ).first()

            if existing is None:
                raise HTTPException(
                    status_code=404,
                    detail="Animal not found"
                )

            assignments = ", ".join(
                f"`{field}` = :{field}"
                for field in updates
                if field in allowed_fields
            )

            connection.execute(
                text(
                    f"UPDATE animals SET {assignments} "
                    "WHERE id = :animal_id"
                ),
                {**updates, "animal_id": animal_id}
            )

            updated = connection.execute(
                text("SELECT * FROM animals WHERE id = :id"),
                {"id": animal_id}
            ).mappings().one()

            return dict(updated)

    except IntegrityError as error:
        if "Duplicate entry" in str(error.orig):
            raise HTTPException(
                status_code=409,
                detail="Animal code already exists"
            )
        raise HTTPException(
            status_code=409,
            detail="Update violates a database constraint"
        )
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to update animal"
        )


@router.patch("/{animal_id}/deactivate")
def deactivate_animal(animal_id: int):
    query = text("""
        UPDATE animals
        SET status = 'INACTIVE'
        WHERE id = :animal_id
          AND status = 'ACTIVE'
    """)

    try:
        with engine.begin() as connection:
            result = connection.execute(
                query,
                {"animal_id": animal_id}
            )

            if result.rowcount == 0:
                existing = connection.execute(
                    text("""
                        SELECT id, status
                        FROM animals
                        WHERE id = :animal_id
                    """),
                    {"animal_id": animal_id}
                ).mappings().first()

                if existing is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Animal not found"
                    )

                return {
                    "message": "Animal is already inactive or removed",
                    "animal_id": animal_id,
                    "status": existing["status"]
                }

            animal = connection.execute(
                text("""
                    SELECT *
                    FROM animals
                    WHERE id = :animal_id
                """),
                {"animal_id": animal_id}
            ).mappings().one()

            return {
                "message": "Animal deactivated successfully",
                "animal": dict(animal)
            }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to deactivate animal"
        )
