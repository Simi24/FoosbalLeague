"""GDPR data export schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ExportMetadata(BaseModel):
    exported_at: datetime
    format_version: str
    service: str

    model_config = ConfigDict(extra="forbid")


class AccountInfo(BaseModel):
    player_id: str
    display_name: str
    email: str
    created_at: datetime | None
    deleted: bool

    model_config = ConfigDict(extra="forbid")


class StatsInfo(BaseModel):
    total_matches: int
    total_wins: int
    total_losses: int

    model_config = ConfigDict(extra="forbid")


class UserDataExport(BaseModel):
    """Domain-level export of a user's personal data (GDPR art. 15/20)."""

    export_metadata: ExportMetadata
    account: AccountInfo
    stats: StatsInfo
    leagues: list[dict[str, Any]]
    matches: list[dict[str, Any]]
    elo_history: list[dict[str, Any]]
    achievements: list[dict[str, Any]]
    preferences: dict[str, Any]

    model_config = ConfigDict(extra="forbid")
