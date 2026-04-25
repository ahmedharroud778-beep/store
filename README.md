
  # Baraa Store Website Design

  This is a code bundle for Baraa Store Website Design. The original project is available at https://www.figma.com/design/nUiotdE6ZcsWazLjt3XwVR/Baraa-Store-Website-Design.

  ## Environment files

  Frontend env:
  - `.env`
  - `.env.example`

  Backend env:
  - `server/.env`
  - `server/.env.example`

  Main variables:
  - `VITE_ADMIN_PATH` for the admin route in the frontend
  - `VITE_API_BASE_URL` if you want the frontend to call a backend on a different origin
  - `PORT` for the backend server port
  - `DB_PATH` for the SQLite database file used by the backend
  - `ADMIN_USERNAME` and `ADMIN_PASSWORD` for admin login
  - `ADMIN_JWT_SECRET` for signing admin tokens

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start both the frontend and backend together.

  If you only want one side:
  - `npm run dev:frontend`
  - `npm run dev:backend`

  Run `npm run health:check` to verify the frontend, backend, admin login, protected routes, create/delete product flow, and checkout flow.

  For the backend:

  Run `cd server`

  Run `npm i`

  Run `npm run dev`

  For a simple production deployment, see `DEPLOYMENT.md`.
  
