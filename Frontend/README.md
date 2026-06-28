# Route53 Clone - Frontend Dashboard

A full-stack clone of the AWS Route53 Management Console built with **Next.js 15**, **FastAPI**, and **SQLite**.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Styling  | Tailwind CSS v4                     |
| State    | TanStack React Query                |
| Icons    | Lucide React                        |
| Backend  | FastAPI (Python)                    |
| ORM      | SQLAlchemy                          |
| Database | SQLite                              |
| Validation | Pydantic v2                       |

---

## Features

- **Authentication** — Mocked login/logout with session persistence via cookie
- **Hosted Zones** — Full CRUD (Create, Read, Update, Delete) with search, filter, and pagination
- **DNS Records** — Full CRUD scoped to a hosted zone; supports A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
- **AWS UI Fidelity** — Dark top nav, AWS orange accents, data tables, modals, notifications
- **Persistent Storage** — All data stored in SQLite via SQLAlchemy

---

## Database Schema

```
hosted_zones
  id           INTEGER PRIMARY KEY
  name         TEXT NOT NULL UNIQUE    (e.g. "example.com.")
  comment      TEXT
  private_zone BOOLEAN DEFAULT FALSE

dns_records
  id       INTEGER PRIMARY KEY
  zone_id  INTEGER FOREIGN KEY → hosted_zones(id) ON DELETE CASCADE
  name     TEXT NOT NULL               (e.g. "www.example.com.")
  type     TEXT NOT NULL               (A | AAAA | CNAME | TXT | MX | NS | PTR | SRV | CAA)
  ttl      INTEGER NOT NULL            (seconds)
  value    TEXT NOT NULL
```

---

## API Overview

### Hosted Zones
| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | `/zones`            | List all hosted zones    |
| POST   | `/zones`            | Create a hosted zone     |
| GET    | `/zones/{id}`       | Get zone by ID           |
| PUT    | `/zones/{id}`       | Update zone              |
| DELETE | `/zones/{id}`       | Delete zone + records    |

### DNS Records
| Method | Endpoint                           | Description              |
|--------|------------------------------------|--------------------------|
| GET    | `/zones/{id}/records`              | List records in zone     |
| POST   | `/zones/{id}/records`              | Create a record          |
| GET    | `/zones/{id}/records/{record_id}`  | Get record by ID         |
| PUT    | `/zones/{id}/records/{record_id}`  | Update record            |
| DELETE | `/zones/{id}/records/{record_id}`  | Delete record            |

Interactive Swagger docs available at **`http://localhost:8000/docs`**

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### 1 — Backend Setup

```bash
cd Backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate          # Windows
# source .venv/bin/activate       # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
# Server runs on http://localhost:8000
```

Or use the helper script on Windows:
```bash
.\run.bat
```

### 2 — Frontend Setup

```bash
cd Frontend

# Copy environment config
cp .env.example .env.local

# Install dependencies
npm install

# Start dev server
npm run dev
# App runs on http://localhost:3000
```

### 3 — Login

Navigate to `http://localhost:3000` — you will be redirected to the login page.  
Enter **any non-empty username and password** (this is a mocked auth system).

---

## Architecture Overview

```
route-52-scalar/
├── Backend/
│   ├── main.py          # FastAPI app entry, CORS config
│   ├── router.py        # All API route handlers
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic v2 request/response schemas
│   ├── database.py      # SQLite engine + session dependency
│   └── requirements.txt
│
└── Frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx           # Root layout (header + sidebar shell)
        │   ├── page.tsx             # Dashboard
        │   ├── login/page.tsx       # Auth page
        │   └── zones/
        │       ├── page.tsx         # Hosted Zones list + CRUD
        │       └── [id]/page.tsx    # DNS Records list + CRUD
        ├── components/
        │   ├── AwsHeader.tsx        # Top navigation bar
        │   ├── AwsSidebar.tsx       # Left sidebar
        │   └── providers.tsx        # React Query client provider
        ├── lib/
        │   └── api.ts               # Typed API client (fetch wrapper)
        └── middleware.ts            # Auth guard (redirects to /login)
```
