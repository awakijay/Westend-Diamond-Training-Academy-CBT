# Deployment Guide

This project uses:

- a Vite frontend
- an Express backend under `backend/`

For production, deploy them separately.

## 1. Deploy the backend

Deploy `backend/` to Render.

Suggested settings:

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`

If you keep the current file-based store:

- On Render, attach a persistent disk and mount it at `/var/data`

Set these backend environment variables:

```env
PORT=10000
NODE_ENV=production
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
ADMIN_SEED_USERNAME=admin
ADMIN_SEED_PASSWORD=change-this-password
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:5173
DATA_DIR=/var/data
UPLOADS_DIR=/var/data/uploads
```

Notes:

- `CORS_ORIGIN` now accepts a comma-separated list of allowed frontend origins.
- This backend currently stores data and uploads on the local filesystem, so production persistence depends on Render persistent disks.
- Vercel is not a good fit for this backend in its current form because serverless functions do not provide reliable persistent local storage.

After deployment, confirm the backend is live by opening:

```text
https://your-backend-domain/api/health
```

## 2. Deploy the frontend on Vercel

In Vercel, set this environment variable for the frontend:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
```

Then redeploy the Vercel project.

## 3. What to verify after deployment

Check these flows:

1. `POST /api/admin/auth/login` works from the Vercel site.
2. Admin pages load after login.
3. `GET /api/admin/auth/me` succeeds with the stored bearer token.
4. Candidate flows can start and complete a session.

## 4. If auth still fails

Open your browser dev tools and check:

- `Network`: whether requests are going to `localhost:4000` instead of your backend domain
- `Console`: whether Vite env variables are missing
- failed request status:
  - `404` usually means wrong backend URL
  - `401` usually means bad credentials or missing token
  - `403` or a CORS error usually means `CORS_ORIGIN` is not set correctly
