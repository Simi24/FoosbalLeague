"""Base entity for single-table DynamoDB design using dynantic."""

import os
from datetime import datetime

from dynantic import Discriminator, DynamoModel, GSIKey, GSISortKey, Key, SortKey

TABLE_NAME = os.getenv("DYNAMODB_TABLE", "foosball-league")


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

    class Meta:
        table_name = TABLE_NAME
