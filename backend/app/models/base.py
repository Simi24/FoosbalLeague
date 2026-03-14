"""Base entity for single-table DynamoDB design using dynantic."""

import os
from datetime import datetime
from typing import Any

from pydantic import model_validator

from dynantic import Discriminator, DynamoModel, GSIKey, GSISortKey, Key, SortKey

TABLE_NAME = os.getenv("DYNAMODB_TABLE", "foosball-league")

_GSI_FIELDS = ("gsi1_pk", "gsi1_sk", "gsi3_pk", "gsi3_sk")


class BaseEntity(DynamoModel):
    """Base model for all entities in the foosball-league table.

    Single-table design with polymorphism via Discriminator.
    GSI1: League-centric queries (matches by league, leaderboard, enrollments)
    GSI3: Email lookup
    """

    pk: str = Key()
    sk: str = SortKey()
    entity_type: str = Discriminator()

    gsi1_pk: str | None = GSIKey(index_name="GSI1", default=None)
    gsi1_sk: str | None = GSISortKey(index_name="GSI1", default=None)
    gsi3_pk: str | None = GSIKey(index_name="GSI3", default=None)
    gsi3_sk: str | None = GSISortKey(index_name="GSI3", default=None)

    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _default_gsi_fields(cls, data: Any) -> Any:
        """Ensure GSI fields default to None when not provided.

        Workaround for dynantic returning Attr descriptors instead of None.
        """
        if isinstance(data, dict):
            for field in _GSI_FIELDS:
                if field not in data:
                    data[field] = None
        return data

    class Meta:
        table_name = TABLE_NAME
