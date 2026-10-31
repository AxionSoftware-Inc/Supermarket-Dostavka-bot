from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.crud import get_products, get_product_by_id, create_product, update_product
from app.schemas import ProductResponse, ProductCreate

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
async def list_products(
    category_id: Optional[int] = Query(None),
    q: Optional[str] = Query(None),
    popular: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    products = await get_products(db, category_id=category_id, query=q, popular_only=popular)
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_single_product(product_id: int, db: AsyncSession = Depends(get_db)):
    prod = await get_product_by_id(db, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return prod

@router.post("", response_model=ProductResponse)
async def add_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    prod = await create_product(db, product_in)
    return prod

@router.patch("/{product_id}", response_model=ProductResponse)
async def patch_product(product_id: int, updates: dict, db: AsyncSession = Depends(get_db)):
    prod = await update_product(db, product_id, updates)
    if not prod:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return prod
