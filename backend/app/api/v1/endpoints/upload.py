from fastapi import APIRouter, UploadFile

from app.api.deps import AdminUser, DbDep
from app.schemas.common import ApiResponse
from app.services.upload_service import UploadService

router = APIRouter()


@router.post("/image", response_model=ApiResponse[dict])
def upload_image(db: DbDep, user: AdminUser, file: UploadFile):
    service = UploadService()
    url = service.upload_image(file)
    return ApiResponse(data={"url": url})
