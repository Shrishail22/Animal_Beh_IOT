# 🐾 Animal Behavior IoT Monitoring & Analysis System

An end-to-end full-stack IoT solution for monitoring animal behavior, vital signs, telemetry, and automated behavioral predictions with interactive dashboards, device management, and real-time alert triage.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, Recharts, React Hot Toast
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- **Database**: 
  - **SQLite** (Auto-configured with automatic seeding for out-of-the-box local running)
  - **MySQL** (Supported via `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `backend/.env`)
- **IoT Simulation**: Python synthetic sensor simulation script (`backend/scripts/simulate_sensors.py`)

---

## 📁 Repository Structure

```
Animal_Beh_IOT/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint & middleware
│   │   ├── database.py                 # SQLAlchemy engine with SQLite/MySQL fallback & auto-seeding
│   │   └── routers/
│   │       ├── activity_sessions.py    # Activity session endpoints
│   │       ├── alerts.py               # Alert listing, acknowledgment, and resolution
│   │       ├── animals.py              # Animal CRUD & status management
│   │       ├── auth.py                 # Authentication (login/logout/me)
│   │       ├── dashboard.py            # Aggregated statistics & live telemetry
│   │       ├── devices.py              # IoT device registration, assignment, and status
│   │       ├── predictions.py          # Behavioral classification rules & alerts
│   │       ├── reports.py              # Summary metrics, trends, and table records
│   │       └── sensor_readings.py      # Sensor ingestion & history
│   ├── scripts/
│   │   └── simulate_sensors.py         # Synthetic telemetry generator
│   ├── Dump20261008.sql                # MySQL initial schema dump
│   ├── animaldb.sqlite                 # Pre-seeded database for zero-config startup
│   └── requirements.txt                # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable UI widgets (cards, tables, badges, charts)
│   │   ├── pages/                      # Dashboard, Animals, Devices, LiveMonitoring, Alerts, Reports, Login
│   │   ├── services/                   # Centralized API layer with normalization & mock toggle
│   │   └── mock/                       # Demo mock datasets
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Run

Navigate to the `backend/` directory:

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

*Note: The backend automatically boots with a pre-seeded SQLite database if MySQL is not configured, meaning it works immediately with zero configuration.*

### 2. Frontend Setup & Run

Open a new terminal and navigate to `frontend/`:

```bash
cd frontend

# Install packages
npm install

# Start the Vite development server
npm run dev
```

The app will be accessible at: `http://localhost:5173`

---

## 🔑 Login Credentials

- **Username / Email**: `admin` or `admin@animaliot.org`
- **Password**: `demo123`

---

## ✨ Features & Functionality

1. **Dashboard**: High-level telemetry, active animals, online IoT devices, behavior breakdown pie chart, recent telemetry, and critical alert feeds.
2. **Animal Management**: Register new livestock/pets, edit profiles, view medical & physical stats, and assign devices.
3. **IoT Device Management**: Register devices, assign/unassign collars to animals, monitor battery levels, and toggle maintenance modes.
4. **Live Monitoring**: Real-time sensor charts (temperature, activity duration, movement, heart rate) updated from incoming readings.
5. **Behavior Analysis**: Rule-based prediction engine classifying behavior into `NORMAL`, `LOW_ACTIVITY`, `HIGH_ACTIVITY`, and `ABNORMAL` with confidence scores.
6. **Alerts & Triage**: Automatic alert creation on abnormal sensor patterns with one-click **Acknowledge** and **Resolve** workflows.
7. **Reports & Analytics**: Historical data filtering by animal, trend charts, and one-click CSV export.

---

## 🧪 Simulating Live IoT Sensor Data

To simulate telemetry data streaming into the system from an IoT device:

```bash
cd backend
python scripts/simulate_sensors.py --device-id 1 --interval 3.0 --count 20
```
