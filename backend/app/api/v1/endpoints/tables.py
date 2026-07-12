from uuid import UUID

from fastapi import APIRouter

from app.api.deps import AdminUser, DbDep
from app.schemas.common import ApiResponse
from app.schemas.table import TableCreate, TableRead, TableStatusRead, TableUpdate
from app.services.table_service import TableService

router = APIRouter()


@router.get("", response_model=ApiResponse[list[TableStatusRead]])
def list_tables(db: DbDep):
    service = TableService()
    return ApiResponse(data=service.get_table_statuses(db))


@router.post("", response_model=ApiResponse[TableRead])
def create_table(data: TableCreate, db: DbDep, user: AdminUser):
    service = TableService()
    return ApiResponse(data=service.create_table(db, data))


@router.get("/{table_id}", response_model=ApiResponse[TableRead])
def get_table(table_id: UUID, db: DbDep):
    service = TableService()
    return ApiResponse(data=service.get_table(db, table_id))


@router.get("/number/{number}", response_model=ApiResponse[TableRead])
def get_table_by_number(number: int, db: DbDep):
    service = TableService()
    return ApiResponse(data=service.get_table_by_number(db, number))


@router.put("/{table_id}", response_model=ApiResponse[TableRead])
def update_table(table_id: UUID, data: TableUpdate, db: DbDep, user: AdminUser):
    service = TableService()
    return ApiResponse(data=service.update_table(db, table_id, data))


@router.delete("/{table_id}", response_model=ApiResponse[TableRead])
def delete_table(table_id: UUID, db: DbDep, user: AdminUser):
    service = TableService()
    return ApiResponse(data=service.delete_table(db, table_id))
