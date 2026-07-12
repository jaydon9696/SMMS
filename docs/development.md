# Development

## Backend

The backend is in `backend/`.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Set `DATABASE_URL` to a local or Docker Postgres instance.

Run FastAPI dev server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Migrations:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Frontend

The frontend is in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

## Full Stack

Use Docker Compose:

```bash
cp .env.example .env
# edit .env
make dev
```

Access the app at `http://localhost`.
