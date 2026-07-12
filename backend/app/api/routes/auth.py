from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DbSession
from app.core.security import create_access_token, verify_password
from app.models.mess import Mess
from app.models.user import User
from app.schemas.auth import CurrentUserResponse, TokenResponse
from app.schemas.common import ApiResponse

router = APIRouter()


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(
    session: DbSession, form: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> ApiResponse[TokenResponse]:
    user = await session.scalar(
        select(User)
        .join(Mess)
        .where(
            User.email == form.username.lower(),
            User.is_active.is_(True),
            User.deleted_at.is_(None),
            Mess.is_active.is_(True),
            Mess.deleted_at.is_(None),
        )
    )
    if user is None or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(str(user.id))
    return ApiResponse(data=TokenResponse(access_token=token))


@router.get("/me", response_model=ApiResponse[CurrentUserResponse])
async def me(user: CurrentUser) -> ApiResponse[CurrentUserResponse]:
    return ApiResponse(data=CurrentUserResponse.model_validate(user, from_attributes=True))
