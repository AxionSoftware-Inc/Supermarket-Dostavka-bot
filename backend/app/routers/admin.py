from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Order, Product, Courier
from app.crud import get_store_settings
from app.schemas import StoreSettingsResponse

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Total orders
    total_orders_res = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_res.scalar() or 0

    # Total revenue
    total_rev_res = await db.execute(
        select(func.sum(Order.total_amount)).where(Order.status != "bekor")
    )
    total_revenue = total_rev_res.scalar() or 0.0

    # Active orders (not yet delivered or cancelled)
    active_orders_res = await db.execute(
        select(func.count(Order.id)).where(Order.status.in_(["yangi", "tasdiqlandi", "yigilyapti", "kuryerda"]))
    )
    active_orders = active_orders_res.scalar() or 0

    # Total products count
    products_count_res = await db.execute(select(func.count(Product.id)))
    products_count = products_count_res.scalar() or 0

    # Total couriers
    couriers_count_res = await db.execute(select(func.count(Courier.id)))
    couriers_count = couriers_count_res.scalar() or 0

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "active_orders": active_orders,
        "products_count": products_count,
        "couriers_count": couriers_count
    }

@router.get("/settings", response_model=StoreSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    return await get_store_settings(db)
