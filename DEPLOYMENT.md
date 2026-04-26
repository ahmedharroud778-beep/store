# Deployment Guide

## Simple production setup

This project can run in production with:
- one built frontend from `dist/`
- one Node backend from `server/`

The backend is configured to serve the frontend build when:
- `NODE_ENV=production`

## Build the frontend

From the project root:

```bash
npm install
cd server
npm run build:frontend
```

This creates the production frontend in `dist/`.

## Start the backend in production

Inside `server/.env`, set at least:

```env
PORT=5000
NODE_ENV=production
ADMIN_USERNAME=your-admin-user
ADMIN_PASSWORD=your-admin-password
ADMIN_JWT_SECRET=your-long-random-secret
```

Then run:

```bash
cd server
npm install
npm run start:prod
```

## What production mode does

- serves API routes from the backend
- serves admin routes from the same server
- serves the built frontend from `dist/`

## Recommended hosting

This project is a good fit for:
- VPS hosting
- Render
- Railway
- any Node hosting that supports persistent filesystem access

## Free hosting without persistent disk (works, with cloud services)

If your host **does not** support persistent disks (or you don't have a plan), you must move data off the server:

- **Database**: set `DATABASE_URL` to a hosted Postgres (Supabase / Neon free tier)
- **Images**: set `CLOUDINARY_*` to store uploads on Cloudinary (free tier)

With this setup:
- products/orders/custom requests persist (Postgres)
- uploaded images persist (Cloudinary)
and redeploys won't wipe anything.

## Important note

This backend stores data on disk:
- SQLite database file (products, categories, orders, custom requests)
- uploaded images (served from `/uploads/*`)

If your host wipes filesystem data on restart/redeploy, you **must** enable persistence.

### Render persistence (recommended)

On Render, add a **Persistent Disk** to your web service and mount it at something like:

```text
/var/data
```

Then set these environment variables:

```env
NODE_ENV=production
DATA_DIR=/var/data/baraa-store
UPLOADS_DIR=/var/data/baraa-store/uploads
# Optional (if you prefer explicit DB file path):
# DB_PATH=/var/data/baraa-store/baraa-store.db
```

This ensures **new products, orders, and uploaded images** survive deploys/restarts.

### Legacy JSON note

Older versions stored orders and custom requests in JSON files under:

```text
server/server/data/
```

So the buyer should:
- back up those files regularly
- avoid hosts that wipe filesystem data on restart unless they add a database later
