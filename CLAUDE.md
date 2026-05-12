# Project Overview

This is a web application with a Python Flask backend and React frontend. The stack is deployed as a Docker Compose stack.

## Tech Stack

- **Backend:** Python Flask (REST API)
- **Frontend:** React with Tailwind CSS
- **Database:** PostgreSQL
- **Deployment:** Docker Compose

## Project Structure

```
.
├── backend/              # Flask application
│   ├── app/
│   │   ├── __init__.py   # App factory
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routes/       # Blueprint route handlers
│   │   └── services/     # Business logic
│   ├── migrations/       # Alembic DB migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components
│   │   ├── hooks/        # Custom React hooks
│   │   └── api/          # API client functions
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── CLAUDE.md
```

## Database

- **Engine:** PostgreSQL
- **Username:** `baseline`
- **Password:** `baseline`
- **Host (in Docker network):** `db`
- **Default DB name:** `baseline`
- **Connection string:** `postgresql://baseline:baseline@db:5432/baseline`

> ⚠️ These credentials are for local development only. Never use them in production.

## Environment & Commands

### Docker Compose (primary workflow)

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Rebuild after code changes
docker compose up --build

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Run a command inside the backend container
docker compose exec backend flask db upgrade
```

### Backend (Flask)

```bash
# Install dependencies (inside backend/)
pip install -r requirements.txt

# Run migrations
flask db upgrade

# Create a new migration
flask db migrate -m "description"

# Run tests
pytest
```

### Frontend (React)

```bash
# Install dependencies (inside frontend/)
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Code Style

### Python / Flask

- Follow PEP 8
- Use Flask application factory pattern (`create_app()`)
- Organise routes into Blueprints
- Use SQLAlchemy ORM for all database access — no raw SQL unless absolutely necessary
- Use `flask db migrate` / `flask db upgrade` (Alembic) for all schema changes — never edit the database schema directly
- Use environment variables for all configuration; never hardcode secrets

### React / Frontend

- Use functional components and hooks only — no class components
- Tailwind CSS utility classes for all styling — no custom CSS files unless unavoidable
- Co-locate component logic, styles, and tests where possible
- Fetch data from the Flask API via functions in `src/api/`

## Important Notes

- **NEVER commit `.env` files** — they are git-ignored
- **All schema changes must go through migrations** — do not alter tables directly
- The frontend talks to the backend via the service name `backend` within Docker (e.g. `http://backend:5000`); in local dev outside Docker it is `http://localhost:5000`
- The PostgreSQL service is named `db` in `docker-compose.yml`; use that hostname inside containers
- Hot-reload is enabled in development for both Flask (debug mode) and React (Vite/CRA dev server)
