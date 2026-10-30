"""Tenant entity - organization/company metadata."""

from pydantic import Field

from models.base import BaseEntity


@BaseEntity.register("TENANT")
class TenantModel(BaseEntity):
    """Tenant (organization) metadata.

    PK: TENANT#<tenant_id>
    SK: METADATA
    """

    tenant_id: str
    name: str
    settings: dict = Field(default_factory=dict)
