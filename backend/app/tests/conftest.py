"""Root conftest — sets environment variables before any app import."""

import os

os.environ.setdefault("ENV", "local")
os.environ.setdefault("LOCAL", "true")
os.environ.setdefault("CLOUD_ENV", "local")
os.environ.setdefault("APP_NAME", "foosball-league")
os.environ.setdefault("DEFAULT_TENANT_ID", "default")
os.environ.setdefault("DYNAMODB_TABLE", "foosball-league")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")
os.environ.setdefault("LOG_LEVEL", "WARNING")
