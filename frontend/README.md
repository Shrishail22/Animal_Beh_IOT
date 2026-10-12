# IoT-Based Animal Behavioural Monitoring System — Frontend

A modern, responsive React web application for monitoring livestock and animal behavior using IoT sensors and Machine Learning models. Built exclusively for frontend operations, ready for plug-and-play integration with the companion Python FastAPI backend.

---

## 🚀 Key Highlights & Architectural Separation

- **Frontend-Only Architecture**: Implements clean separation of concerns. Does not attempt to run a backend or direct database connections.
- **Provisional Service Layer**: All data operations (animals, sensor feeds, ML predictions, alerts, reports, devices) pass through centralized service functions in `src/services/`.
- **Dual Mode (Demo / Real API)**:
  - When `VITE_USE_MOCK_DATA=true`, all eight modules function with full interactive demo data (add/edit, filtering, search, alert acknowledgment, device assignment, CSV export, charts).
  - When `VITE_USE_MOCK_DATA=false`, services make live HTTP requests through the centralized Axios client (`src/services/api.js`) targeting the FastAPI backend.
- **Strict Disclaimers**: ML behavioral categories and predicted patterns are highlighted as example classes and clearly labeled with veterinary non-diagnostic disclaimers.

---

## 🛠 Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with tailored dark navy/teal color tokens
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Charts**: [Recharts v2](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Toasts**: [React Hot Toast](https://react-hot-toast.com/)

---

## 📂 Project Folder Structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ConfirmDialog.jsx      # Modal for destructive confirmation
│   │   ├── DataTable.jsx          # Sortable, searchable data table
│   │   ├── LoadingState.jsx       # Unified loading spinner, error, and empty state
│   │   ├── Navbar.jsx             # Top bar with demo pill, alerts bell, profile
│   │   ├── SensorChart.jsx        # Reusable Recharts line chart wrapper
│   │   ├── Sidebar.jsx            # Dark navy persistent collapsible sidebar
│   │   ├── StatCard.jsx           # Reusable metric card with color schemes
│   │   └── StatusBadge.jsx        # Badges for online, offline, critical, etc.
│   ├── layouts/
│   │   └── DashboardLayout.jsx    # Protected layout wrapping Sidebar + Navbar + Outlet
│   ├── mock/
│   │   └── mockData.js            # Comprehensive demo data for all 8 modules
│   ├── pages/
│   │   ├── Alerts.jsx             # Module 6: Alerts & Notifications with Acknowledge
│   │   ├── AnimalDetails.jsx      # Module 3 (Sub): Detailed animal profile & historical log
│   │   ├── Animals.jsx            # Module 3: Animal Management & Add/Edit forms
│   │   ├── BehaviorAnalysis.jsx   # Module 5: ML Behavioral Analysis & confidence
│   │   ├── Dashboard.jsx          # Module 2: Main Overview Dashboard
│   │   ├── Devices.jsx            # Module 8: IoT Device Management & pairing
│   │   ├── LiveMonitoring.jsx     # Module 4: Live Sensor Monitoring & auto-refresh
│   │   ├── Login.jsx              # Module 1: Auth screen with demo filler & validation
│   │   └── Reports.jsx            # Module 7: Reports & Analytics, CSV export, Print layout
│   ├── services/
│   │   ├── alertService.js        # Alert endpoints & acknowledge logic
│   │   ├── animalService.js       # Animal CRUD operations
│   │   ├── api.js                 # Central Axios client with interceptors
│   │   ├── deviceService.js       # IoT device CRUD & assign/unassign
│   │   ├── predictionService.js   # ML model inference endpoints
│   │   ├── reportService.js       # Summary KPIs, trend aggregations & CSV export
│   │   └── sensorService.js       # Sensor telemetry readings & latest snapshot
│   ├── App.css
│   ├── App.jsx                    # Routing configuration and Toaster provider
│   ├── index.css                  # Tailwind styles and custom design tokens
│   └── main.jsx
├── .env                           # Local environment configuration
├── .env.example                   # Environment variable template
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already created with defaults):
```bash
cp .env.example .env
```

Contents of `.env`:
```env
# API Base URL for future FastAPI backend
VITE_API_BASE_URL=http://localhost:8000/api

# Enable mock demo mode (true = mock data, false = call FastAPI)
VITE_USE_MOCK_DATA=true
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Demo Login Credentials
- **Username**: `admin`
- **Password**: `demo123`
*(Or click the "Fill Demo Credentials" button on the login screen).*

---

## 📑 Implemented Modules

| Module | Route | Functionality |
|---|---|---|
| **1. Login Page** | `/login` | Modern login screen, form validation, show/hide password, remember-me toggle, one-click demo credentials filler. |
| **2. Main Dashboard** | `/` | Animals monitored KPI, abnormal alert count, sensor trends over 24h, behavior distribution pie chart, device online/offline counters, species selector. |
| **3. Animal Management** | `/animals`, `/animals/:id` | Full animal listing table, search by ID or name, species and status filtering, modal form to add/edit with validation, individual animal detail page with telemetry and behavior logs. |
| **4. Live Sensor Monitoring** | `/monitoring` | Animal selector, temperature, activity level, and heart rate cards, historical line charts, device battery & signal status, auto-refresh interval simulator, manual refresh button. |
| **5. Behavioral Analysis (ML)** | `/behavior` | Model behavior distributions, confidence levels, classification history vs sensor snapshot, abnormal pattern flags, detailed breakdown modal, veterinary non-diagnostic notice. |
| **6. Alerts & Notifications** | `/alerts` | Severity badges (critical, warning, info), filter by type/status/severity, search alerts, one-click "Mark as Acknowledged" with persistent status, alert detail modal. |
| **7. Reports & Analytics** | `/reports` | Daily, weekly, monthly aggregation toggles, multivariate trend charts, behavioral allocation ratio, animal-specific telemetry, browser CSV download, print-friendly view (`window.print()`). |
| **8. Device Management** | `/devices` | IoT device inventory, status indicators (online, offline, warning), register new device modal, edit device form, assign to animal modal, unassign confirmation dialog. |

---

## 🔌 Provisional API Endpoint Contracts for Backend Developer

The companion backend developer (working on Python FastAPI + MySQL) should implement or confirm the following endpoints:

### 1. Animals (`/api/animals`)
| Method | Endpoint | Description | Payload / Response |
|---|---|---|---|
| `GET` | `/animals` | List all animals | Returns `Animal[]` |
| `GET` | `/animals/{id}` | Get single animal | Returns `Animal` |
| `POST` | `/animals` | Create animal | Body: `{ name, species, breed, age, sex, weight, identificationNumber, location, deviceId, notes }` |
| `PUT` | `/animals/{id}` | Update animal | Body: Partial `Animal` |
| `DELETE`| `/animals/{id}` | Delete animal | Returns `{ success: true }` |

### 2. Sensor Telemetry (`/api/sensors`)
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/sensors/readings` | `animalId`, `from`, `to` | List historical sensor readings |
| `GET` | `/sensors/latest` | `animalId` | Get most recent telemetry reading |

### 3. ML Behavioral Predictions (`/api/predictions`)
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/predictions` | `animalId`, `from`, `to` | List historical ML prediction classifications |
| `GET` | `/predictions/latest` | `animalId` | Latest behavioral prediction for animal |

### 4. Alerts (`/api/alerts`)
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `GET` | `/alerts` | List all system alerts | Returns `Alert[]` |
| `GET` | `/alerts/{id}` | Alert details | Returns `Alert` |
| `PUT` | `/alerts/{id}/acknowledge` | Mark acknowledged | Body: `{ acknowledgedBy: string }` |

### 5. Reports (`/api/reports`)
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/reports/summary` | `period` (`daily`, `weekly`, `monthly`) | Aggregated metrics |
| `GET` | `/reports/trends` | `period` | Trend series for line graphs |
| `GET` | `/reports/export` | `format=csv`, `from`, `to` | Direct file stream (optional) |

### 6. IoT Devices (`/api/devices`)
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `GET` | `/devices` | List registered IoT hardware | Returns `Device[]` |
| `GET` | `/devices/{id}` | Device details | Returns `Device` |
| `POST` | `/devices` | Register new device | Body: `{ name, type, sensorType, firmwareVersion }` |
| `PUT` | `/devices/{id}` | Update device | Body: Partial `Device` |
| `PUT` | `/devices/{id}/assign` | Pair with animal | Body: `{ animalId: string }` |
| `PUT` | `/devices/{id}/unassign` | Unpair from animal | Empty body |
| `DELETE`| `/devices/{id}` | Remove device | Returns `{ success: true }` |

---

## ⚠️ Notes & Remaining Limitations

1. **Frontend Only**: This repository does not contain a FastAPI server or MySQL database scripts. Backend integration will occur once the companion backend is stood up.
2. **Simulation**: In demo mode, live sensor updates, ML predictions, and battery readings are generated algorithmically for UI/UX demonstration purposes.
3. **No Direct Database Access**: The frontend adheres strictly to security best practices and will only interface with MySQL via the FastAPI HTTP REST API.
