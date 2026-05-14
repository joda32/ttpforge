# TTP Tracker

> [!WARNING]
> **Early Development — Work in Progress**
>
> This project is in active early development. The API and underlying database schema are subject to change without notice, and updates may require re-initialising your environment. It is not yet recommended for production use.
>
> Bug reports, pull requests, and feature suggestions are very welcome and greatly appreciated — please open an issue or PR if you run into something or have an idea worth adding.

TTP Tracker is a web-based purple team exercise management tool built to help red and blue teams collaborate more effectively during adversary simulation engagements. Instead of tracking techniques and detection outcomes across spreadsheets and shared docs, everything lives in one place — from the initial red team execution notes through to the blue team's detection results and gap analysis. It's designed to give both sides visibility into the same exercise in real time, with each role only able to touch the fields that belong to them.

---

## Features

- **Exercise management** — create and manage purple team exercises with status tracking (planned, active, completed)
- **TTP entry logging** — log executed techniques against the MITRE ATT&CK framework with red team execution details and blue team detection outcomes side by side
- **Role-based access control** — three roles (Admin, Red Team, Blue Team) with field-level enforcement; red teamers can't touch detection fields and vice versa
- **ATT&CK Matrix view** — live heatmap of all techniques in an exercise, colour-coded by detection outcome, exportable as SVG or PNG
- **Attack Map** — chronological attack path visualisation showing the execution chain with outcome status per step, exportable as SVG or PNG
- **MITRE Navigator layer import** — import an existing Navigator layer JSON to pre-populate techniques for an exercise
- **Entry change log** — full audit trail of every field change per entry, including who changed it and what the old and new values were
- **Image attachments** — attach screenshots to entries (e.g. SIEM alerts, tool output) with thumbnail previews inline
- **TTP library** — searchable library of MITRE ATT&CK techniques, with support for importing the full dataset from MITRE
- **Tags** — tag exercises and entries for filtering and reporting
- **Reports page** — per-exercise summary with detection rate statistics
- **User management** — admin-controlled user approval and role assignment; self-service signup with pending approval flow
- **API documentation** — built-in Swagger UI at `/docs/api`

---

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or [Docker Engine + Compose plugin](https://docs.docker.com/engine/install/) (Linux)
- Docker Compose v2 (included with Docker Desktop; install separately on Linux with `sudo apt install docker-compose-plugin`)
- Ports **5000**, **5173**, and **5432** available on the host

No other dependencies are required — everything else runs inside containers.

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd TTPTracker
```

### 2. Run first-time setup

**Windows (PowerShell):**
```powershell
.\start.ps1 -Init
```

**Linux / macOS (Bash):**
```bash
chmod +x start.sh
./start.sh --init
```

This will build the Docker images, run database migrations, seed the default users, and confirm the application is healthy before printing the access URLs.

### 3. Open the application

| | URL |
|---|---|
| App | http://localhost:5173 |
| API docs | http://localhost:5000/docs/api |

### 4. Log in with a default account

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin` |
| Red Team | `redteam` | `redteam` |
| Blue Team | `blueteam` | `blueteam` |

> Change these passwords after first login in a shared environment.

---

## Day-to-day Usage

```bash
# Start (after first-time setup)
.\start.ps1          # Windows
./start.sh           # Linux

# Stop
.\start.ps1 -Stop    # Windows
./start.sh --stop    # Linux

# Check requirements without starting
.\start.ps1 -Check   # Windows
./start.sh --check   # Linux

# View live logs
docker compose logs -f
```

---

## Default Credentials & Security Note

The seed accounts use trivial passwords and are intended for local development only. Before exposing the application on a shared network, change the passwords via the Admin → Users page and update the `JWT_SECRET_KEY` environment variable in `docker-compose.yml`.
