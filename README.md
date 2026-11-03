# BytePath

BytePath is a full-stack learning assistant that tracks student roster data, topics, and per-question progress. The React/TypeScript frontend surfaces curated content while a Flask API handles authentication, roster uploads, topic visibility, reporting, and per-question response tracking.

## Contributors
- Deborah Rabinovich
- Marena Abboud
- Matthew Krauss
- Vicente Rivera
- Jeffrey Bush

## Tech Stack
- Frontend: React + TypeScript (Vite)
- Backend: Flask + SQLAlchemy (SQLite by default)
- Deployment: Systemd services via `deploy/deploy.sh`

## Repository Map
- `src/` — React application
- `backend/` — Flask API, models, and services (`backend/bytepath.db` for local SQLite)
- `deploy/` — automation for local and EC2 deployments
- `sample-data/` — example CSVs for roster uploads

## System Diagram
![System diagram showing users hitting the React/TypeScript frontend, which calls the Flask API backed by SQLite](docs/system-diagram.svg)

## Prerequisites
- Python 3.10+ with `venv`
- Node.js 24+ and npm
- Git and SSH access for deployment targets

## Local Setup and Run
1) Install dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm install
```

2) Launch the stack  
- Option A (recommended): `./deploy/local-deploy.sh`  
- Option B (manual):
  - Terminal 1: `FLASK_ENV=development python -m backend.app`
  - Terminal 2: `npm run dev`

3) Open the app  
- Frontend: http://localhost:5173  
- Backend health: http://localhost:5000/health

SQLite is stored at `backend/bytepath.db`. Topics are auto-seeded on first boot.

### Environment Variables
- `BYTEPATH_SECRET_KEY` — session secret (defaults to `dev-secret-key-change-me`)
- `CORS_ORIGINS` — comma-separated origins allowed by the API (defaults to `http://localhost:5173`)
- `FLASK_ENV` — `development`, `production`, or `testing`

## API Overview
Base URL: `http://<host>:5000`

- **Auth**
  - `POST /api/auth/login` — `{ "email": "student@example.com" }` (creates user if needed)
  - `GET /api/auth/profile` — returns the current session user

- **Topics**
  - `GET /api/topics?role=student|staff` — visible topics for the requester
  - `GET /api/topics/<topic_id>` — topic metadata
  - `POST /api/topics` — create `{ id, name, is_visible?, order_index? }`
  - `PUT /api/topics/<topic_id>` — update name/order/visibility
  - `PATCH /api/topics/<topic_id>/visibility` — toggle visibility

- **Roster / Students**
  - `GET /api/students` — paged roster with search/sort filters
  - `POST /api/students` — create one student `{ email, first_name, last_name, ... }`
  - `PATCH /api/students/<id>` — partial update; `DELETE` soft-deletes
  - CSV upload: `POST /api/students/add` (add) and `POST /api/students/drop` (soft-delete); required CSV headers: `first_name,last_name,email`
  - `GET /api/students/<id>` — fetch a single student

- **Progress**
  - `GET /api/progress/<user_id>` — progress across topics
  - `GET /api/progress/<user_id>/<topic_id>` — specific topic progress
  - `PUT /api/progress/<user_id>/<topic_id>` — upsert `{ subtopics_completed, total_subtopics }`
  - `POST /api/progress/<user_id>/<topic_id>/increment` — increment answered questions

- **Responses**
  - `POST /api/responses` — record a question attempt. Required fields: `user_id`, `topic`, `subtopic_type`, `question_code`, `correct_answer`, `is_correct`, `status` (`correct|incorrect|skipped`); optional: `student_answer`, `time_spent`.
  - `GET /api/responses/student/<student_id>` — all responses for a student

- **Reports**
  - `GET /api/reports/student/<student_id>` — student-level summary
  - `GET /api/reports/topic/<topic_id>` — topic-level summary
  - `GET /api/reports/class/overview` — class-wide rollup
  - `GET /api/reports/question/<topic_id>/analytics?subtopic_type=...` — per-question analytics

## Testing and Quality Checks
- Backend unit tests: `pytest backend/tests`
- Frontend lint: `npm run lint`
