from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self) -> None:
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None),
            User.is_active.is_(True),
        ).first()
