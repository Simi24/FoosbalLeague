import json
import os
from enum import Enum


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Settings:
    settings: dict = {}

    def __init__(self, config_file: str = "config.json"):
        self.settings = {}
        self.settings.update(
            {
                "app_name": os.getenv("APP_NAME", "foosball-league"),
                "log_level": os.getenv("LOG_LEVEL", "INFO"),
                "env": os.getenv("ENV", "local"),
                "is_app_name_log_filtered": os.getenv(
                    "IS_APP_NAME_LOG_FILTERED", "True"
                ).lower()
                == "true",
            }
        )

        if os.path.exists(config_file):
            with open(config_file, "r") as file:
                try:
                    json_config = json.load(file)
                    self.settings.update(json_config)
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON config: {e}")

    def __getattr__(self, name):
        if hasattr(super(), name):
            return getattr(super(), name)
        elif name in self.settings:
            return self.settings[name]
        else:
            raise AttributeError(f"'Settings' object has no attribute '{name}'")

    def get(self, name, default=None):
        if hasattr(super(), name):
            return getattr(super(), name)
        elif name in self.settings:
            return self.settings[name]
        else:
            return default


settings = Settings()
