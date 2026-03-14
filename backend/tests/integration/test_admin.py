"""Integration tests for /api/v1/admin endpoints."""


class TestGetTenant:
    """GET /api/v1/admin/tenant — tenant settings."""

    def test_returns_default_tenant(self, client):
        resp = client.get("/api/v1/admin/tenant")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tenant_id"] == "default"
        assert data["name"] == "Office Foosball"
