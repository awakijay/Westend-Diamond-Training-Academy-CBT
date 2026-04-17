# Dokploy Setup

This is the cheapest open-source path I recommend for this project:

- `Dokploy` as the open-source deployment panel
- a small Linux server to run Dokploy
- the backend deployed with Docker Compose

If you have no budget, the closest practical option is:

- Oracle Cloud Always Free VM

If Oracle signup fails or capacity is unavailable, you can use any Linux VPS later with the same steps.

## Why this option

Your backend writes to local files:

- `backend/data/store.json`
- `backend/data/uploads`

That means it works better on a normal long-running server than on serverless platforms like Vercel.

## Files added for deployment

- `backend/Dockerfile`
- `backend/.dockerignore`
- `backend/docker-compose.dokploy.yml`

## 1. Create a server

Recommended minimum for Dokploy:

- Ubuntu 22.04 or 24.04
- at least 2 GB RAM
- at least 30 GB disk

If you use Oracle Cloud Free Tier, try to create an Ubuntu VM in your home region.

Open these ports in the VM firewall / security rules:

- `80`
- `443`
- `3000`

## 2. Install Dokploy

SSH into the server and run:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Then open:

```text
http://YOUR_SERVER_IP:3000
```

Create your Dokploy admin account.

## 3. Deploy this backend in Dokploy

In Dokploy:

1. Create a new project.
2. Create a new `Docker Compose` application.
3. Connect your GitHub repository.
4. Set the compose path to:

```text
backend/docker-compose.dokploy.yml
```

If Dokploy asks for the compose directory or project root for this service, use:

```text
backend
```

5. Enable auto deploy if you want redeploys on push.

## 4. Add environment variables in Dokploy

Add these variables in the Dokploy environment UI:

```env
NODE_ENV=production
PORT=4000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
ADMIN_SEED_USERNAME=admin
ADMIN_SEED_PASSWORD=change-this-password
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:5173
DATA_DIR=data
UPLOADS_DIR=data/uploads
```

Important:

- `CORS_ORIGIN` can contain multiple values separated by commas.
- `backend/docker-compose.dokploy.yml` uses `env_file: .env`, which matches how Dokploy stores UI environment variables for Docker Compose apps.

## 5. Attach a domain

In Dokploy:

1. Open the deployed compose app.
2. Go to `Domains`.
3. Add a domain.
4. Set the container port to `4000`.

If you do not own a domain yet, Dokploy can generate a free `traefik.me` domain for HTTP.

A typical backend URL will look like:

```text
https://api.yourdomain.com
```

## 6. Point Vercel frontend to the backend

In Vercel, add:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Then redeploy the frontend.

## 7. Verify everything

Check these URLs:

```text
https://api.yourdomain.com/api/health
https://api.yourdomain.com/
```

Then test admin login from the Vercel frontend.

## 8. Notes about persistence

The Dokploy compose file mounts a named Docker volume to:

```text
/app/data
```

That keeps these backend files persistent across restarts:

- `data/store.json`
- `data/uploads/*`

## 9. If deployment fails

Check:

- Dokploy deployment logs
- whether port `4000` is selected in the domain settings
- whether `CORS_ORIGIN` matches your exact Vercel URL
- whether your frontend is using the new `VITE_API_BASE_URL`
