from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class AWSAPIGatewayMiddleware(BaseHTTPMiddleware):
    """
    Handles the FastAPI path and root_path dynamically from the ASGI request data.
    Mangum injects the AWS event data which we can use to dynamically set the path
    and root_path.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self.app = app

    async def dispatch(self, request: Request, call_next) -> Response:
        aws_request_event = request.scope.get("aws.event")
        if aws_request_event:
            stage = aws_request_event["requestContext"]["stage"]
            if stage != "$default":
                stage_path = f"/{stage}"
                self.app.root_path = stage_path
                request.scope["root_path"] = stage_path
                request.scope["path"] = f"/{aws_request_event['pathParameters']['proxy']}"

        response = await call_next(request)
        return response
