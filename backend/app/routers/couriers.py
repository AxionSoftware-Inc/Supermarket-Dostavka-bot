from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.crud import get_couriers, get_courier_by_id
from app.schemas import CourierResponse

router = APIRouter(prefix="/api/couriers", tags=["Couriers"])

@router.get("", response_model=List[CourierResponse])
async def list_couriers(db: AsyncSession = Depends(get_db)):
    return await get_couriers(db)

@router.get("/{courier_id}", response_model=CourierResponse)
async def get_courier(courier_id: int, db: AsyncSession = Depends(get_db)):
    c = await get_courier_by_id(db, courier_id)
    if not c:
        raise HTTPException(status_code=404, detail="Kuryer topilmadi")
    return c
