"""Cognito admin operations client (lazy singleton)."""

import os

import boto3
from botocore.exceptions import ClientError

from libs.commons.logging import logger

COGNITO_REGION = os.getenv("COGNITO_REGION", "eu-west-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client("cognito-idp", region_name=COGNITO_REGION)
    return _client


def admin_delete_user(cognito_sub: str) -> None:
    """Delete a Cognito user by sub. Idempotent: missing user is logged and ignored."""
    if not COGNITO_USER_POOL_ID:
        logger.warning(
            "COGNITO_USER_POOL_ID not configured, skipping admin_delete_user"
        )
        return

    try:
        _get_client().admin_delete_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=cognito_sub,
        )
        logger.info(f"Deleted Cognito user {cognito_sub}")
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "UserNotFoundException":
            logger.info(f"Cognito user {cognito_sub} already gone, skipping")
            return
        raise
