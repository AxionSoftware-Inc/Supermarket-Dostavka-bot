from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.crud import (
    get_couriers,
    get_courier_by_id,
    create_or_update_courier,
    delete_courier,
    get_customer_by_telegram_id
)
from app.schemas import CourierResponse, CourierCreate

router = APIRouter(prefix="/api/couriers", tags=["Couriers"])

@router.get("", response_model=List[CourierResponse])
async def list_couriers(
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    return await get_couriers(db, active_only=active_only)

@router.get("/{courier_id}", response_model=CourierResponse)
async def get_courier(courier_id: int, db: AsyncSession = Depends(get_db)):
    c = await get_courier_by_id(db, courier_id)
    if not c:
        raise HTTPException(status_code=404, detail="Kuryer topilmadi")
    return c

@router.post("", response_model=CourierResponse)
async def save_courier(courier_in: CourierCreate, db: AsyncSession = Depends(get_db)):
    # If phone or username provided, check if we can auto-fill telegram_id from registered customers
    data = courier_in.model_dump()
    c = await create_or_update_courier(db, data)
    return c

@router.delete("/{courier_id}")
async def remove_courier(courier_id: int, db: AsyncSession = Depends(get_db)):
    success = await delete_courier(db, courier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Kuryer topilmadi")
    return {"status": "ok", "message": "Kuryer o'chirildi"}
