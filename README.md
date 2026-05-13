# LeadFlow

LeadFlow is a lightweight CRM dashboard for tracking sales leads, follow-up activity, and discussion history. It provides a FastAPI backend backed by MongoDB and a React dashboard for creating leads, filtering active pipeline work, updating lead status, and recording timeline notes.

## Features

- Lead dashboard with search and status filters.
- Follow-up focused views for today's activity and overdue leads.
- Lead creation with validation.
- Lead status updates across the sales lifecycle.
- Discussion timeline per lead with notes and optional follow-up dates.
- MongoDB seed script with realistic demo data.
- Docker Compose setup for local full-stack development and deployment.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, Axios |
| Backend | FastAPI, Python 3.12, Motor, PyMongo, Pydantic |
| Database | MongoDB 7 |
| Runtime | Docker, Docker Compose, Nginx |

## Screenshots

Add screenshots after running the application locally:

- Dashboard view: `docs/screenshots/dashboard.png`
- Lead timeline: `docs/screenshots/lead-timeline.png`
- Add lead dialog: `docs/screenshots/add-lead.png`

## Folder Structure

```text
LeadFlow/
|-- backend/
|   |-- app/
|   |   |-- routes/          # FastAPI route handlers
|   |   |-- schemas/         # Pydantic request/response schemas
|   |   |-- services/        # Business logic and database operations
|   |   |-- config.py        # Runtime settings
|   |   |-- database.py      # MongoDB connection lifecycle
|   |   `-- main.py          # FastAPI application entrypoint
|   |-- scripts/
|   |   `-- seed_mongodb.py  # Demo data loader
|   |-- Dockerfile
|   `-- requirement.txt
|-- frontend/
|   |-- src/
|   |   |-- api/             # Axios client and API wrappers
|   |   |-- components/      # UI and feature components
|   |   |-- hooks/           # TanStack Query hooks
|   |   |-- pages/           # Dashboard page
|   |   |-- types/           # Shared frontend types
|   |   `-- utils/           # Formatting and utility helpers
|   |-- Dockerfile
|   |-- nginx.conf
|   `-- package.json
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

## API Endpoints

Base backend URL: `http://localhost:8000`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check for the API service. |
| `GET` | `/api/leads` | List leads. Supports `status`, `search`, `overdue`, and `today` query parameters. |
| `POST` | `/api/leads` | Create a lead. |
| `PATCH` | `/api/leads/{lead_id}` | Update lead fields or status. |
| `GET` | `/api/leads/{id}/discussions` | List discussions for a lead. |
| `POST` | `/api/leads/{id}/discussions` | Add a discussion note and optional follow-up date. |

Interactive API docs are available at `http://localhost:8000/docs` when the backend is running.

## Environment Variables

Copy the root template before running Docker:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `APP_NAME` | FastAPI application name. | `LeadFlow` |
| `ENVIRONMENT` | Runtime environment label. | `production` |
| `FRONTEND_PORT` | Published frontend port. | `3000` |
| `BACKEND_PORT` | Published backend port. | `8000` |
| `MONGO_PORT` | Published MongoDB port. | `27017` |
| `MONGO_ROOT_USERNAME` | MongoDB root username for Docker. | `leadflow` |
| `MONGO_ROOT_PASSWORD` | MongoDB root password for Docker. | `change_this_password` |
| `MONGO_DB_NAME` | MongoDB database name. | `leadflow` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins. | `http://localhost:3000,http://127.0.0.1:3000` |
| `VITE_API_BASE_URL` | Frontend API base URL. Leave empty in Docker to use Nginx `/api` proxy. | empty |

For non-Docker backend development, create `backend/.env` and include:

```env
APP_NAME=LeadFlow
ENVIRONMENT=development
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=leadflow
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

For non-Docker frontend development, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Setup Instructions

### Docker Setup

1. Create the environment file:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up --build
   ```

3. Open the application:

   ```text
   http://localhost:3000
   ```

4. Seed demo data:

   ```bash
   docker compose exec backend python scripts/seed_mongodb.py
   ```

Useful Docker commands:

```bash
docker compose down
docker compose down -v
docker compose logs -f backend
docker compose logs -f frontend
```

### Local Development

1. Start MongoDB locally or use the Docker MongoDB service:

   ```bash
   docker compose up mongodb
   ```

2. Install and run the backend:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirement.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
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

## Deployment Instructions

### Docker Compose Deployment

1. Provision a host with Docker and Docker Compose.
2. Copy the repository to the host.
3. Create `.env` from `.env.example` and update secrets, ports, and CORS origins.
4. Build and start services:

   ```bash
   docker compose up --build -d
   ```

5. Verify service health:

   ```bash
   docker compose ps
   curl http://localhost:8000/health
   ```

6. Configure a reverse proxy or load balancer to route public traffic to the frontend service.

### Separate Frontend and Backend Deployment

- Deploy the backend container with `MONGO_URI`, `MONGO_DB_NAME`, and `CORS_ORIGINS` configured for the production environment.
- Deploy MongoDB as a managed service or secured self-hosted instance.
- Build the frontend with `VITE_API_BASE_URL` set to the public backend URL.
- Serve the generated frontend assets through Nginx, a static hosting provider, or a CDN.

## Future Improvements

- Authentication and role-based access control.
- Lead ownership, assignment, and team views.
- Pagination and server-side sorting for larger lead databases.
- Email and calendar integrations for follow-up reminders.
- Audit history for lead changes.
- Automated test coverage for backend services and frontend workflows.
- CI/CD pipeline with linting, tests, image build, and deployment promotion.
