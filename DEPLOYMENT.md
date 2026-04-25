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

## Important note

Orders and custom requests are stored in JSON files under:

```text
server/server/data/
```

So the buyer should:
- back up those files regularly
- avoid hosts that wipe filesystem data on restart unless they add a database later
