from pydantic import BaseModel, ConfigDict, Field


class UserInfo(BaseModel):
    """Current authenticated user info from Cognito token."""

    sub: str = Field(..., description="Cognito user sub (unique ID)")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="Display name")
    groups: list[str] = Field(default_factory=list, description="Cognito groups")
    tenant_id: str = Field(default="default", description="Tenant ID")

    model_config = ConfigDict(extra="forbid")


class RegisterRequest(BaseModel):
    """Self-registration request (creates player from Cognito user)."""

    display_name: str = Field(..., min_length=2, max_length=50)

    model_config = ConfigDict(extra="forbid")


class RegisterResponse(BaseModel):
    """Registration response."""

    player_id: str
    display_name: str
    email: str
    tenant_id: str

    model_config = ConfigDict(extra="forbid")
