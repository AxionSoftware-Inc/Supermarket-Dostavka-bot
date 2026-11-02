from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Order, Product, Courier, Customer
from app.crud import get_store_settings, get_courier_by_telegram_id
from app.schemas import StoreSettingsResponse
from app.config import ADMIN_USERNAMES, ADMIN_TELEGRAM_IDS

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/check-role")
async def check_user_role(
    telegram_id: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns user's role: 'admin' | 'courier' | 'client'
    - 'Software_engineerings' or ADMIN_TELEGRAM_IDS -> 'admin'
    - Registered courier by telegram_id or username -> 'courier'
    - All other users -> 'client'
    """
    clean_username = (username or "").strip().lstrip("@").lower()
    
    # 1. Admin check
    if clean_username and clean_username in ADMIN_USERNAMES:
        return {"role": "admin", "is_admin": True, "is_courier": False}
    
    if telegram_id and str(telegram_id).isdigit() and int(telegram_id) in ADMIN_TELEGRAM_IDS:
        return {"role": "admin", "is_admin": True, "is_courier": False}

    # 2. Courier check
    if telegram_id:
        courier = await get_courier_by_telegram_id(db, str(telegram_id))
        if courier and courier.is_active:
            return {"role": "courier", "is_admin": False, "is_courier": True, "courier_id": courier.id}

    if clean_username:
        res = await db.execute(select(Courier).where(Courier.username.ilike(clean_username)))
        courier = res.scalar_one_or_none()
        if courier and courier.is_active:
            return {"role": "courier", "is_admin": False, "is_courier": True, "courier_id": courier.id}

    # 3. Default regular customer
    return {"role": "client", "is_admin": False, "is_courier": False}

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
