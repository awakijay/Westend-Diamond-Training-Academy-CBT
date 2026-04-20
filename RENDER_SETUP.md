# Render Setup

This backend can run on Render without Docker.

For the current file-based backend to work reliably, use:

- a `Web Service`
- the `Starter` plan or higher
- one persistent disk

Why:

- the backend stores app data in `data/store.json`
- uploaded images are written to `data/uploads`

Render free web services do not support persistent disks, and local files are lost on restart, redeploy, or spin-down.

## Files added for Render

- `render.yaml`

The backend store also supports first-boot data initialization from `backend/data` when the persistent disk is empty.

## Option 1: Deploy with `render.yaml`

Push this repo to GitHub, then in Render:

1. Click `New`.
2. Choose `Blueprint`.
3. Connect the repository.
4. Confirm the `render.yaml` settings.
5. Enter values for:
   - `ADMIN_SEED_PASSWORD`
   - `CORS_ORIGIN`

`JWT_SECRET` is generated automatically by the blueprint.

## Option 2: Create the service manually

If you prefer the dashboard setup instead of a blueprint, use these values:

- Service type: `Web Service`
- Runtime: `Node`
- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Plan: `Starter`
- Health check path: `/api/health`

Attach a persistent disk with:

- Mount path: `/var/data`
- Size: `1 GB`

## Environment variables

Set these in Render:

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

## First deploy and current data

If `backend/data` is committed to your Git repository, the backend can copy it into the persistent disk on first boot when `/var/data/store.json` does not exist yet.

That means your existing local dataset can be used as initial seed data.

If `backend/data` is not committed, the backend will still start, but it will initialize a fresh store with the seeded admin account only.

## Frontend configuration on Vercel

Set this in Vercel:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Then redeploy the frontend.

## What to test after deploy

1. Open `https://your-render-service.onrender.com/api/health`
2. Test admin login
3. Test question image uploads
4. Test candidate session start and completion

## Important note about Render free

Render's current docs say:

- free web services spin down on idle
- free web services have an ephemeral filesystem
- persistent disks are only available on paid services

So if you want the current backend unchanged with saved uploads and saved CBT data, use `Starter` or higher.
