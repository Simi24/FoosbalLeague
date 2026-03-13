# Foosball League - Development Commands
# Run these from inside the devcontainer

# Start full stack (backend + frontend + localstack)
dev:
    docker compose up --build

# Start in detached mode
dev-d:
    docker compose up --build -d

# Stop all services
stop:
    docker compose down

# Stop and remove volumes
clean:
    docker compose down -v

# Backend only (standalone)
dev-backend:
    cd backend && docker compose up --build

# View logs
logs:
    docker compose logs -f

logs-backend:
    docker compose logs -f backend

logs-frontend:
    docker compose logs -f frontend

# Run backend tests locally (inside devcontainer, no docker needed)
test-backend:
    cd backend && PYTHONPATH=app ENV=local LOCAL=true python -m pytest tests/ -v

# Lint backend
lint-backend:
    cd backend && ruff check app/

# Format backend
fmt-backend:
    cd backend && ruff format app/

# DynamoDB scan (debug) - requires localstack running
scan-db:
    aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name foosball-league

# Install frontend dependencies
install-frontend:
    cd frontend && yarn install

# Dev frontend only (with hot reload)
dev-frontend:
    cd frontend && yarn dev

# Build frontend
build-frontend:
    cd frontend && yarn build

# Lint frontend
lint-frontend:
    cd frontend && yarn lint
