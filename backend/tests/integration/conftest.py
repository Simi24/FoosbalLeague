"""Integration test fixtures — requires LocalStack running."""

import os
import socket

import pytest
from fastapi.testclient import TestClient


def _localstack_reachable() -> bool:
    """Check if LocalStack is reachable on localhost:4566."""
    try:
        with socket.create_connection(("localhost", 4566), timeout=2):
            return True
    except OSError:
        return False


# Skip entire integration suite if LocalStack is not running
pytestmark = pytest.mark.skipif(
    not _localstack_reachable(),
    reason="LocalStack not reachable on localhost:4566 — run 'docker compose up localstack -d' first",
)

# Point boto3/dynantic to LocalStack on the host
os.environ["AWS_ENDPOINT_URL"] = "http://localhost:4566"


@pytest.fixture(scope="module")
def client():
    """TestClient scoped per module to avoid repeated app startup."""
    from main import app

    with TestClient(app) as c:
        yield c
