# HungryList Architecture

## Backend

- Express app with centralized error middleware and consistent error shape.
- SQLite in WAL mode via `better-sqlite3`.
- Migration runner with compatibility checks for legacy schema diffs.
- Domain services:
  - `auth-service`: PIN login, session cookies, IP lockout rules.
  - `section-service`: CRUD with soft-delete and last-section protection.
  - `item-service`: CRUD, duplicate prevention, soft-delete restore.
  - `backup-service`: manual/monthly backups and restore with session invalidation.
  - `history-service`: audit event records.

## Frontend

- React + React Query SPA.
- Mobile-first UI using DaisyUI components.
- Persisted UI state:
  - Active tab
  - Selected section
  - Search/filter values
  - Theme mode
- Feature modals:
  - Add/Edit Item
  - Add/Edit Section
  - Restore Backup confirmation
- Toast notifications auto-hide in 2 seconds.

## Data Model

- `sections` (soft delete)
- `items` (soft delete, normalized names, checked/favorite/running_low/reminder fields)
- `history_events`
- `sessions`
- `auth_failures`
- `backups`

## Deployment

- Single container serves frontend static assets and `/api` from backend.
- Persistent volume mounted at `/data` stores SQLite DB + backup files.
