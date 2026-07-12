from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DbSession
from app.models.table import RestaurantTable
from app.schemas.common import ApiResponse
from app.schemas.table import TableCreate, TableResponse, TableUpdate

router = APIRouter()


@router.get("", response_model=ApiResponse[list[TableResponse]])
async def list_tables(
    session: DbSession, user: CurrentUser
) -> ApiResponse[list[TableResponse]]:
    tables = await session.scalars(
        select(RestaurantTable)
        .where(
            RestaurantTable.mess_id == user.mess_id,
            RestaurantTable.deleted_at.is_(None),
        )
        .order_by(RestaurantTable.number)
    )
    return ApiResponse(data=[TableResponse.model_validate(table) for table in tables])


@router.post("", response_model=ApiResponse[TableResponse], status_code=201)
async def create_table(
    payload: TableCreate, session: DbSession, user: CurrentUser
) -> ApiResponse[TableResponse]:
    table = RestaurantTable(mess_id=user.mess_id, **payload.model_dump())
    session.add(table)
    await session.commit()
    await session.refresh(table)
    return ApiResponse(data=TableResponse.model_validate(table))


@router.patch("/{table_id}", response_model=ApiResponse[TableResponse])
async def update_table(
    table_id: UUID, payload: TableUpdate, session: DbSession, user: CurrentUser
) -> ApiResponse[TableResponse]:
    table = await session.scalar(
        select(RestaurantTable).where(
            RestaurantTable.id == table_id,
            RestaurantTable.mess_id == user.mess_id,
            RestaurantTable.deleted_at.is_(None),
        )
    )
    if table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(table, field, value)
    await session.commit()
    await session.refresh(table)
    return ApiResponse(data=TableResponse.model_validate(table))


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table(table_id: UUID, session: DbSession, user: CurrentUser) -> Response:
    table = await session.scalar(
        select(RestaurantTable).where(
            RestaurantTable.id == table_id,
            RestaurantTable.mess_id == user.mess_id,
            RestaurantTable.deleted_at.is_(None),
        )
    )
    if table is None:
        raise HTTPException(status_code=404, detail="Table not found")
    table.deleted_at = datetime.now(UTC)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
