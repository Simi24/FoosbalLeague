"""Tenant service - business logic for tenant operations."""

from datetime import datetime, timezone

from libs.commons.logging import logger
from models.base import BaseEntity
from models.tenant import TenantModel


def get_tenant(tenant_id: str) -> TenantModel | None:
    """Get tenant metadata."""
    result = BaseEntity.get(f"TENANT#{tenant_id}", "METADATA")
    if result and isinstance(result, TenantModel):
        return result
    return None


def create_tenant(tenant_id: str, name: str) -> TenantModel:
    """Create a new tenant."""
    now = datetime.now(timezone.utc)
    tenant = TenantModel(
        pk=f"TENANT#{tenant_id}",
        sk="METADATA",
        tenant_id=tenant_id,
        name=name,
        created_at=now,
        updated_at=now,
    )
    tenant.save()
    logger.info(f"Created tenant {tenant_id} ({name})")
    return tenant
