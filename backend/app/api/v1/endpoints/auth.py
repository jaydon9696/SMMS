from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import AdminUser, CurrentUser, DbDep, get_current_user
from app.db.session import get_db
from app.schemas.auth import LoginRequest, Token, UserRead
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=ApiResponse[Token], status_code=status.HTTP_200_OK)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService()
    token = service.login(db, data)
    return ApiResponse(data=token)


@router.post("/refresh", response_model=ApiResponse[Token])
def refresh_token(current_user: AdminUser, db: DbDep):
    service = AuthService()
    token = service.create_tokens(current_user)
    return ApiResponse(data=token)


@router.get("/me", response_model=ApiResponse[UserRead])
def get_me(user: CurrentUser):
    return ApiResponse(data=UserRead.model_validate(user))


@router.post("/logout", response_model=ApiResponse[dict])
def logout():
    return ApiResponse(data={"message": "Logged out"})
