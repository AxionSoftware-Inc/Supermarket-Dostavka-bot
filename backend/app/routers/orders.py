from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.crud import (
    create_order,
    get_order_by_id,
    get_order_by_number,
    get_orders,
    update_order_status
)
from app.schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from app.bot.handlers import notify_customer_new_order, notify_customer_status_change

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse)
async def place_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Savatcha bo'sh bo'lishi mumkin emas")

    order = await create_order(db, order_in)
    # Background task to send Telegram notification to customer
    background_tasks.add_task(notify_customer_new_order, order)
    return order

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    status: Optional[str] = Query(None),
    telegram_user_id: Optional[str] = Query(None),
    courier_id: Optional[int] = Query(None),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db)
):
    orders = await get_orders(
        db,
        status=status,
        telegram_user_id=telegram_user_id,
        courier_id=courier_id,
        limit=limit
    )
    return orders

@router.get("/track/{order_number}", response_model=OrderResponse)
async def track_order(order_number: str, db: AsyncSession = Depends(get_db)):
    order = await get_order_by_number(db, order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Bunday raqamli buyurtma topilmadi")
    return order

@router.get("/{order_id}", response_model=OrderResponse)
async def get_single_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def change_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    order = await update_order_status(db, order_id, status_in)
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    # Send status change notification to customer
    background_tasks.add_task(notify_customer_status_change, order)
    return order
