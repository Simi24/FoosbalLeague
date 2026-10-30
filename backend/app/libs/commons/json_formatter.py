import json
import logging
from datetime import UTC, datetime
from typing import Any


class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging to stdout/CloudWatch."""

    def __init__(self, fmt_keys: dict[str, str] | None = None, **kwargs: Any) -> None:
        super().__init__()
        self.fmt_keys = fmt_keys or {}

    def format(self, record: logging.LogRecord) -> str:
        log_record = self._build_log_record(record)
        return json.dumps(log_record, default=str)

    def _build_log_record(self, record: logging.LogRecord) -> dict[str, Any]:
        log_record: dict[str, Any] = {
            "message": record.getMessage(),
            "timestamp": datetime.fromtimestamp(
                record.created, tz=UTC
            ).isoformat(),
        }

        for key, attr in self.fmt_keys.items():
            log_record[key] = getattr(record, attr, None)

        if record.exc_info and record.exc_info[1]:
            log_record["exception"] = self.formatException(record.exc_info)

        if record.stack_info:
            log_record["stack_info"] = self.formatStack(record.stack_info)

        return log_record
