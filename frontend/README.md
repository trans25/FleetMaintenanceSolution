# Fleet Maintenance — Frontend

A Microsoft/Fluent UI–styled React (Vite + TypeScript) single-page app for the
Fleet Maintenance platform. It talks to the backend through the YARP gateway.

## Screens

- **Auth**: Login, Register, Forgot password, Reset password, Change password (Account)
- **Dashboard**: KPI tiles (fleets, vehicles, open faults, active job cards)
- **Fleets**: list + create
- **Vehicles**: list + add (with status, mileage, VIN)
- **Faults**: report faults and convert a fault into a job card
- **Job Cards**: workshop lifecycle (start → complete → cancel) with costs
- **Reports**: fleet maintenance cost rollup with per-vehicle breakdown

## Wiring

Requests go through the Vite dev proxy to the gateway (`VITE_GATEWAY_URL`,
default `http://localhost:5000`):

| Prefix      | Service      |
| ----------- | ------------ |
| `/auth`     | Auth.API     |
| `/fleet`    | Fleet.API    |
| `/workshop` | Workshop.API |

JWT access + refresh tokens are stored in `localStorage`; a response interceptor
automatically refreshes on `401` and retries the request.

## Getting started

```bash
cd frontend
copy .env.example .env   # (Windows) or: cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Make sure the backend gateway and APIs are running (gateway on port 5000).

## Build

```bash
npm run build
npm run preview
```
