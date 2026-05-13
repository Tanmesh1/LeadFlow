

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, Axios |
| Backend | FastAPI, Python 3.12, Motor, PyMongo, Pydantic |
| Database | MongoDB 7 |
| Runtime | Docker, Docker Compose, Nginx |

## Setup Instructions

### Local Development


1. Install and run the backend:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirement.txt
   uvicorn app.main:app --reload
   ```

3. Install and run the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open the Vite development server:

   ```text
   http://localhost:5173
   ```

## Architecture Decisions

- FastAPI owns API routing, validation, CORS, and application lifecycle management.
- MongoDB is accessed asynchronously through Motor to keep API handlers non-blocking.
- Business logic lives in service modules so route handlers remain thin and focused on HTTP concerns.
- Pydantic schemas define API contracts and keep backend responses consistent with frontend expectations.
- React Query handles frontend server state, caching, mutation invalidation, and loading/error states.
- The containerized frontend is served by Nginx, which proxies `/api` requests to the backend service inside the Docker network.
- Docker Compose defines the local production-like topology: Nginx frontend, FastAPI backend, and MongoDB with persistent volume storage.


