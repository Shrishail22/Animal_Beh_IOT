import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from app.database import engine

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(creds: LoginRequest):
    # Support default demo admin credentials or users table
    username = creds.username.strip()
    password = creds.password.strip()

    if (username == "admin" and password == "demo123") or (username == "admin@animaliot.org" and password == "demo123"):
        return {
            "token": f"jwt-token-{int(time.time())}",
            "user": {
                "id": 1,
                "username": "admin",
                "name": "Administrator",
                "email": "admin@animaliot.org",
                "role": "ADMIN"
            }
        }

    try:
        with engine.connect() as conn:
            user = conn.execute(
                text("SELECT id, name, email, password_hash, role FROM users WHERE email = :email OR name = :name"),
                {"email": username, "name": username}
            ).mappings().first()

            if user and user["password_hash"] == password:
                return {
                    "token": f"jwt-token-{int(time.time())}",
                    "user": {
                        "id": user["id"],
                        "username": user["name"].lower().replace(" ", ""),
                        "name": user["name"],
                        "email": user["email"],
                        "role": user["role"]
                    }
                }
    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Invalid username or password. Use admin / demo123")

@router.post("/logout")
def logout():
    return {"success": True, "message": "Successfully logged out"}

@router.get("/me")
def get_current_user():
    return {
        "id": 1,
        "username": "admin",
        "name": "Administrator",
        "email": "admin@animaliot.org",
        "role": "ADMIN"
    }
