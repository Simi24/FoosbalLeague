# Foosball League - Development & Deploy Commands
# Run these from inside the devcontainer

aws_region := "eu-west-1"
project := "foosball-league"
deploy_env := env("DEPLOY_ENV", "dev")

# ─── Local Dev ───────────────────────────────────────────

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

# Run backend unit tests (no docker needed)
test-backend:
    cd backend && PYTHONPATH=app ENV=local LOCAL=true python -m pytest tests/ -v --ignore=tests/integration

# Run integration tests (requires: docker compose up localstack -d)
test-integration:
    cd backend && PYTHONPATH=app ENV=local LOCAL=true DYNAMODB_TABLE=foosball-league python -m pytest tests/integration/ -v

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

# Lint frontend
lint-frontend:
    cd frontend && yarn lint

# ─── Bootstrap (one-time) ────────────────────────────────

# Create S3 bucket for Terraform state + ECR repo (run once)
bootstrap:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Creating Terraform state bucket..."
    aws s3api create-bucket \
        --bucket {{project}}-terraform-state \
        --region {{aws_region}} \
        --create-bucket-configuration LocationConstraint={{aws_region}}
    aws s3api put-bucket-versioning \
        --bucket {{project}}-terraform-state \
        --versioning-configuration Status=Enabled
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name {{project}} \
        --region {{aws_region}}
    echo "Bootstrap complete."

# ─── Backend Deploy ──────────────────────────────────────

# Build backend Docker image for Lambda (prod stage)
build-backend:
    cd backend && docker build --platform linux/arm64 -t {{project}}:latest --target prod .

# Login to ECR
ecr-login:
    #!/usr/bin/env bash
    set -euo pipefail
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    aws ecr get-login-password --region {{aws_region}} | \
        docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.{{aws_region}}.amazonaws.com"

# Build + push backend image to ECR
push-backend: build-backend ecr-login
    #!/usr/bin/env bash
    set -euo pipefail
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URL="$ACCOUNT_ID.dkr.ecr.{{aws_region}}.amazonaws.com/{{project}}"
    docker tag {{project}}:latest "$ECR_URL:latest"
    docker push "$ECR_URL:latest"
    echo "Pushed: $ECR_URL:latest"

# Update Lambda to use latest image (quick deploy, no infra changes)
deploy-backend: push-backend
    #!/usr/bin/env bash
    set -euo pipefail
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URL="$ACCOUNT_ID.dkr.ecr.{{aws_region}}.amazonaws.com/{{project}}"
    aws lambda update-function-code \
        --function-name "{{project}}-{{deploy_env}}" \
        --image-uri "$ECR_URL:latest" \
        --region {{aws_region}}
    echo "Lambda updated: {{project}}-{{deploy_env}}"

# ─── Frontend Deploy ─────────────────────────────────────

# Build frontend with env vars from Terraform outputs
build-frontend-prod:
    #!/usr/bin/env bash
    set -euo pipefail
    cd infra
    API_URL=$(terraform output -raw api_url)
    CLIENT_ID=$(terraform output -raw cognito_client_id)
    cd ../frontend
    VITE_API_URL="$API_URL" \
    VITE_COGNITO_REGION="{{aws_region}}" \
    VITE_COGNITO_CLIENT_ID="$CLIENT_ID" \
    yarn build
    echo "Frontend built with API_URL=$API_URL"

# Deploy frontend to S3 + invalidate CloudFront
deploy-frontend: build-frontend-prod
    #!/usr/bin/env bash
    set -euo pipefail
    cd infra
    BUCKET=$(terraform output -raw frontend_bucket)
    DIST_ID=$(terraform output -raw cloudfront_distribution_id)
    aws s3 sync ../frontend/dist/ "s3://$BUCKET/" --delete
    aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"
    echo "Frontend deployed: https://$(terraform output -raw cloudfront_domain)"

# ─── Terraform ───────────────────────────────────────────

# Initialize Terraform with backend config
tf-init:
    cd infra && terraform init -backend-config=envs/{{deploy_env}}/backend.hcl

# Show Terraform plan
tf-plan:
    cd infra && terraform plan -var-file=envs/{{deploy_env}}/terraform.tfvars

# Apply Terraform
tf-apply:
    cd infra && terraform apply -var-file=envs/{{deploy_env}}/terraform.tfvars

# Show Terraform outputs
tf-output:
    cd infra && terraform output

# ─── Full Deploy ─────────────────────────────────────────

# Full deploy: push image → terraform → frontend
deploy: push-backend tf-apply deploy-frontend
    @echo "Full deploy complete ({{deploy_env}})"
