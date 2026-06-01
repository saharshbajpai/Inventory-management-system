# Render setup guide (free tier)

Your repo: `https://github.com/saharshbajpai/Inventory-management-system`

Render dashboard: [https://dashboard.render.com](https://dashboard.render.com)

> I cannot log into your Render account for you. Follow these steps in your browser.

---

## Step 0: Push latest code

Make sure GitHub has the latest `render.yaml` (includes `plan: free`):

```bash
git add render.yaml backend/app/main.py backend/app/core/database.py
git commit -m "Configure Render free tier blueprint"
git push origin main
```

---

## Step 1: Connect GitHub to Render

1. Open [Render Dashboard](https://dashboard.render.com).
2. Go to **Account Settings** → **Git Providers** (or **Integrations**).
3. Connect **GitHub** and allow access to `saharshbajpai/Inventory-management-system`.
4. Use **Hobby** workspace (free). Do **not** add a payment method unless you choose a paid plan.

---

## Step 2: Deploy with Blueprint (recommended)

1. **Blueprints** → **New Blueprint Instance**.
2. Select repository: **Inventory-management-system**.
3. Render reads [`render.yaml`](render.yaml) and shows:
   - **inventory-db** — PostgreSQL (Free)
   - **inventory-backend** — Web Service (Free)
4. When asked for **environment variables**:
   | Key | Value (for now) |
   |-----|-----------------|
   | `CORS_ORIGIN` | `http://localhost:3000` |
   | `DATABASE_URL` | Auto-filled from database (do not change) |
5. Click **Apply** / **Create**.
6. Wait until both services show **Live** (5–15 minutes).

### Your backend URL

After deploy, open the **inventory-backend** service. Copy the URL, e.g.:

`https://inventory-backend-xxxx.onrender.com`

Test:

- Health: `https://YOUR-URL.onrender.com/api/health`
- API docs: `https://YOUR-URL.onrender.com/docs`

---

## Step 2B: Manual setup (if Blueprint fails)

### A. PostgreSQL (Free)

1. **New +** → **PostgreSQL**.
2. Name: `inventory-db`.
3. **Instance Type:** **Free**.
4. Create → copy **Internal Database URL**.

### B. Web Service (Free)

1. **New +** → **Web Service** → connect GitHub repo.
2. Settings:

| Field | Value |
|-------|--------|
| Name | `inventory-backend` |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Instance Type | **Free** |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |

3. **Environment variables:**

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Internal Database URL from step A |
| `CORS_ORIGIN` | `http://localhost:3000` |

4. **Create Web Service**.

---

## Step 3: Environment variables reference

### Backend on Render (required)

| Variable | Where to get it | Example |
|----------|-----------------|--------|
| `DATABASE_URL` | Postgres → **Connections** → **Internal Database URL** | `postgresql://user:pass@dpg-xxx/inventory_db` |
| `CORS_ORIGIN` | Your Vercel URL after frontend deploy | `https://your-app.vercel.app` |

Optional: multiple origins (comma-separated):

```text
https://your-app.vercel.app,http://localhost:3000
```

### Not needed on Render

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `VITE_API_BASE_URL`, `BACKEND_PORT`

---

## Step 4: Deploy frontend on Vercel (free)

1. [vercel.com](https://vercel.com) → **Add Project** → import same GitHub repo.
2. **Root Directory:** `frontend`
3. **Environment variable:**

| Key | Value |
|-----|--------|
| `VITE_API_BASE_URL` | `https://inventory-backend-xxxx.onrender.com` (your Render URL, no `/` at end) |

4. Deploy → copy Vercel URL, e.g. `https://inventory-management-system.vercel.app`.

---

## Step 5: Update CORS on Render

1. Render → **inventory-backend** → **Environment**.
2. Set `CORS_ORIGIN` to your **Vercel URL** (exact, with `https://`).
3. **Save Changes** (triggers redeploy).

---

## Step 6: Verify live app

From your Vercel site:

- [ ] Dashboard loads
- [ ] Create product, customer (with phone), order
- [ ] Cancel order restores stock
- [ ] No CORS errors in browser DevTools (F12 → Console)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build failed | Check **Logs** tab; ensure Root Directory is `backend` |
| Health check fails | Confirm `DATABASE_URL` is **Internal** URL; redeploy |
| Database connection error | Redeploy after DB is Live; free DB can take a few minutes |
| CORS error in browser | `CORS_ORIGIN` must match Vercel URL exactly |
| 502 / slow first load | Free tier spins down after 15 min idle; wait ~1 min |
| Payment screen | Select **Free** / **Hobby** only; skip card if offered |

---

## Submission checklist

| Item | Your link |
|------|-----------|
| GitHub | `https://github.com/saharshbajpai/Inventory-management-system` |
| Live API | `https://YOUR-SERVICE.onrender.com` |
| Live frontend | `https://YOUR-APP.vercel.app` |
| Docker Hub | Push image per [README.md](README.md) |

Update the table in [README.md](README.md) with your real URLs.
