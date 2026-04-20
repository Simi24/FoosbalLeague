# Foosball League

ELO-based office foosball league management. Record matches asynchronously, track ratings, climb the leaderboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Mangum (AWS Lambda) |
| Database | DynamoDB (single-table, via dynantic) |
| Auth | AWS Cognito + Amplify (Google login) |
| Frontend | React + Vite + TypeScript + Tailwind |
| IaC | Terraform |
| Local Dev | Docker + LocalStack + DevContainer |

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VSCode](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Setup

1. Clone the repo
2. Open in VSCode
3. When prompted, click **"Reopen in Container"** (or `Cmd+Shift+P` -> `Dev Containers: Reopen in Container`)
4. Wait for the container to build and dependencies to install
5. Run the full stack:

```bash
just dev
```

This starts:
- **Backend** on `http://localhost:9001` (FastAPI + debugpy)
- **Frontend** on `http://localhost:5173` (Vite dev server)
- **LocalStack** on `http://localhost:4566` (DynamoDB, etc.)

### Available Commands

```bash
just dev              # Start full stack
just stop             # Stop all services
just test-backend     # Run backend tests
just lint-backend     # Lint backend (ruff)
just dev-frontend     # Frontend dev server only
just scan-db          # Scan DynamoDB table (debug)
```

## Project Structure

```
FoosbalLeauge/
├── backend/          # FastAPI + Mangum (Python)
├── frontend/         # React + Vite (TypeScript)
├── infra/            # Terraform modules
├── .devcontainer/    # Dev environment config
├── docker-compose.yaml
└── justfile          # Task runner
```
