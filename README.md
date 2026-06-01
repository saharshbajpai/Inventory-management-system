# Inventory & Order Management System

Full-stack application for managing products, customers, orders, and inventory. Built for the Software Engineer technical assessment.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router, Axios |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Containers | Docker, Docker Compose |
| Deployment | Render (backend + DB), Vercel (frontend) |

## Features

- **Products** — CRUD with unique SKU, non-negative stock and price
- **Customers** — CRUD with unique email and required phone
- **Orders** — Create orders with automatic stock deduction and backend-calculated totals; cancel orders with stock restoration
- **Dashboard** — Total products, customers, orders, and low-stock alerts

All REST endpoints are prefixed with `/api` (e.g. `GET /api/products`).

## Quick Start (Development)

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Start services:

   ```bash
   docker compose up --build
   ```

3. Open the app:

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API docs: http://localhost:8000/docs

## Production (Docker Compose)

```bash
cp .env.example .env
# Set CORS_ORIGIN and VITE_API_BASE_URL for your deployment URLs
docker compose -f docker-compose.prod.yml up --build -d
```

- Frontend: http://localhost (port 80)
- Backend: http://localhost:8000

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | *(set a strong value)* |
| `POSTGRES_DB` | Database name | `inventory_db` |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://user:pass@db:5432/inventory_db` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `VITE_API_BASE_URL` | Backend URL for frontend build | `http://localhost:8000` |

## Running Tests

**With Docker:**

```bash
docker compose exec backend pytest -v
```

**Locally** (requires PostgreSQL and `DATABASE_URL`):

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

## Deployment

### Backend — Render

1. Create a **PostgreSQL** database on Render and note `DATABASE_URL`.
2. Create a **Web Service** connected to this repo:
   - Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set environment variables:
   - `DATABASE_URL` — from Render Postgres
   - `CORS_ORIGIN` — your Vercel frontend URL (e.g. `https://your-app.vercel.app`)

Alternatively, use the included [`render.yaml`](render.yaml) Blueprint.

### Frontend — Vercel

1. Import the repo; set **Root Directory** to `frontend`.
2. Add build environment variable:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://inventory-backend.onrender.com`)
3. Deploy. Vercel uses [`frontend/vercel.json`](frontend/vercel.json) for SPA routing.

### Docker Hub (Backend Image)

Build and push the production backend image:

```bash
docker build -t YOUR_DOCKERHUB_USER/inventory-backend:latest ./backend
docker login
docker push YOUR_DOCKERHUB_USER/inventory-backend:latest
```

Replace `YOUR_DOCKERHUB_USER` with your Docker Hub username.

## Submission Links

Update these after deployment:

| Deliverable | URL |
|-------------|-----|
| GitHub Repository | `https://github.com/YOUR_USERNAME/YOUR_REPO` |
| Docker Hub (backend image) | `https://hub.docker.com/r/YOUR_DOCKERHUB_USER/inventory-backend` |
| Live Frontend (Vercel) | `https://YOUR_APP.vercel.app` |
| Live Backend API (Render) | `https://YOUR_API.onrender.com` |

## Project Structure

```
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic (orders)
│   └── tests/
├── frontend/          # React (Vite) application
├── docker-compose.yml       # Development
├── docker-compose.prod.yml  # Production
└── render.yaml              # Render Blueprint
```

## License

Assessment project — use as required by your submission guidelines.
