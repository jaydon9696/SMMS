from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


class UploadService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _is_configured(self) -> bool:
        return bool(
            self.settings.CLOUDINARY_CLOUD_NAME
            and self.settings.CLOUDINARY_API_KEY
            and self.settings.CLOUDINARY_API_SECRET
        )

    def upload_image(self, file: UploadFile) -> str:
        if not self._is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, API_KEY and API_SECRET.",
            )
        try:
            import cloudinary
            import cloudinary.uploader

            cloudinary.config(
                cloud_name=self.settings.CLOUDINARY_CLOUD_NAME,
                api_key=self.settings.CLOUDINARY_API_KEY,
                api_secret=self.settings.CLOUDINARY_API_SECRET,
            )
            result = cloudinary.uploader.upload(file.file, folder="smms/menu")
            return result.get("secure_url", result["url"])
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {exc}",
            ) from exc
