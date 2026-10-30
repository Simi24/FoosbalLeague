"""Integration tests for /api/v1/notifications endpoints.

Covers the full lifecycle: submit a match → pending notifications reach the
other-team players → list → mark one read → mark all read.

Each test sets its own `dependency_overrides` entry before the first request,
since the overrides dict is shared across the app and fixtures cannot cleanly
switch identity mid-test without colliding.
"""

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from dependencies.auth import AuthenticatedUser, get_current_user
from models.base import BaseEntity
from models.enrollment import EnrollmentModel
from models.notification import NotificationModel
from models.player import PlayerModel
from models.rating import RatingModel

TENANT_ID = "default"
LEAGUE_ID = "league-001"

SUBMITTER_SUB = "test-sub-notif-submitter"
SUBMITTER_EMAIL = "submitter-notif@foosball.local"
SUBMITTER_ID = "player-notif-submitter"

RECIPIENT_SUB = "test-sub-notif-recipient"
RECIPIENT_EMAIL = "recipient-notif@foosball.local"
RECIPIENT_ID = "player-notif-recipient"


@pytest.fixture(scope="module", autouse=True)
def _seed_users():
    now = datetime.now(UTC)

    # Wipe any stale notifications for these test players (e.g. from prior
    # test runs or from older notif-id formats) so each run starts clean.
    for pid in (SUBMITTER_ID, RECIPIENT_ID):
        stale = (
            BaseEntity.query(f"TENANT#{TENANT_ID}").starts_with(f"NOTIF#{pid}#").all()
        )
        for n in stale:
            if isinstance(n, NotificationModel):
                NotificationModel.delete(n.pk, n.sk)

    for pid, sub, email, name, role in [
        (SUBMITTER_ID, SUBMITTER_SUB, SUBMITTER_EMAIL, "Notif Submitter", "admin"),
        (RECIPIENT_ID, RECIPIENT_SUB, RECIPIENT_EMAIL, "Notif Recipient", "player"),
    ]:
        PlayerModel(
            pk=f"TENANT#{TENANT_ID}",
            sk=f"PLAYER#{pid}",
            gsi3_pk=email,
            gsi3_sk=f"PLAYER#{pid}",
            player_id=pid,
            cognito_sub=sub,
            display_name=name,
            email=email,
            created_at=now,
            updated_at=now,
        ).save()

        EnrollmentModel(
            pk=f"TENANT#{TENANT_ID}",
            sk=f"ENROLL#{LEAGUE_ID}#{pid}",
            gsi1_pk=f"LEAGUE#{LEAGUE_ID}",
            gsi1_sk=f"ENROLL#{pid}",
            league_id=LEAGUE_ID,
            player_id=pid,
            display_name=name,
            role=role,
            current_elo=1200,
            created_at=now,
            updated_at=now,
        ).save()

        inv_elo = str(9999 - 1200).zfill(4)
        RatingModel(
            pk=f"TENANT#{TENANT_ID}",
            sk=f"RATING#{LEAGUE_ID}#{pid}",
            gsi1_pk=f"LEAGUE#{LEAGUE_ID}",
            gsi1_sk=f"RATING#{inv_elo}#{pid}",
            league_id=LEAGUE_ID,
            player_id=pid,
            display_name=name,
            elo=1200,
            matches_played=0,
            wins=0,
            losses=0,
            created_at=now,
            updated_at=now,
        ).save()


def _client_as(sub: str, email: str, name: str) -> TestClient:
    """Fresh TestClient with auth override pinned to the given identity."""
    from main import app

    async def _override() -> AuthenticatedUser:
        return AuthenticatedUser(
            sub=sub,
            email=email,
            name=name,
            groups=[],
            tenant_id=TENANT_ID,
        )

    app.dependency_overrides[get_current_user] = _override
    return TestClient(app)


def _as_submitter() -> TestClient:
    return _client_as(SUBMITTER_SUB, SUBMITTER_EMAIL, "Notif Submitter")


def _as_recipient() -> TestClient:
    return _client_as(RECIPIENT_SUB, RECIPIENT_EMAIL, "Notif Recipient")


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    from main import app

    app.dependency_overrides.clear()


class TestNotificationLifecycle:
    _notif_id: str | None = None

    def test_01_submitter_triggers_match_pending(self):
        with _as_submitter() as client:
            resp = client.post(
                "/api/v1/matches/",
                json={
                    "league_id": LEAGUE_ID,
                    "team1": {
                        "player_ids": [SUBMITTER_ID, RECIPIENT_ID],
                        "score": 10,
                    },
                    "team2": {
                        "player_ids": ["player-001", "player-002"],
                        "score": 6,
                    },
                },
            )
        assert resp.status_code == 201, resp.json()

    def test_02_recipient_sees_pending_notification(self):
        with _as_recipient() as client:
            resp = client.get("/api/v1/notifications")
        assert resp.status_code == 200, resp.json()
        body = resp.json()

        assert body["unread_count"] >= 1
        pending = [
            n
            for n in body["notifications"]
            if n["type"] == "MATCH_PENDING" and not n["read"]
        ]
        assert pending, body["notifications"]

        TestNotificationLifecycle._notif_id = pending[0]["notif_id"]

    def test_03_submitter_has_no_pending_for_own_match(self):
        with _as_submitter() as client:
            resp = client.get("/api/v1/notifications")
        assert resp.status_code == 200
        body = resp.json()

        assert not any(
            n["type"] == "MATCH_PENDING" and not n["read"]
            for n in body["notifications"]
        )

    def test_04_mark_single_notification_read(self):
        notif_id = TestNotificationLifecycle._notif_id
        assert notif_id is not None

        with _as_recipient() as client:
            resp = client.post(f"/api/v1/notifications/{notif_id}/read")
            assert resp.status_code == 204

            resp = client.get("/api/v1/notifications")
        body = resp.json()
        match = next(n for n in body["notifications"] if n["notif_id"] == notif_id)
        assert match["read"] is True

    def test_05_mark_all_read_zeroes_unread_count(self):
        with _as_recipient() as client:
            resp = client.post("/api/v1/notifications/read-all")
            assert resp.status_code == 204

            resp = client.get("/api/v1/notifications")
        body = resp.json()
        assert body["unread_count"] == 0
        assert all(n["read"] for n in body["notifications"])

    def test_06_unknown_notif_id_returns_404(self):
        with _as_recipient() as client:
            resp = client.post("/api/v1/notifications/does-not-exist/read")
        assert resp.status_code == 404
