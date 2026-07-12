from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.mess import Mess
from app.models.user import User

DbSession = Annotated[AsyncSession, Depends(get_db)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


async def get_current_user(
    session: DbSession, token: Annotated[str, Depends(oauth2_scheme)]
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = UUID(decode_access_token(token))
    except (ValueError, jwt.InvalidTokenError) as exc:
        raise credentials_error from exc
    user = await session.scalar(
        select(User).where(
            User.id == user_id,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )
    if user is None:
        raise credentials_error
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_default_mess(session: DbSession) -> Mess:
    mess = await session.scalar(
        select(Mess).where(Mess.is_active.is_(True), Mess.deleted_at.is_(None)).limit(1)
    )
    if mess is None:
        raise HTTPException(status_code=503, detail="Mess is not configured")
    return mess


DefaultMess = Annotated[Mess, Depends(get_default_mess)]
