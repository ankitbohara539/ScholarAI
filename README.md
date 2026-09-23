# ScholarAI

ScholarAI is an AI-powered scholarship and university recommendation platform for students. It combines a React frontend, a FastAPI backend, role-based user management, university and scholarship data, and a hybrid recommendation engine that helps students discover suitable universities based on their profile, preferences, budget, and academic background.

## Features

- Student registration, login, profile management, and account settings
- Admin dashboard for managing students, universities, and scholarships
- Public university browsing with search and filtering
- Student dashboard with recommendations, university comparison, and simulator views
- Hybrid university recommendation workflow with match scores and cost breakdowns
- Notifications and profile avatar uploads
- REST API with FastAPI, SQLAlchemy, Alembic migrations, and JWT authentication
- ML engine for training and serving university recommendation models

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI, Axios, Vitest
- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, PyJWT, PyMySQL
- **ML:** PyTorch, scikit-learn, pandas, NumPy
- **Database:** MySQL in production-style setup; SQLite also works for local development

## Project Structure

```text
ScholarAI/
|-- client/                    # React + Vite frontend
|-- server/
|   |-- app/                   # FastAPI application code
|   |-- alembic/               # Database migrations
|   |-- ml_engine/             # Training, recommendation CLI, and ML API
|   |-- scripts/               # Admin creation and data import helpers
|   |-- tests/                 # Backend tests
|   `-- requirements.txt       # Backend dependencies
|-- universities_500.csv       # Additional university dataset
`-- README.md
```

## Prerequisites

- Node.js and npm
- Python 3.11+
- MySQL, or SQLite for a lightweight local setup

## Backend Setup

From the project root:

```powershell
cd server
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create `server/.env`:

```env
DATABASE_URL=sqlite:///./scholarai.db
JWT_SECRET_KEY=change-this-to-a-long-random-secret-at-least-32-chars
FRONTEND_ORIGIN=http://localhost:5173
```

For MySQL, use a URL like:

```env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/scholarai
```

Run migrations:

```powershell
alembic upgrade head
```

Optionally import university data and create an admin account:

```powershell
python -m scripts.import_universities
python -m scripts.create_admin
```

Start the backend API:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API documentation is available at `http://127.0.0.1:8000/docs`.

## Frontend Setup

In a new terminal from the project root:

```powershell
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

If the backend is not running at `http://localhost:8000/api`, create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## ML Engine

The ML engine lives in `server/ml_engine`. It trains a PyTorch model and combines ANN scoring, similar-applicant scoring, and content-based ranking signals.

Train the model:

```powershell
cd server
python -m ml_engine.train --epochs 300 --patience 35
```

Training writes both the legacy PyTorch checkpoint and the configured pickle
bundle. Set `ML_PICKLE_PATH=ml_engine/artifacts/admission_model.pkl` to override
the pickle location. Generated `.pt`, `.pkl`, and metadata files remain ignored
by Git.

Verify that a saved pickle can be loaded:

```powershell
python -c "from app.core.config import settings; from ml_engine.persistence import load_model; print(load_model(settings.ml_pickle_path)['artifact_format_version'])"
```

Run the recommendation CLI:

```powershell
python -m ml_engine.recommend `
  --gre 325 `
  --toefl 112 `
  --sop 4.0 `
  --lor 4.0 `
  --gpa 3.70 `
  --research 1 `
  --desired-rating 4 `
  --regions "Europe,Americas" `
  --strategy balanced `
  --top-k 12
```

See `server/ml_engine/README.md` for model details, metrics, limitations, and API usage.

## Testing

Backend tests:

```powershell
cd server
python -m pytest
```

Frontend tests:

```powershell
cd client
npm test
```

Frontend build:

```powershell
cd client
npm run build
```

## Useful Scripts

- `python -m scripts.import_universities` imports normalized QS university data into the configured database.
- `python -m scripts.create_admin` creates an admin user interactively.
- `alembic upgrade head` applies database migrations.
- `npm run dev` starts the frontend development server.
- `npm run build` builds the frontend for production.

## Status

MVP in development.
