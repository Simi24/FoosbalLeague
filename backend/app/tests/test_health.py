from fastapi.testclient import TestClient


def test_root():
    import os

    os.environ.setdefault("ENV", "local")
    os.environ.setdefault("LOCAL", "true")

    from main import app

    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert data["app_name"] == "foosrank"


def test_health():
    import os

    os.environ.setdefault("ENV", "local")
    os.environ.setdefault("LOCAL", "true")

    from main import app

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
