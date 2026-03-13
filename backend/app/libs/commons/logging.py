import json
import logging
import logging.config
import pathlib

from .config import settings


def set_logging_level(config: dict, level: str) -> dict:
    for handler in config["handlers"]:
        config["handlers"][handler]["level"] = level
    config["loggers"]["root"]["level"] = level
    return config


def setup_logging(config_path: str) -> None:
    config_file = pathlib.Path(config_path)
    if not config_file.exists():
        config_file = pathlib.Path(
            f"libs/commons/default_configs/logging/{settings.env}.json"
        )
    if not config_file.exists():
        config_file = pathlib.Path("libs/commons/default_configs/logging/prod.json")
    if not config_file.exists():
        logging.basicConfig(level=settings.log_level)
        return

    with open(config_file) as f_in:
        config = json.load(f_in)

    config = set_logging_level(config, settings.log_level)
    logging.config.dictConfig(config)


setup_logging(f"configs/{settings.env}.json")

logger = logging.getLogger(settings.app_name)
