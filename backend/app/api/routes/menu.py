from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.api.dependencies import CurrentUser, DbSession
from app.core.config import settings
from app.models.menu import MenuCategory, MenuItem
from app.repositories.menu import MenuRepository
from app.schemas.common import ApiResponse
from app.schemas.menu import (
    ImageUploadResponse,
    MenuCategoryCreate,
    MenuCategoryResponse,
    MenuCategoryUpdate,
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
)

router = APIRouter()

MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post(
    "/images",
    response_model=ApiResponse[ImageUploadResponse],
    status_code=status.HTTP_201_CREATED,
)
async def upload_menu_image(
    user: CurrentUser, image: Annotated[UploadFile, File()]
) -> ApiResponse[ImageUploadResponse]:
    if settings.cloudinary_url is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image storage is not configured",
        )
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG and WebP images are allowed")
    contents = await image.read(MAX_IMAGE_SIZE + 1)
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")

    cloudinary.config(cloudinary_url=settings.cloudinary_url, secure=True)
    result = await run_in_threadpool(
        cloudinary.uploader.upload,
        contents,
        folder=f"smms/{user.mess_id}/menu",
        resource_type="image",
        overwrite=False,
    )
    return ApiResponse(
        data=ImageUploadResponse(
            url=result["secure_url"],
            public_id=result["public_id"],
        )
    )


@router.get("/categories", response_model=ApiResponse[list[MenuCategoryResponse]])
async def list_categories(
    session: DbSession, user: CurrentUser
) -> ApiResponse[list[MenuCategoryResponse]]:
    categories = await MenuRepository(session).list_categories(user.mess_id)
    return ApiResponse(
        data=[MenuCategoryResponse.model_validate(category) for category in categories]
    )


@router.post(
    "/categories",
    response_model=ApiResponse[MenuCategoryResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    payload: MenuCategoryCreate, session: DbSession, user: CurrentUser
) -> ApiResponse[MenuCategoryResponse]:
    category = MenuCategory(mess_id=user.mess_id, **payload.model_dump())
    session.add(category)
    await session.commit()
    await session.refresh(category, attribute_names=["items"])
    return ApiResponse(data=MenuCategoryResponse.model_validate(category))


@router.patch("/categories/{category_id}", response_model=ApiResponse[MenuCategoryResponse])
async def update_category(
    category_id: UUID,
    payload: MenuCategoryUpdate,
    session: DbSession,
    user: CurrentUser,
) -> ApiResponse[MenuCategoryResponse]:
    repository = MenuRepository(session)
    category = await repository.get_category(user.mess_id, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    await session.commit()
    categories = await repository.list_categories(user.mess_id)
    updated = next(item for item in categories if item.id == category_id)
    return ApiResponse(data=MenuCategoryResponse.model_validate(updated))


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID, session: DbSession, user: CurrentUser
) -> Response:
    category = await MenuRepository(session).get_category(user.mess_id, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    category.deleted_at = datetime.now(UTC)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/items",
    response_model=ApiResponse[MenuItemResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    payload: MenuItemCreate, session: DbSession, user: CurrentUser
) -> ApiResponse[MenuItemResponse]:
    repository = MenuRepository(session)
    if await repository.get_category(user.mess_id, payload.category_id) is None:
        raise HTTPException(status_code=404, detail="Category not found")
    values = payload.model_dump()
    if payload.image_url is not None:
        values["image_url"] = str(payload.image_url)
    item = MenuItem(**values)
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return ApiResponse(data=MenuItemResponse.model_validate(item))


@router.patch("/items/{item_id}", response_model=ApiResponse[MenuItemResponse])
async def update_item(
    item_id: UUID, payload: MenuItemUpdate, session: DbSession, user: CurrentUser
) -> ApiResponse[MenuItemResponse]:
    repository = MenuRepository(session)
    item = await repository.get_item(user.mess_id, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    values = payload.model_dump(exclude_unset=True)
    if "category_id" in values and (
        await repository.get_category(user.mess_id, values["category_id"]) is None
    ):
        raise HTTPException(status_code=404, detail="Category not found")
    if payload.image_url is not None:
        values["image_url"] = str(payload.image_url)
    for field, value in values.items():
        setattr(item, field, value)
    await session.commit()
    await session.refresh(item)
    return ApiResponse(data=MenuItemResponse.model_validate(item))


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: UUID, session: DbSession, user: CurrentUser) -> Response:
    item = await MenuRepository(session).get_item(user.mess_id, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    item.deleted_at = datetime.now(UTC)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
