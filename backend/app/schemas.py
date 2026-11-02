from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Customer Profile Schemas
class CustomerBase(BaseModel):
    telegram_id: str
    username: Optional[str] = None
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class CustomerCreateOrUpdate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name_uz: str
    name_ru: str
    icon: Optional[str] = "📦"
    image_url: Optional[str] = None
    sort_order: Optional[int] = 0
    is_active: Optional[bool] = True

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    category_id: int
    name_uz: str
    name_ru: str
    description: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    unit: Optional[str] = "dona"
    image_url: Optional[str] = None
    is_popular: Optional[bool] = False
    is_available: Optional[bool] = True
    stock: Optional[int] = 100

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Courier Schemas
class CourierBase(BaseModel):
    telegram_id: Optional[str] = None
    username: Optional[str] = None
    name: str
    phone: str
    vehicle_type: Optional[str] = "car"
    is_active: Optional[bool] = True

class CourierCreate(CourierBase):
    pass

class CourierResponse(CourierBase):
    id: int
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

    class Config:
        from_attributes = True

# Order Item Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: float

class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    price: float
    quantity: float
    unit: str
    subtotal: float

    class Config:
        from_attributes = True

# Order Schemas
class OrderCreate(BaseModel):
    telegram_user_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    delivery_address: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_notes: Optional[str] = None
    payment_method: str = "naqd" # naqd, click, payme, terminal
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: str # yangi, tasdiqlandi, yigilyapti, kuryerda, yetkazildi, bekor
    courier_id: Optional[int] = None

class OrderResponse(BaseModel):
    id: int
    order_number: str
    telegram_user_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    delivery_address: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_notes: Optional[str] = None
    payment_method: str
    payment_status: str
    items_total: float
    delivery_fee: float
    discount_amount: float
    total_amount: float
    status: str
    courier_id: Optional[int] = None
    courier: Optional[CourierResponse] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Settings Schemas
class StoreSettingsResponse(BaseModel):
    store_name: str
    phone: str
    address: str
    is_open: bool
    min_order_amount: float
    free_delivery_threshold: float
    base_delivery_fee: float
    delivery_time_text: str

    class Config:
        from_attributes = True
