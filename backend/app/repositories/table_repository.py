from sqlalchemy.orm import Session

from app.models.table import RestaurantTable
from app.repositories.base import BaseRepository


class TableRepository(BaseRepository[RestaurantTable]):
    def __init__(self) -> None:
        super().__init__(RestaurantTable)

    def get_by_number(self, db: Session, number: int) -> RestaurantTable | None:
        return db.query(RestaurantTable).filter(
            RestaurantTable.number == number,
            RestaurantTable.deleted_at.is_(None),
        ).first()

    def get_standing(self, db: Session) -> RestaurantTable | None:
        return db.query(RestaurantTable).filter(
            RestaurantTable.is_standing.is_(True),
            RestaurantTable.deleted_at.is_(None),
        ).first()

    def get_active_tables(self, db: Session) -> list[RestaurantTable]:
        return db.query(RestaurantTable).filter(
            RestaurantTable.deleted_at.is_(None),
            RestaurantTable.is_active.is_(True),
        ).order_by(RestaurantTable.is_standing, RestaurantTable.number).all()
