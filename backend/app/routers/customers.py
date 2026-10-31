from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.crud import get_customer_by_telegram_id, sync_customer_profile
from app.schemas import CustomerResponse, CustomerCreateOrUpdate

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/{telegram_id}", response_model=CustomerResponse)
async def get_customer_profile(telegram_id: str, db: AsyncSession = Depends(get_db)):
    cust = await get_customer_by_telegram_id(db, telegram_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Mijoz profili hali yaratilmagan")
    return cust

@router.post("", response_model=CustomerResponse)
async def update_profile(profile_in: CustomerCreateOrUpdate, db: AsyncSession = Depends(get_db)):
    cust = await sync_customer_profile(db, profile_in)
    return cust
