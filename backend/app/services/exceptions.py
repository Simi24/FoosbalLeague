"""Domain exceptions for service-layer error handling."""


class MatchNotFoundError(Exception):
    """Raised when a match does not exist or is not in PENDING status."""

    def __init__(self, match_id: str) -> None:
        self.match_id = match_id
        super().__init__(f"Match {match_id} not found or not pending")


class MissingRatingsError(Exception):
    """Raised when one or both teams lack rating records needed for ELO calculation."""

    def __init__(self, match_id: str) -> None:
        self.match_id = match_id
        super().__init__(f"Missing ratings for one or more players in match {match_id}")
