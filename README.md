# AeroLux Airlines — Full-Stack Airline Management Platform

A realistic, functioning full-stack airline management platform inspired by the booking experience and operational workflows of luxury international carriers. Built using a **Hybrid Architecture (MVC + Transactional Outbox Event-Driven Architecture)** with Python, FastAPI, SQLAlchemy ORM, Alembic migrations, PostgreSQL/SQLite, React 18, TypeScript, and Tailwind CSS.

---

## Table of Contents
1. [PART 1: HOW TO RUN THIS PROJECT](#part-1-how-to-run-this-project)
   - [Prerequisites](#1-prerequisites)
   - [Step-by-Step Windows PowerShell Guide](#2-step-by-step-windows-powershell-guide)
   - [Step-by-Step Linux / macOS Guide](#3-step-by-step-linux--macos-guide)
   - [Running Automated Tests](#4-running-automated-tests)
   - [Pre-Configured Demo Accounts & Credentials](#5-pre-configured-demo-accounts--credentials)
2. [PART 2: SYSTEM ARCHITECTURE & WORKING EXPLANATION](#part-2-system-architecture--working-explanation)
   - [Hybrid Modular Monolith: MVC + EDA](#1-hybrid-modular-monolith-mvc--eda)
   - [End-to-End Booking Lifecycle & Concurrency Locking](#2-end-to-end-booking-lifecycle--concurrency-locking)
   - [The Transactional Outbox Pattern](#3-the-transactional-outbox-pattern)
   - [Flight Lifecycle State Machine & Event Dispatch](#4-flight-lifecycle-state-machine--event-dispatch)
   - [Online Check-In & Simulated Boarding Pass Engine](#5-online-check-in--simulated-boarding-pass-engine)
3. [PART 3: COMPLETE CODEBASE EXPLANATION](#part-3-complete-codebase-explanation)
   - [Backend Directory & Module Breakdown](#1-backend-directory--module-breakdown)
   - [Database Entities & Relationships](#2-database-entities--relationships)
   - [Business Logic Services](#3-business-logic-services)
   - [EDA Handlers & Outbox Dispatcher](#4-eda-handlers--outbox-dispatcher)
   - [API Controllers / Routers](#5-api-controllers--routers)
   - [Frontend Architecture & Component Breakdown](#6-frontend-architecture--component-breakdown)
4. [PART 4: FEATURE CHECKLIST & DEMO LIMITATIONS](#part-4-feature-checklist--demo-limitations)
5. [PART 5: TROUBLESHOOTING GUIDE](#part-5-troubleshooting-guide)

---

# PART 1: HOW TO RUN THIS PROJECT

### 1. Prerequisites
Before running, verify that your computer has:
- **Python**: Version `3.10` or higher (`python --version`)
- **Node.js**: Version `18.0.0` or higher (`node --version`)
- **npm**: Version `9.0.0` or higher (`npm --version`)
- **Git** (optional, for cloning)

> **Note on Database**: By default, the application runs on **SQLite** out-of-the-box (`sqlite:///./aerolux.db`), requiring **zero database installation or external configuration**. If you prefer PostgreSQL, simply set `DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/aerolux_db` in `backend/.env`. The models, transactions, migrations, and concurrency logic support both seamlessly.

---

### 2. Step-by-Step Windows PowerShell Guide

Open **Windows PowerShell** and execute the following commands:

#### Step 2.1: Navigate into Project Directory
```powershell
cd c:\Users\Administrator\Desktop\Airline_Management_System
```

#### Step 2.2: Setup Python Virtual Environment & Install Backend Dependencies
```powershell
# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt
```

#### Step 2.3: Seed the Database with Realistic Flight & Fleet Data
This seeds 12 international airports (DXB, LHR, JFK, SIN, HND, CDG, etc.), 4 luxury widebody aircraft (Boeing 777-300ER, Airbus A380-800, A350-900), complete 2D cabin seat maps, 40+ scheduled flights, demo accounts, and confirmed bookings:
```powershell
python backend\scripts\seed_data.py
```

#### Step 2.4: Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

#### Step 2.5: Start the Full-Stack Application

You need two terminal windows (one for the Backend API, one for the React Frontend):

**Terminal 1 (Start Backend Server):**
```powershell
cd c:\Users\Administrator\Desktop\Airline_Management_System
.\venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will be active at:* `http://127.0.0.1:8000`  
*Interactive Swagger OpenAPI documentation:* `http://127.0.0.1:8000/docs`

**Terminal 2 (Start React Frontend):**
```powershell
cd c:\Users\Administrator\Desktop\Airline_Management_System\frontend
npm run dev
```
*Frontend will be active at:* `http://localhost:5173`

Open your web browser and navigate to **`http://localhost:5173`**.

---

### 3. Step-by-Step Linux / macOS Guide

```bash
cd Airline_Management_System

# Setup virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Seed database
python3 backend/scripts/seed_data.py

# Install frontend packages
cd frontend
npm install
cd ..

# Run backend (in terminal 1)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Run frontend (in terminal 2)
cd frontend
npm run dev
```

---

### 4. Running Automated Tests

The backend test suite covers authentication, role-based access control (RBAC), flight search, **concurrency-safe double-booking prevention**, online check-in, and transactional outbox event dispatch.

Run the test suite in PowerShell:
```powershell
.\venv\Scripts\pytest.exe backend\tests\ -v
```

**Expected Result:**
```text
====================== 17 passed in 25.73s ======================
```
All 17 tests execute against an isolated in-memory test database and pass with a 100% success rate.

---

### 5. Pre-Configured Demo Accounts & Credentials

The database comes pre-seeded with three roles. The frontend navigation bar includes a **1-Click Demo Switcher** dropdown in the upper-right corner for instant testing:

| Role | Email Address | Password | Permissions & Available Portals |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@aerolux.com` | `Admin@123456` | Full system access: flight scheduling, operational status changes, manifest inspection, system audit trail, revenue analytics. |
| **Operations Staff** | `staff@aerolux.com` | `Staff@123456` | Operations Control Center (OCC): gate assignment, delay broadcasts, passenger manifests, live flight tracking. |
| **Customer** | `customer@aerolux.com` | `Customer@123456` | Customer portal: flight booking, seat selection, online check-in, trip cancellation, notification history. |

#### Pre-Seeded Booking References (PNRs)
You can immediately look up, manage, or check in with these pre-seeded references without creating a new booking:
- **Reference**: `ALX701` &bull; **Surname**: `Sterling` (Flight `ALX-101`: DXB &rarr; LHR, First Class Seat `1A`)
- **Reference**: `ALX702` &bull; **Surname**: `Connor` (Flight `ALX-201`: DXB &rarr; JFK, Business Class)
- **Reference**: `ALX703` &bull; **Surname**: `Wright` (Flight `ALX-301`: DXB &rarr; SIN, Economy Class)

---

# PART 2: SYSTEM ARCHITECTURE & WORKING EXPLANATION

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite + Tailwind UI                      │
│   (Customer Booking Portal | Staff & Admin Operations Dashboard)       │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / REST API (JWT)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         FastAPI Web Layer                              │
│   Controllers (Routers): Auth, Flights, Bookings, Seats, Admin, CheckIn│
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Service Layer (MVC Core)                         │
│  - AuthService, FlightService, BookingService, SeatService             │
│  - CheckInService, PricingService, AdminService                        │
│  * Strict concurrency locks (SELECT FOR UPDATE) on seat allocations   │
│  * Server-side fare recalculation & validation                         │
└───────────────────┬───────────────────────────────────┬────────────────┘
                    │ Synchronous Transaction           │ Stage Domain Event
                    ▼                                   ▼
┌───────────────────────────────────────┐   ┌────────────────────────────┐
│      PostgreSQL / SQLite Database     │   │     Outbox Table / Queue   │
│  - Users, Roles, Airports, Routes     │   │  - id, event_type, payload │
│  - Aircraft, Seats, Flights, Schedules│   │  - status (PENDING/DONE)   │
│  - Bookings, Passengers, BoardingPass │   │  - retry_count, created_at │
│  - AuditLogs, Notifications, Outbox   │   └──────────────┬─────────────┘
└───────────────────────────────────────┘                  │
                                                           │ Async Dispatcher
                                                           ▼
                                            ┌────────────────────────────┐
                                            │  EDA Event Dispatcher &    │
                                            │       Subscribers          │
                                            │ - BookingConfirmedHandler  │
                                            │ - FlightStatusChanged      │
                                            │ - CheckInCompletedHandler  │
                                            │ - BookingCancelledHandler  │
                                            │ - AuditRecordHandler       │
                                            └────────────────────────────┘
```

### 1. Hybrid Modular Monolith: MVC + EDA

The architecture is deliberately structured as a **modular monolith** that balances immediate synchronous consistency with resilient asynchronous follow-up workflows:

1. **MVC for Synchronous Business Requests**:
   - Client requests (booking creation, flight search, seat layout, user authentication) require immediate, transactional guarantees.
   - Handled via FastAPI Routers (Controllers), SQLAlchemy Models (Data layer), and Python Service Classes (Business logic).
   - If an error occurs (such as an already-booked seat or invalid payment), the HTTP request immediately fails and rolls back the database transaction.

2. **EDA (Event-Driven Architecture) for Asynchronous Follow-Up Tasks**:
   - Secondary workflows—such as notifying passengers when a flight is delayed, generating confirmation documents, logging immutable security audits, and sending alerts—should **never** block the core HTTP response or risk failing the primary transaction.
   - When an operation commits, a domain event is staged in the database outbox.
   - The event dispatcher pulls pending events and invokes registered idempotent subscribers.

---

### 2. End-to-End Booking Lifecycle & Concurrency Locking

Preventing **double-booking** is the single most critical challenge in airline reservation systems. Here is how AeroLux guarantees booking integrity:

1. **Client Submits Reservation Request**: The passenger selects flight `ALX-101`, cabin class `FIRST`, and seat `1A`.
2. **Transactional Lock Acquired**:
   - On PostgreSQL, `booking_service.py` executes:
     ```python
     db.query(SeatAllocation).filter(
         SeatAllocation.flight_id == flight_id,
         SeatAllocation.seat_id == seat_id,
         SeatAllocation.status == "CONFIRMED"
     ).with_for_update()
     ```
   - On SQLite, table-level transactional locks prevent concurrent writes.
3. **Collision Detection**: If another passenger has confirmed seat `1A`, the transaction immediately aborts and returns an HTTP `409 Conflict` error:  
   `"Seat 1A is already reserved by another passenger. Please select another seat."`
4. **Server-Authoritative Price Calculation**:
   - The backend **never trusts** prices sent by the client frontend.
   - `pricing_service.py` recalculates the base fare multiplied by the cabin class multiplier (Economy: 1.0, Premium Economy: 1.6, Business: 3.2, First: 6.5) and fare tier (Saver: 0.9, Flex: 1.0, Flex Plus: 1.25).
   - Seat extra charges ($30-$45 for extra legroom/exit rows), ancillary baggage fees, fixed fuel surcharges ($45), and airport taxes (12%) are added.
5. **Atomic Commit**:
   - Inserts `Booking` with unique 6-character PNR (e.g., `ALX7K2`).
   - Inserts `Passenger` records.
   - Inserts `SeatAllocation` records.
   - Inserts `Payment` record with simulated transaction reference.
   - Inserts `BookingConfirmedEvent` into the `outbox_events` table.
   - The entire operation commits as a single atomic unit.

---

### 3. The Transactional Outbox Pattern

In distributed and event-driven systems, dispatching events directly to message brokers or external queues inside the HTTP request creates a **dual-write hazard** (the database might commit but the network call to the queue fails, or vice versa).

AeroLux solves this using the **Transactional Outbox Pattern**:
1. When a booking confirms, an event row is written directly to the `outbox_events` table **inside the same database transaction**:
   ```sql
   INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload_json, status)
   VALUES ('BookingConfirmed', 'Booking', '42', '{"booking_reference": "ALX7K2", ...}', 'PENDING');
   ```
2. When the transaction commits, the event is guaranteed to exist.
3. An asynchronous worker (`outbox_poller_worker` in `backend/app/main.py`) polls pending events:
   ```python
   def process_pending_outbox_events(db, limit=20):
       # Fetches PENDING events, executes subscribers, marks as PROCESSED or FAILED
   ```
4. If an event handler fails, the retry counter increments without impacting the customer's confirmed booking.

---

### 4. Flight Lifecycle State Machine & Event Dispatch

Flights transition through explicit operational states:
```
[SCHEDULED] ───► [BOARDING] ───► [DEPARTED] ───► [ARRIVED]
     │                │
     ▼                ▼
 [DELAYED] ──────► [CANCELLED]
```

When an Operations Controller updates a flight's status via the Admin Dashboard:
1. `admin_service.py` updates the flight record, gate, terminal, and delay minutes.
2. A `FlightStatusChangedEvent` is written to the outbox.
3. The event dispatcher invokes `handle_flight_status_changed_notification`:
   - It queries all passengers holding confirmed bookings on that flight.
   - Generates and delivers simulated notifications into `notification_logs`.
   - Records an immutable security entry in `audit_logs`.

---

### 5. Online Check-In & Simulated Boarding Pass Engine

Check-in is permitted starting 48 hours before scheduled departure:
1. Passenger provides booking reference (PNR) and surname.
2. Passenger acknowledges the International Dangerous Goods & Hazardous Cargo declaration.
3. `checkin_service.py` assigns the next sequential boarding number for that flight (e.g., `SEQ 0001`).
4. Generates a simulated **IATA Bar Coded Boarding Pass (BCBP)** standard string:
   ```text
   M1STERLING/LORD       EALX101 DXBLHRALX00101A0001100
   ```
5. Generates a simulated boarding pass token (`BP-ALX101-ABCD1234`).
6. Issues a luxury electronic boarding pass document complete with QR verification token, boarding gate, terminal, boarding group, and watermark:
   `"SIMULATED DOCUMENT • FOR PORTFOLIO DEMONSTRATION ONLY • NOT A VALID AIRPORT TRAVEL CREDENTIAL"`

---

# PART 3: COMPLETE CODEBASE EXPLANATION

```
Airline_Management_System/
├── backend/
│   ├── alembic/                      # Alembic database migration environment
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # App settings, secrets, and environment variables
│   │   │   ├── database.py           # SQLAlchemy engine, SessionLocal, and get_db dependency
│   │   │   ├── security.py           # Passlib bcrypt hashing, JWT creation, RBAC dependency
│   │   │   └── events.py             # Pydantic DomainEvent definitions
│   │   ├── models/                   # SQLAlchemy ORM database models
│   │   │   ├── user.py               # User, RoleEnum (CUSTOMER, STAFF, ADMIN)
│   │   │   ├── airline.py            # Airport, Route, Aircraft, Seat, CabinClassEnum
│   │   │   ├── flight.py             # Flight, FlightStatusEnum
│   │   │   ├── booking.py            # Booking, Passenger, SeatAllocation, Payment, Ancillaries
│   │   │   ├── checkin.py            # CheckIn, BoardingPass
│   │   │   └── outbox.py             # OutboxEvent, AuditLog, NotificationLog
│   │   ├── schemas/                  # Pydantic v2 validation models
│   │   │   ├── auth.py, airline.py, flight.py, booking.py, seat.py, checkin.py, admin.py, analytics.py
│   │   ├── controllers/              # FastAPI Routers (Thin request-response layer)
│   │   │   ├── auth_controller.py
│   │   │   ├── flight_controller.py
│   │   │   ├── seat_controller.py
│   │   │   ├── booking_controller.py
│   │   │   ├── checkin_controller.py
│   │   │   ├── admin_controller.py
│   │   │   └── analytics_controller.py
│   │   ├── services/                 # Authoritative business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── flight_service.py
│   │   │   ├── pricing_service.py
│   │   │   ├── seat_service.py
│   │   │   ├── booking_service.py
│   │   │   ├── checkin_service.py
│   │   │   ├── admin_service.py
│   │   │   └── analytics_service.py
│   │   ├── events/                   # Event-Driven Architecture (EDA)
│   │   │   ├── dispatcher.py         # Outbox writer and asynchronous dispatcher
│   │   │   └── handlers/
│   │   │       ├── notification_handler.py
│   │   │       └── audit_handler.py
│   │   └── main.py                   # FastAPI initialization, lifespan worker, CORS
│   ├── scripts/
│   │   └── seed_data.py              # Realistic database seeder
│   └── tests/                        # Automated Pytest suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/Navbar.tsx, Footer.tsx, StatusBadge.tsx
│   │   │   ├── flight/FlightSearchWidget.tsx, FlightCard.tsx
│   │   │   ├── seatmap/AircraftSeatMap.tsx
│   │   │   └── boarding/SimulatedBoardingPass.tsx
│   │   ├── context/AuthContext.tsx   # React Auth state with 1-click role switcher
│   │   ├── pages/
│   │   │   ├── HomePage.tsx, FlightResultsPage.tsx, BookingFlowPage.tsx
│   │   │   ├── BookingLookupPage.tsx, CheckInPage.tsx, CustomerDashboardPage.tsx
│   │   │   ├── AdminDashboardPage.tsx, LoginPage.tsx, RegisterPage.tsx
│   │   ├── services/api.ts           # Axios client with JWT interceptor
│   │   ├── types/index.ts            # TypeScript interfaces
│   │   ├── App.tsx                   # React Router definition
│   │   ├── index.css                 # Tailwind directives & luxury color scheme
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

### 1. Backend Directory & Module Breakdown

#### `backend/app/core/`
- **`config.py`**: Reads environment settings using `pydantic-settings`. Manages `DATABASE_URL`, `SECRET_KEY`, JWT expiration times, airport tax rates (12%), and fuel surcharge defaults ($45).
- **`database.py`**: Configures the SQLAlchemy `engine` and `SessionLocal`. Automatically detects SQLite vs PostgreSQL to apply safe parameters (`check_same_thread=False` for SQLite; connection pooling for Postgres). Provides the `get_db` generator dependency.
- **`security.py`**: Implements password hashing via `passlib[bcrypt]`. Generates and decodes JWT tokens via `python-jose`. Defines `get_current_user` and the `require_role(["ADMIN", "STAFF"])` dependency for role-based access control.
- **`events.py`**: Defines domain events (`BookingConfirmedEvent`, `FlightStatusChangedEvent`, `CheckInCompletedEvent`, `BookingCancelledEvent`, `AdministrativeChangeRecordedEvent`) inheriting from `DomainEvent`.

---

### 2. Database Entities & Relationships

#### `backend/app/models/`
- **`user.py` (`User`)**: Represents customer, operations staff, and administrator accounts. Columns include `email` (unique index), `hashed_password`, `full_name`, `phone`, and `role` (`RoleEnum`).
- **`airline.py`**:
  - `Airport`: Primary key is `iata_code` (e.g., `DXB`, `LHR`). Stores coordinates, timezone, city, and country.
  - `Route`: Origin airport & destination airport with distance in km and estimated duration.
  - `Aircraft`: Fleet inventory (e.g., `Boeing 777-300ER`, `Airbus A380-800`) and total seat capacity.
  - `Seat`: Configured seats per aircraft with cabin class (`FIRST`, `BUSINESS`, `PREMIUM_ECONOMY`, `ECONOMY`), row number, column letter, extra legroom flag, exit row flag, and surcharge amount.
- **`flight.py` (`Flight`)**: Represents a scheduled flight departure. Includes departure/arrival times, gate, terminal, status (`FlightStatusEnum`), delay minutes, and base prices across all four cabin classes.
- **`booking.py`**:
  - `Booking`: Primary reservation record with 6-character PNR (`booking_reference`), total fare, taxes, and status (`CONFIRMED`, `CANCELLED`, `COMPLETED`).
  - `Passenger`: Passenger travel document records (passport number, nationality, meal preferences).
  - `SeatAllocation`: Links a passenger to a specific seat on a flight.
  - `Payment`: Record of simulated credit card transactions.
- **`checkin.py`**:
  - `CheckIn`: Records passenger flight check-in timestamp and sequential sequence number.
  - `BoardingPass`: Electronic boarding pass document with `pass_token`, gate, terminal, and BCBP barcode payload.
- **`outbox.py`**:
  - `OutboxEvent`: Stores domain events waiting to be processed by the asynchronous dispatcher.
  - `AuditLog`: Immutable record of critical administrative and state mutations.
  - `NotificationLog`: Dispatched passenger emails and system alerts.

---

### 3. Business Logic Services

#### `backend/app/services/`
- **`pricing_service.py`**: Server-authoritative fare calculator. Calculates fare tier adjustments (Saver: -10%, Flex: standard, Flex Plus: +25%), seat selection fees, add-on baggage, 12% airport tax, and $45 fuel surcharge.
- **`flight_service.py`**: Queries flights matching origin, destination, date, and party size. Automatically computes available seat counts per cabin class.
- **`seat_service.py`**: Generates a 2D seat map grouped by cabin class and rows. Cross-references active seat allocations to tag each seat as available or occupied.
- **`booking_service.py`**: Concurrency-safe reservation engine. Implements row-level locking, collision detection, PNR generation, payment persistence, and transactional outbox event creation.
- **`checkin_service.py`**: Validates the check-in time window, checks dangerous goods declarations, calculates the boarding sequence number, and generates the boarding pass.
- **`admin_service.py`**: Provides flight CRUD operations, operational status changes, manifest exports, and audit retrieval.
- **`analytics_service.py`**: Calculates load factors, total revenue, passenger counts, and top route metrics directly from database records.

---

### 4. EDA Handlers & Outbox Dispatcher

#### `backend/app/events/`
- **`dispatcher.py`**:
  - `record_outbox_event(db, event)`: Writes the event record into `outbox_events` within the active transaction.
  - `process_pending_outbox_events(db)`: Polls pending events and routes them to subscribers.
- **`handlers/notification_handler.py`**:
  - Dispatches simulated booking confirmation emails with itinerary details.
  - Generates flight delay and gate change alerts for all affected passengers.
  - Generates boarding pass notifications upon check-in completion.
- **`handlers/audit_handler.py`**:
  - Records administrative actions, cancellations, and status modifications into `audit_logs`.

---

### 5. API Controllers / Routers

#### `backend/app/controllers/`
- **`auth_controller.py`**: `/api/v1/auth` (`/register`, `/login`, `/me`, `/change-password`).
- **`flight_controller.py`**: `/api/v1/flights` (`/airports`, `/search`, `/{id}`).
- **`seat_controller.py`**: `/api/v1/seats` (`/{flight_id}`).
- **`booking_controller.py`**: `/api/v1/bookings` (`/`, `/lookup`, `/my-trips`, `/{pnr}/cancel`).
- **`checkin_controller.py`**: `/api/v1/checkin` (`/`, `/boarding-pass/{pass_token}`).
- **`admin_controller.py`**: `/api/v1/admin` (`/flights`, `/flights/{id}/status`, `/flights/{id}/manifest`, `/audit-logs`, `/notifications`).
- **`analytics_controller.py`**: `/api/v1/analytics` (`/overview`).

---

### 6. Frontend Architecture & Component Breakdown

Built with React 18, TypeScript, and Tailwind CSS using a modular layout:
- **`AuthContext.tsx`**: Manages user authentication state and persists tokens in `localStorage`. Includes a **1-click demo switcher** to toggle between Customer, Operations Staff, and Admin roles.
- **`FlightSearchWidget.tsx`**: Search widget with origin/destination dropdowns, date pickers, cabin class selectors, and passenger counters.
- **`FlightCard.tsx`**: Flight card showing duration, route graphics, non-stop indicators, and an expandable 3-tier fare drawer (Saver, Flex, Flex Plus).
- **`AircraftSeatMap.tsx`**: Interactive 2D aircraft seat map with cabin separation (First Class Suites, Business Lie-Flat, Premium Economy, Economy), exit rows, extra legroom flags, and live availability.
- **`SimulatedBoardingPass.tsx`**: Printable boarding pass with simulated BCBP barcode, QR token, boarding time, gate, terminal, and disclaimer watermark.
- **`HomePage.tsx`**: Landing page featuring destination cards, fleet showcases, and flight search.
- **`BookingFlowPage.tsx`**: 5-step booking wizard (Passengers &rarr; Seats &rarr; Extras &rarr; Review & Pay &rarr; Confirmation). Includes a 1-click demo credit card autofill.
- **`BookingLookupPage.tsx`**: Search by PNR and surname to manage itineraries or process cancellations.
- **`CheckInPage.tsx`**: Check-in portal with hazardous goods safety declarations and instant boarding pass generation.
- **`CustomerDashboardPage.tsx`**: Customer portal displaying upcoming trips, past itineraries, and notification alerts.
- **`AdminDashboardPage.tsx`**: Operations hub with flight status controls, passenger manifest viewers, operational analytics charts, and audit logs.

---

# PART 4: FEATURE CHECKLIST & DEMO LIMITATIONS

| Feature | Implementation Status | Technical Details |
| :--- | :--- | :--- |
| **Flight Search & Catalog** | Fully Implemented | Direct routes across 12 international airports with date and cabin class filtering. |
| **Interactive Aircraft Seat Map** | Fully Implemented | 2D aircraft cabin grid with real-time seat availability and extra legroom fee calculation. |
| **Concurrency-Safe Seat Allocation** | Fully Implemented | Database-level row locking preventing double-booking; verified by automated tests. |
| **Authoritative Pricing Engine** | Fully Implemented | Server-side recalculation of base fares, tier multipliers, taxes, and fuel surcharges. |
| **Transactional Outbox EDA** | Fully Implemented | Outbox table and background poller routing domain events to subscribers. |
| **Flight Status State Machine** | Fully Implemented | Operations controls for Scheduled, Boarding, Departed, Delayed, Arrived, and Cancelled states. |
| **Passenger Manifests** | Fully Implemented | Live passenger manifest inspection per flight for operations staff. |
| **Simulated Payment Processing** | Simulated | Realistic validation modal with demo card pre-fill; no real credit card charges occur. |
| **Simulated Boarding Pass** | Simulated Document | Generates BCBP barcode strings and QR codes; clearly marked as a simulated demo document. |
| **Email Delivery** | Simulated | Passenger emails and operational alerts are stored and viewed in the notification log. |

---

# PART 5: TROUBLESHOOTING GUIDE

### Issue: Port 8000 or 5173 is already in use
- **Backend**: Specify a different port:
  ```powershell
  uvicorn backend.app.main:app --port 8005 --reload
  ```
  *(Update `frontend/vite.config.ts` proxy target if you change the backend port).*
- **Frontend**: Vite automatically falls back to port `5174` if `5173` is occupied.

### Issue: Database file is locked on Windows
If another process has `aerolux.db` open during a re-seed, terminate background Python processes:
```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
python backend\scripts\seed_data.py
```

### Issue: Re-seeding clean demo data
To reset the database to a fresh initial state:
```powershell
Remove-Item aerolux.db -ErrorAction SilentlyContinue
python backend\scripts\seed_data.py
```
