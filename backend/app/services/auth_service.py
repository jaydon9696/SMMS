from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, Token, UserRead


class AuthService:
    def __init__(self, user_repository: UserRepository | None = None) -> None:
        self.user_repository = user_repository or UserRepository()

    def authenticate(self, db: Session, login_data: LoginRequest) -> User:
        user = self.user_repository.get_by_email(db, login_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        return user

    def create_tokens(self, user: User) -> Token:
        settings = get_settings()
        access_token = create_access_token(
            subject=str(user.id),
            settings=settings,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = create_refresh_token(subject=str(user.id), settings=settings)
        return Token(access_token=access_token, refresh_token=refresh_token)

    def login(self, db: Session, login_data: LoginRequest) -> Token:
        user = self.authenticate(db, login_data)
        return self.create_tokens(user)

    def get_user(self, db: Session, user_id: str) -> UserRead:
        user = self.user_repository.get(db, user_id)
        if not user or user.deleted_at or not user.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return UserRead.model_validate(user)

    def seed_admin_user(self, db: Session) -> User:
        settings = get_settings()
        existing = self.user_repository.get_by_email(db, settings.ADMIN_EMAIL)
        if existing:
            return existing
        user = self.user_repository.create(
            db,
            {
                "name": settings.ADMIN_NAME,
                "email": settings.ADMIN_EMAIL,
                "password_hash": get_password_hash(settings.ADMIN_PASSWORD),
                "role": "admin",
                "is_active": True,
            },
        )
        return user
