from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DbSession
from app.models.enums import OrderSource, OrderStatus
from app.models.order import Order, OrderItem
from app.repositories.order import OrderRepository
from app.schemas.common import ApiResponse
from app.schemas.dashboard import DailyReport, DashboardSummary, PaymentSummary, PopularItem

router = APIRouter()


@router.get("/summary", response_model=ApiResponse[DashboardSummary])
async def summary(
    session: DbSession, user: CurrentUser
) -> ApiResponse[DashboardSummary]:
    today = datetime.now(UTC).date()
    start, end = OrderRepository.day_bounds(today)
    rows = (
        await session.execute(
            select(
                Order.status,
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_amount), 0),
            )
            .where(
                Order.mess_id == user.mess_id,
                Order.created_at.between(start, end),
            )
            .group_by(Order.status)
        )
    ).all()
    status_counts = {status: count for status, count, _ in rows}
    revenue = sum(
        (amount for order_status, _, amount in rows if order_status == OrderStatus.COMPLETED),
        Decimal("0.00"),
    )
    occupied_tables = await session.scalar(
        select(func.count(func.distinct(Order.table_id))).where(
            Order.mess_id == user.mess_id,
            Order.table_id.is_not(None),
            Order.status.in_(
                [
                    OrderStatus.PENDING,
                    OrderStatus.ACCEPTED,
                    OrderStatus.PREPARING,
                    OrderStatus.READY,
                ]
            ),
        )
    )
    standing_orders = await session.scalar(
        select(func.count(Order.id)).where(
            Order.mess_id == user.mess_id,
            Order.source == OrderSource.STANDING,
            Order.status.in_(
                [
                    OrderStatus.PENDING,
                    OrderStatus.ACCEPTED,
                    OrderStatus.PREPARING,
                    OrderStatus.READY,
                ]
            ),
        )
    )
    data = DashboardSummary(
        business_date=today,
        revenue=revenue,
        orders=sum(status_counts.values()),
        pending=status_counts.get(OrderStatus.PENDING, 0),
        preparing=status_counts.get(OrderStatus.PREPARING, 0),
        ready=status_counts.get(OrderStatus.READY, 0),
        completed=status_counts.get(OrderStatus.COMPLETED, 0),
        occupied_tables=occupied_tables or 0,
        standing_orders=standing_orders or 0,
    )
    return ApiResponse(data=data)


@router.get("/reports/daily", response_model=ApiResponse[DailyReport])
async def daily_report(
    session: DbSession,
    user: CurrentUser,
    business_date: Annotated[date | None, Query()] = None,
) -> ApiResponse[DailyReport]:
    business_date = business_date or datetime.now(UTC).date()
    start, end = OrderRepository.day_bounds(business_date)
    filters = (
        Order.mess_id == user.mess_id,
        Order.created_at.between(start, end),
    )
    status_rows = (
        await session.execute(
            select(Order.status, func.count(Order.id)).where(*filters).group_by(Order.status)
        )
    ).all()
    payment_rows = (
        await session.execute(
            select(
                Order.payment_method,
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_amount), 0),
            )
            .where(*filters, Order.status == OrderStatus.COMPLETED)
            .group_by(Order.payment_method)
        )
    ).all()
    popular_rows = (
        await session.execute(
            select(
                OrderItem.item_name,
                func.sum(OrderItem.quantity),
                func.sum(OrderItem.line_total),
            )
            .join(Order)
            .where(*filters, Order.status != OrderStatus.CANCELLED)
            .group_by(OrderItem.item_name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(10)
        )
    ).all()
    payments = [
        PaymentSummary(method=method, orders=count, amount=amount)
        for method, count, amount in payment_rows
    ]
    return ApiResponse(
        data=DailyReport(
            business_date=business_date,
            revenue=sum((payment.amount for payment in payments), Decimal("0.00")),
            order_count=sum(count for _, count in status_rows),
            by_status={order_status: count for order_status, count in status_rows},
            payments=payments,
            popular_items=[
                PopularItem(name=name, quantity=quantity, revenue=revenue)
                for name, quantity, revenue in popular_rows
            ],
        )
    )
