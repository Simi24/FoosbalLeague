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

## Built on dynantic

FoosRank runs in production at [foosrank.app](https://foosrank.app/) and is a real-world example of [dynantic](https://github.com/Simi24/dynantic), a Pydantic-based ORM for DynamoDB.

The whole app lives in one DynamoDB table. [`backend/app/models/base.py`](backend/app/models/base.py) declares the shared keys once, and every entity (player, league, match, rating, achievement, notification) registers itself on the same base through a discriminator:

```python
class BaseEntity(DynamoModel):
    pk: str = Key()
    sk: str = SortKey()
    entity_type: str = Discriminator()
    gsi1_pk: str | None = GSIKey(index_name="GSI1", default=None)
    gsi1_sk: str | None = GSISortKey(index_name="GSI1", default=None)


@BaseEntity.register("MATCH")
class MatchModel(BaseEntity): ...
```

Queries come back as typed models. The leaderboard, for example, is one GSI query ([`backend/app/services/ranking_service.py`](backend/app/services/ranking_service.py)):

```python
BaseEntity.query_index("GSI1", f"LEAGUE#{league_id}").starts_with("RATING#").all()
```

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

Two-track deployment model:

| Change type | How | Where |
|-------------|-----|-------|
| App code (backend Python, frontend React) | Automatic on release-please merge | `.github/workflows/deploy.yml` |
| Infrastructure (Terraform: modules, vars, IAM, etc.) | **Manual local apply** | `just tf-apply DEPLOY_ENV=<env>` |

CI never touches Terraform. Only Lambda image + S3 sync + CloudFront invalidate.
Lambda's `image_uri` is excluded from Terraform via `lifecycle { ignore_changes }` so local `tf apply` doesn't fight CI image updates.

### Local infra changes

Prereq:
```bash
export AWS_PROFILE=<your-profile>
export CLOUDFLARE_API_TOKEN=<token>   # only required if domain_name is set in the env
```

Workflow:
```bash
just tf-init DEPLOY_ENV=prod    # only on env switch / first run
just tf-plan DEPLOY_ENV=prod    # review diff
just tf-apply DEPLOY_ENV=prod   # apply
```

State lives in `s3://foosball-league-terraform-state/<env>/terraform.tfstate` (locked via DynamoDB table).

### Recovery: importing existing AWS resources

If state is lost or new resources were ClickOps'd:
```bash
just tf-reconcile DEPLOY_ENV=<env>   # imports core AWS resources by convention
just tf-plan DEPLOY_ENV=<env>        # check for drift
```

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

Required only when `domain_name` is set in tfvars.

1. Cloudflare dashboard → My Profile → API Tokens → Create Token
2. Permissions: `Zone:DNS:Edit` + `Zone:Zone:Read`, scoped to the target zone only
3. Export locally before `just tf-*`:
   ```bash
   export CLOUDFLARE_API_TOKEN=<token>
   ```

CI does not need this token (no Terraform in CI).

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
