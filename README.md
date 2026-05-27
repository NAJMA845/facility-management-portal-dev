# Facility Portal (Backend + Frontend)

This repository contains a simple facility management frontend and an Express backend with JWT auth and a JSON-backed demo database (lowdb).

## Backend (API)

Location: `backend/`

Requirements: Node.js (v16+ recommended)

1. Install dependencies

```bash
cd backend
npm install
```

2. Environment

Create a `.env` file in `backend/` (a sample `.env` is already included) and set:

```
PORT=5000
JWT_SECRET=your_secret_here

# Optional: contact confirmation email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
CONTACT_FROM_EMAIL=no-reply@facilitypro.com
CONTACT_NOTIFICATION_EMAIL=support@facilitypro.com
```

3. Run the server

```bash
node server.js
```

The server serves the frontend static files and exposes API endpoints under `/api`.

4. Quick API examples

- Health
```bash
curl http://localhost:5000/api/health
```

- Register
```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","password":"pass"}'
```

- Login
```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"pass"}'
```

- Get work orders (protected)
```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/workorders
```

5. Seed data

On first run the backend seeds sample users, assets, work orders, and tenant requests into a JSON file at `backend/data/db.json`.

## Frontend

Location: `frontend/` — static files are served by the backend. The client uses `frontend/src/js/api.js` which exposes `window.api` helpers:

- `window.api.login(email, password)`
- `window.api.register(name,email,password)`
- `window.api.getWorkOrders()`
- `window.api.getAssets()`
- `window.api.getTenants()`
- `window.api.getSummary()`

These helpers automatically store the JWT in `localStorage` and include it in protected requests.

## Notes

- The project uses `lowdb` (JSON) for simplicity so it runs without native build tools.
- For production you should replace the JSON DB with a proper database and secure the `JWT_SECRET`.
- `POST /api/contacts` now performs strict server-side validation (name/email/phone/subject/message) and can send confirmation emails when SMTP is configured.
# Facility Portal

A Facility Management Portal UI and backend scaffold with consistent dashboard styling across roles.

## Structure

- `frontend/public/index.html` — login page and entry point.
- `frontend/src/pages/` — dashboard pages for super admin, admin, manager, technician, work orders, assets, tenants, user management, revenue.
- `frontend/src/css/style.css` — shared page styling.
- `frontend/src/js/` — JavaScript for page interactions and sample API data.
- `backend/server.js` — Express server with API stub and static file serving.
- `database/schema.sql` — SQL schema for users, work orders, assets, and tenants.

## Run locally

1. Install backend dependencies:

```powershell
cd backend
npm install
```

2. Start the backend server:

```powershell
npm start
```

3. Open the app in your browser:

- `http://localhost:5000/public/index.html`
- then sign in from `http://localhost:5000/public/login.html` to reach the role-based dashboards

## How to run (backend + frontend)

1. Install backend dependencies and start in development mode (auto-restarts):

```powershell
cd backend
npm install
npm run dev
```

2. Production-like start (no watcher):

```powershell
cd backend
npm install
npm start
```

3. The frontend is served by the backend static server. Open the public landing page in your browser:

```
http://localhost:5000/public/index.html
```

4. Environment (.env) example for backend (create `backend/.env`):

```
PORT=5000
JWT_SECRET=your_jwt_secret_here
# Optional SMTP for contact confirmations
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
CONTACT_FROM_EMAIL=no-reply@facilitypro.com
CONTACT_NOTIFICATION_EMAIL=support@facilitypro.com
```

## Seeded credentials (for testing)

- **Super Admin:** superadmin@example.com / superpass
- **Admin:** admin@example.com / adminpass
- **Manager:** manager@example.com / managerpass
- **Technician 1:** tech1@example.com / techpass1
- **Technician 2:** tech2@example.com / techpass2
- **Technician 3:** tech3@example.com / techpass3
- **Test user:** testuser@example.com / testpass

## Role Permissions

**Technician**

- Can view only work orders assigned to them.
- Can update work order status, remarks, and completion details.
- Cannot create, edit, or delete assets/machines.
- Cannot create or delete work orders.
- Cannot edit unassigned work orders.

**Manager**

- Can view and manage most work orders.
- Can assign technicians to work orders.
- Can update work order details and priorities.
- Can view assets/machines, depending on business rules.
- Cannot delete critical assets or system settings.

**Admin / Super Admin**

- Full access to assets/machines.
- Can create, edit, and delete work orders.
- Can create, edit, and delete assets/machines.
- Can manage users and roles.
- Super Admin may have additional system-level permissions.

## Smoke test report

A recent smoke test run is saved at: [backend/test_reports/smoke_test_report.json](backend/test_reports/smoke_test_report.json)

Available dashboards:

- `http://localhost:5000/src/pages/super-admin.html`
- `http://localhost:5000/src/pages/admin-dashboard.html`
- `http://localhost:5000/src/pages/manager-dashboard.html`
- `http://localhost:5000/src/pages/technician-dashboard.html`

## Notes

The frontend uses a consistent blue/grey dashboard theme matching the wireframe style.


Credentials (seeded for testing)

Admin: email: admin@example.com — password: adminpass
Manager: email: manager@example.com — password: managerpass
Technician 1: email: tech1@example.com — password: techpass1
Technician 2: email: tech2@example.com — password: techpass2
Technician 3: email: tech3@example.com — password: techpass3
Test user: email: testuser@example.com — password: testpass
superadmin@example.com / superpass.