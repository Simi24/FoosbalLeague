import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from middlewares.aws_api_gateway_path import AWSAPIGatewayMiddleware
from routers import achievement_router, auth_router, player_router, league_router, match_router, ranking_router, admin_router
from version import __version__


app = FastAPI(
    title="foosball-league",
    description="ELO-based foosball league management API",
    version=__version__,
    dependencies=[],
)

app.add_middleware(AWSAPIGatewayMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "*"],
    expose_headers=["Date", "x-api-id"],
    max_age=300,
)

app.include_router(auth_router.router)
app.include_router(player_router.router)
app.include_router(league_router.router)
app.include_router(match_router.router)
app.include_router(ranking_router.router)
app.include_router(achievement_router.router)
app.include_router(admin_router.router)


@app.get("/", status_code=200)
def root() -> dict:
    return {
        "version": app.version,
        "app_name": app.title,
        "cloud_env": os.getenv("CLOUD_ENV"),
    }


@app.get("/health", status_code=200)
def health() -> dict:
    return {"status": "ok"}


lambda_handler = Mangum(app)
