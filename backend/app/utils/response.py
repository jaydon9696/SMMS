from fastapi import Request
from fastapi.responses import JSONResponse

from app.schemas.common import ApiResponse


def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content=ApiResponse(success=False, message="Resource not found").model_dump(),
    )


def validation_error_handler(request: Request, exc: Exception) -> JSONResponse:
    message = "Validation error"
    if hasattr(exc, "errors"):
        message = str(exc.errors())
    return JSONResponse(
        status_code=422,
        content=ApiResponse(success=False, message=message).model_dump(),
    )
