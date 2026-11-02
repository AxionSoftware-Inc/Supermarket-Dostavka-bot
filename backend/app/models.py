from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String(50), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=True, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    address = Column(String(300), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name_uz = Column(String(100), nullable=False)
    name_ru = Column(String(100), nullable=False)
    icon = Column(String(50), default="📦")
    image_url = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    name_uz = Column(String(200), nullable=False, index=True)
    name_ru = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False) # narx (so'm)
    discount_price = Column(Float, nullable=True) # aksiya narxi
    unit = Column(String(30), default="dona") # kg, dona, litr, qadoq
    image_url = Column(String(500), nullable=True)
    is_popular = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    stock = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

class Courier(Base):
    __tablename__ = "couriers"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String(50), unique=True, nullable=True)
    username = Column(String(100), nullable=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    vehicle_type = Column(String(50), default="car") # car, moto, bike, walking
    is_active = Column(Boolean, default=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

    orders = relationship("Order", back_populates="courier")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, index=True)
    
    # Customer
    telegram_user_id = Column(String(50), nullable=True, index=True)
    customer_name = Column(String(150), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    
    # Location
    delivery_address = Column(String(300), nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    
    # Payment & Finance
    payment_method = Column(String(30), default="naqd") # naqd, click, payme, terminal
    payment_status = Column(String(30), default="kutilmoqda") # kutilmoqda, tolandi, bekor
    items_total = Column(Float, nullable=False, default=0.0)
    delivery_fee = Column(Float, nullable=False, default=15000.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)

    # Status: yangi, tasdiqlandi, yigilyapti, kuryerda, yetkazildi, bekor
    status = Column(String(30), default="yangi", index=True)
    
    # Courier
    courier_id = Column(Integer, ForeignKey("couriers.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    courier = relationship("Courier", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(200), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(30), default="dona")
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True)
    store_name = Column(String(100), default="Korzinka Supermarket")
    phone = Column(String(30), default="+998 78 140 14 14")
    address = Column(String(200), default="Toshkent shahri")
    is_open = Column(Boolean, default=True)
    min_order_amount = Column(Float, default=30000.0)
    free_delivery_threshold = Column(Float, default=150000.0)
    base_delivery_fee = Column(Float, default=15000.0)
    delivery_time_text = Column(String(50), default="25 - 40 daqiqa")
