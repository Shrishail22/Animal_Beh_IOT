import os
import sqlite3
from decimal import Decimal
from pathlib import Path
from datetime import datetime, date, timedelta

# Register adapters so SQLite natively supports binding Decimal and date/datetime objects
sqlite3.register_adapter(Decimal, float)
sqlite3.register_adapter(date, lambda d: d.isoformat())
sqlite3.register_adapter(datetime, lambda dt: dt.isoformat())

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

engine = None
DATABASE_TYPE = "sqlite"

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME", "animaldb")
db_host = os.getenv("DB_HOST", "127.0.0.1")
db_port = int(os.getenv("DB_PORT", "3306"))

if db_user and db_password:
    try:
        mysql_url = URL.create(
            drivername="mysql+pymysql",
            username=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
            database=db_name,
            query={"charset": "utf8mb4"},
        )
        test_eng = create_engine(mysql_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with test_eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_eng
        DATABASE_TYPE = "mysql"
        print("[OK] Connected to MySQL database:", db_name)
    except Exception as exc:
        print("[INFO] MySQL unavailable, falling back to SQLite:", exc)
        engine = None

if engine is None:
    sqlite_path = BACKEND_DIR / "animaldb.sqlite"
    sqlite_url = f"sqlite:///{sqlite_path.as_posix()}"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
    )
    DATABASE_TYPE = "sqlite"
    print("[OK] Using SQLite database at:", sqlite_path)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def init_db():
    """Create tables and populate initial sample data if empty."""
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS animals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_code VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                species VARCHAR(100) NOT NULL,
                breed VARCHAR(100),
                gender VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
                date_of_birth DATE,
                weight_kg DECIMAL(6,2),
                owner_name VARCHAR(150),
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_code VARCHAR(50) NOT NULL UNIQUE,
                animal_id INTEGER,
                device_type VARCHAR(100) NOT NULL DEFAULT 'ESP32',
                firmware_version VARCHAR(50),
                battery_level DECIMAL(5,2),
                status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
                last_seen DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE SET NULL
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                animal_id INTEGER NOT NULL,
                movement DECIMAL(10,4) NOT NULL DEFAULT 0.0,
                temperature DECIMAL(5,2),
                activity_duration INTEGER NOT NULL DEFAULT 0,
                rest_duration INTEGER NOT NULL DEFAULT 0,
                activity_frequency INTEGER NOT NULL DEFAULT 0,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
                FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS behavioral_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                reading_id INTEGER NOT NULL,
                predicted_behavior VARCHAR(50) NOT NULL,
                confidence DECIMAL(5,4) NOT NULL,
                risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
                model_version VARCHAR(50) NOT NULL DEFAULT 'RULE_BASELINE_v1',
                predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
                FOREIGN KEY (reading_id) REFERENCES sensor_readings(id) ON DELETE CASCADE
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                prediction_id INTEGER,
                alert_type VARCHAR(50) NOT NULL,
                severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
                message VARCHAR(500) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved_at DATETIME,
                FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
                FOREIGN KEY (prediction_id) REFERENCES behavioral_predictions(id) ON DELETE SET NULL
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS activity_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME,
                activity_type VARCHAR(50) NOT NULL,
                duration_minutes INTEGER,
                average_movement DECIMAL(10,4),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'ADMIN',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        count = conn.execute(text("SELECT COUNT(*) FROM animals")).scalar()
        if count == 0:
            print("[INFO] Seeding initial database records...")
            animals_data = [
                ("ANM-001", "Bella", "Holstein Cow", "Dairy Cattle", "FEMALE", "2021-03-15", 540.0, "Green Valley Pastures", "ACTIVE"),
                ("ANM-002", "Thunder", "Arabian Horse", "Warmblood", "MALE", "2020-07-22", 480.0, "Summit Ranch", "ACTIVE"),
                ("ANM-003", "Daisy", "Merino Sheep", "Fine Wool", "FEMALE", "2022-01-10", 68.0, "Highland Livestock", "ACTIVE"),
                ("ANM-004", "Barnaby", "Landrace Pig", "Domestic Swine", "MALE", "2022-05-18", 125.0, "Sunny Brook Farm", "ACTIVE"),
                ("ANM-005", "Chloe", "Boer Goat", "Meat Goat", "FEMALE", "2023-02-04", 52.0, "Crestview Farm", "ACTIVE"),
                ("ANM-006", "Rusty", "Jersey Cow", "Dairy Cattle", "MALE", "2019-11-30", 430.0, "Green Valley Pastures", "INACTIVE"),
            ]
            for a in animals_data:
                conn.execute(text("""
                    INSERT INTO animals (animal_code, name, species, breed, gender, date_of_birth, weight_kg, owner_name, status)
                    VALUES (:c, :n, :s, :b, :g, :d, :w, :o, :st)
                """), {"c": a[0], "n": a[1], "s": a[2], "b": a[3], "g": a[4], "d": a[5], "w": a[6], "o": a[7], "st": a[8]})

            devices_data = [
                ("DEV-001", 1, "Smart Collar Pro", "v2.1.4", 88.0, "ONLINE"),
                ("DEV-002", 2, "Equine Motion Band", "v2.0.1", 94.0, "ONLINE"),
                ("DEV-003", 3, "Livestock Ear Tag", "v1.8.0", 76.0, "ONLINE"),
                ("DEV-004", 4, "Activity Tracker X", "v2.2.0", 42.0, "MAINTENANCE"),
                ("DEV-005", 5, "BioHarness BLE", "v2.1.0", 15.0, "OFFLINE"),
            ]
            for d in devices_data:
                conn.execute(text("""
                    INSERT INTO devices (device_code, animal_id, device_type, firmware_version, battery_level, status, last_seen)
                    VALUES (:c, :aid, :t, :fw, :b, :st, :ls)
                """), {"c": d[0], "aid": d[1], "t": d[2], "fw": d[3], "b": d[4], "st": d[5], "ls": datetime.now().isoformat()})

            base_time = datetime.now() - timedelta(hours=6)
            for i in range(24):
                ts = (base_time + timedelta(minutes=i * 15)).isoformat(timespec="seconds")
                conn.execute(text("""
                    INSERT INTO sensor_readings (device_id, animal_id, movement, temperature, activity_duration, rest_duration, activity_frequency, recorded_at)
                    VALUES (1, 1, :mov, :temp, :act, :rst, :freq, :rec)
                """), {
                    "mov": round(4.5 + (i % 5) * 2.2, 2),
                    "temp": round(38.2 + (i % 3) * 0.3, 2),
                    "act": 10 + (i % 6) * 3,
                    "rst": 5 + (i % 4) * 2,
                    "freq": 12 + (i % 5) * 2,
                    "rec": ts,
                })

            conn.execute(text("""
                INSERT INTO behavioral_predictions (animal_id, reading_id, predicted_behavior, confidence, risk_level, model_version, predicted_at)
                VALUES (1, 1, 'NORMAL', 0.9400, 'LOW', 'RULE_BASELINE_v1', :ts)
            """), {"ts": datetime.now().isoformat()})
            conn.execute(text("""
                INSERT INTO behavioral_predictions (animal_id, reading_id, predicted_behavior, confidence, risk_level, model_version, predicted_at)
                VALUES (2, 2, 'HIGH_ACTIVITY', 0.8800, 'MEDIUM', 'RULE_BASELINE_v1', :ts)
            """), {"ts": (datetime.now() - timedelta(minutes=30)).isoformat()})
            conn.execute(text("""
                INSERT INTO behavioral_predictions (animal_id, reading_id, predicted_behavior, confidence, risk_level, model_version, predicted_at)
                VALUES (3, 3, 'LOW_ACTIVITY', 0.8100, 'MEDIUM', 'RULE_BASELINE_v1', :ts)
            """), {"ts": (datetime.now() - timedelta(minutes=60)).isoformat()})

            conn.execute(text("""
                INSERT INTO alerts (animal_id, prediction_id, alert_type, severity, message, status, created_at)
                VALUES (2, 2, 'HIGH_ACTIVITY', 'MEDIUM', 'Elevated exertion pattern detected for Thunder.', 'OPEN', :ts)
            """), {"ts": (datetime.now() - timedelta(minutes=25)).isoformat()})
            conn.execute(text("""
                INSERT INTO alerts (animal_id, prediction_id, alert_type, severity, message, status, created_at, resolved_at)
                VALUES (3, 3, 'LOW_ACTIVITY', 'LOW', 'Rest duration exceeded threshold for Daisy.', 'ACKNOWLEDGED', :ts, :ts2)
            """), {"ts": (datetime.now() - timedelta(hours=2)).isoformat(), "ts2": datetime.now().isoformat()})

            conn.execute(text("""
                INSERT INTO users (name, email, password_hash, role)
                VALUES ('Administrator', 'admin@animaliot.org', 'demo123', 'ADMIN')
            """))
            print("[OK] Database initialization and seeding complete.")


def test_database_connection():
    if DATABASE_TYPE == "sqlite":
        return "animaldb (SQLite)"
    with engine.connect() as connection:
        result = connection.execute(text("SELECT DATABASE()"))
        return result.scalar()
