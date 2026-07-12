from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.table import RestaurantTable
from app.repositories.order_repository import OrderRepository
from app.repositories.table_repository import TableRepository
from app.schemas.table import TableCreate, TableUpdate


class TableService:
    def __init__(
        self,
        table_repository: TableRepository | None = None,
        order_repository: OrderRepository | None = None,
    ) -> None:
        self.table_repository = table_repository or TableRepository()
        self.order_repository = order_repository or OrderRepository()

    def create_table(self, db: Session, data: TableCreate) -> RestaurantTable:
        existing = self.table_repository.get_by_number(db, data.number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table number {data.number} already exists",
            )
        return self.table_repository.create(db, data.model_dump())

    def ensure_standing_table(self, db: Session) -> RestaurantTable:
        standing = self.table_repository.get_standing(db)
        if standing:
            return standing
        return self.table_repository.create(
            db,
            {
                "number": 0,
                "is_standing": True,
                "is_active": True,
            },
        )

    def list_tables(self, db: Session) -> list[RestaurantTable]:
        return self.table_repository.get_active_tables(db)

    def get_table(self, db: Session, table_id: UUID) -> RestaurantTable:
        table = self.table_repository.get(db, table_id)
        if not table or table.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
        return table

    def get_table_by_number(self, db: Session, number: int) -> RestaurantTable:
        table = self.table_repository.get_by_number(db, number)
        if not table or table.deleted_at or not table.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
        return table

    def update_table(self, db: Session, table_id: UUID, data: TableUpdate) -> RestaurantTable:
        table = self.get_table(db, table_id)
        if data.number is not None and data.number != table.number:
            existing = self.table_repository.get_by_number(db, data.number)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Table number {data.number} already exists",
                )
        return self.table_repository.update(db, table, data.model_dump(exclude_unset=True))

    def delete_table(self, db: Session, table_id: UUID) -> RestaurantTable:
        table = self.get_table(db, table_id)
        return self.table_repository.soft_delete(db, table)

    def get_table_statuses(self, db: Session) -> list[dict]:
        tables = self.list_tables(db)
        result = []
        for table in tables:
            active_orders = self.order_repository.get_by_table(db, table.id, active_only=True)
            status = None
            order_id = None
            total = None
            if active_orders:
                order = active_orders[0]
                status = order.status
                order_id = order.id
                total = order.total_amount
            result.append(
                {
                    "id": table.id,
                    "number": table.number,
                    "is_standing": table.is_standing,
                    "is_active": table.is_active,
                    "status": status,
                    "order_id": order_id,
                    "total_amount": total,
                }
            )
        return result

    def get_or_create_table_by_number(self, db: Session, number: int) -> RestaurantTable:
        try:
            return self.get_table_by_number(db, number)
        except HTTPException:
            return self.create_table(
                db,
                TableCreate(number=number, is_standing=False, is_active=True),
            )

    def get_standing_table(self, db: Session) -> RestaurantTable:
        table = self.table_repository.get_standing(db)
        if not table or table.deleted_at or not table.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standing order not configured")
        return table
