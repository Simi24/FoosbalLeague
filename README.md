# FoosRank

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

## Production Deploy

Deploys run via `.github/workflows/deploy.yml` (OIDC → AWS, no static keys).

### Custom Domain (Cloudflare)

Optional. Set per environment via `infra/envs/<env>/terraform.tfvars`:

```hcl
domain_name        = "yourdomain.com"
cloudflare_zone_id = "<zone-id-from-cloudflare-dashboard>"
```

Empty = AWS-generated URLs (CloudFront `*.cloudfront.net`, API Gateway `*.execute-api...`).

When set, Terraform provisions:
- ACM certs (us-east-1 for CloudFront, eu-west-1 for API Gateway), DNS-validated via Cloudflare
- API Gateway custom domain `api.yourdomain.com`
- Cloudflare records: apex `@` → CloudFront (proxy ON), `api` → API Gateway (proxy OFF)

### Cloudflare API Token

Required only when `domain_name` is set.

1. Cloudflare dashboard → My Profile → API Tokens → Create Token
2. Permissions: `Zone:DNS:Edit` + `Zone:Zone:Read`, scoped to the target zone only
3. Add as **secret** to the matching GitHub Environment (Settings → Environments → `prod` → Secrets), name: `CLOUDFLARE_API_TOKEN`

For local `just tf-apply`, export the same token:
```bash
export CLOUDFLARE_API_TOKEN=...
```

### Web Analytics (optional)

Cloudflare Free Web Analytics: enable in dashboard for the zone, copy the JS snippet, add to `frontend/index.html`. Tracks SPA pageviews + Web Vitals. Works regardless of proxy mode (covers `api.` traffic too).

## Project Structure

```
foosrank/
├── backend/          # FastAPI + Mangum (Python)
├── frontend/         # React + Vite (TypeScript)
├── infra/            # Terraform modules
├── .devcontainer/    # Dev environment config
├── docker-compose.yaml
└── justfile          # Task runner
```
