# Deployment Guide

Step-by-step instructions for Render (backend) and Vercel (frontend).

## Prerequisites

- GitHub repository with this code pushed
- [Render](https://render.com) account
- [Vercel](https://vercel.com) account
- [Docker Hub](https://hub.docker.com) account (for image submission)

## 1. Deploy PostgreSQL + Backend on Render

### Option A: Blueprint

1. In Render Dashboard → **Blueprints** → **New Blueprint Instance**
2. Connect your GitHub repo
3. Render reads [`render.yaml`](render.yaml) and creates the database and web service
4. Set `CORS_ORIGIN` manually after you have the Vercel URL (step 2)

### Option B: Manual

1. **New PostgreSQL** → copy **Internal Database URL** (or External for local tools)
2. **New Web Service**:
   - Repository: your repo
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/api/health`
3. Environment variables:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Postgres connection string from step 1 |
   | `CORS_ORIGIN` | `https://YOUR_APP.vercel.app` (set after frontend deploy) |

4. Deploy and note the service URL, e.g. `https://inventory-backend.onrender.com`

## 2. Deploy Frontend on Vercel

1. **Add New Project** → import GitHub repo
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite (auto-detected)
4. **Environment Variables** (Production):
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://inventory-backend.onrender.com` (your Render URL, no trailing slash) |
5. Deploy

## 3. Finalize CORS

1. Copy your Vercel URL (e.g. `https://inventory-ims.vercel.app`)
2. In Render → backend service → **Environment** → set `CORS_ORIGIN` to that URL
3. Redeploy the backend service

## 4. Smoke Test

- [ ] Dashboard loads counts
- [ ] Create product, customer (with phone), and order
- [ ] Insufficient stock shows an error
- [ ] Cancel order restores product stock
- [ ] No CORS errors in browser console

## 5. Docker Hub

```bash
cd backend
docker build -t YOUR_DOCKERHUB_USER/inventory-backend:latest .
docker login
docker push YOUR_DOCKERHUB_USER/inventory-backend:latest
```

Update submission links in [README.md](README.md).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Ensure `CORS_ORIGIN` on Render exactly matches Vercel URL (https, no trailing slash) |
| API 404 from frontend | Rebuild Vercel after setting `VITE_API_BASE_URL` |
| Database connection failed | Use Render’s internal `DATABASE_URL` on the web service |
| Cold start slow (free tier) | First request after idle may take 30–60s on Render free plan |
