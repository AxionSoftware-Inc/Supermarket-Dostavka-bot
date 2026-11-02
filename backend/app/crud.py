import random
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, desc
from sqlalchemy.orm import selectinload
from app.models import Category, Product, Order, OrderItem, Courier, StoreSettings, Customer
from app.schemas import OrderCreate, OrderStatusUpdate, ProductCreate, CategoryCreate, CustomerCreateOrUpdate

# --- Customers ---
async def get_customer_by_telegram_id(db: AsyncSession, telegram_id: str) -> Optional[Customer]:
    result = await db.execute(select(Customer).where(Customer.telegram_id == str(telegram_id)))
    return result.scalar_one_or_none()

async def sync_customer_profile(db: AsyncSession, profile: CustomerCreateOrUpdate) -> Customer:
    customer = await get_customer_by_telegram_id(db, profile.telegram_id)
    if not customer:
        customer = Customer(
            telegram_id=str(profile.telegram_id),
            username=profile.username,
            name=profile.name,
            phone=profile.phone,
            address=profile.address,
            lat=profile.lat,
            lng=profile.lng
        )
        db.add(customer)
    else:
        customer.name = profile.name or customer.name
        if profile.username:
            customer.username = profile.username
        if profile.phone:
            customer.phone = profile.phone
        if profile.address:
            customer.address = profile.address
        if profile.lat:
            customer.lat = profile.lat
        if profile.lng:
            customer.lng = profile.lng
        customer.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(customer)
    return customer

# --- Categories ---
async def get_categories(db: AsyncSession, only_active: bool = True) -> List[Category]:
    query = select(Category).order_by(Category.sort_order)
    if only_active:
        query = query.where(Category.is_active == True)
    result = await db.execute(query)
    return list(result.scalars().all())

async def get_category_by_id(db: AsyncSession, category_id: int) -> Optional[Category]:
    result = await db.execute(select(Category).where(Category.id == category_id))
    return result.scalar_one_or_none()

# --- Products ---
async def get_products(
    db: AsyncSession,
    category_id: Optional[int] = None,
    query: Optional[str] = None,
    popular_only: bool = False
) -> List[Product]:
    stmt = select(Product).where(Product.is_available == True)
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if popular_only:
        stmt = stmt.where(Product.is_popular == True)
    if query:
        search = f"%{query.lower()}%"
        stmt = stmt.where(
            (Product.name_uz.ilike(search)) |
            (Product.name_ru.ilike(search)) |
            (Product.description.ilike(search))
        )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_product_by_id(db: AsyncSession, product_id: int) -> Optional[Product]:
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()

async def create_product(db: AsyncSession, product_data: ProductCreate) -> Product:
    prod = Product(**product_data.model_dump())
    db.add(prod)
    await db.commit()
    await db.refresh(prod)
    return prod

async def update_product(db: AsyncSession, product_id: int, updates: dict) -> Optional[Product]:
    await db.execute(update(Product).where(Product.id == product_id).values(**updates))
    await db.commit()
    return await get_product_by_id(db, product_id)

# --- Store Settings ---
async def get_store_settings(db: AsyncSession) -> StoreSettings:
    result = await db.execute(select(StoreSettings))
    settings = result.scalars().first()
    if not settings:
        settings = StoreSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings

# --- Orders ---
def generate_order_number() -> str:
    timestamp = datetime.utcnow().strftime("%d%m")
    random_num = random.randint(1000, 9999)
    return f"KZ-{timestamp}-{random_num}"

async def create_order(db: AsyncSession, order_in: OrderCreate) -> Order:
    settings = await get_store_settings(db)
    
    # Calculate order total
    items_total = 0.0
    items_to_create = []

    for item in order_in.items:
        prod = await get_product_by_id(db, item.product_id)
        if not prod:
            continue
        price = prod.discount_price if prod.discount_price else prod.price
        subtotal = price * item.quantity
        items_total += subtotal

        order_item = OrderItem(
            product_id=prod.id,
            product_name=prod.name_uz,
            price=price,
            quantity=item.quantity,
            unit=prod.unit,
            subtotal=subtotal
        )
        items_to_create.append(order_item)

    # Delivery fee logic
    if items_total >= settings.free_delivery_threshold:
        delivery_fee = 0.0
    else:
        delivery_fee = settings.base_delivery_fee

    total_amount = items_total + delivery_fee

    new_order = Order(
        order_number=generate_order_number(),
        telegram_user_id=order_in.telegram_user_id,
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        delivery_address=order_in.delivery_address,
        delivery_lat=order_in.delivery_lat,
        delivery_lng=order_in.delivery_lng,
        delivery_notes=order_in.delivery_notes,
        payment_method=order_in.payment_method,
        payment_status="kutilmoqda",
        items_total=items_total,
        delivery_fee=delivery_fee,
        discount_amount=0.0,
        total_amount=total_amount,
        status="yangi",
        created_at=datetime.utcnow()
    )
    db.add(new_order)
    await db.flush()

    for item in items_to_create:
        item.order_id = new_order.id
        db.add(item)

    # Automatically save/update customer profile so they never have to re-enter
    if order_in.telegram_user_id:
        cust = await get_customer_by_telegram_id(db, order_in.telegram_user_id)
        if not cust:
            cust = Customer(
                telegram_id=str(order_in.telegram_user_id),
                name=order_in.customer_name,
                phone=order_in.customer_phone,
                address=order_in.delivery_address,
                lat=order_in.delivery_lat,
                lng=order_in.delivery_lng
            )
            db.add(cust)
        else:
            cust.name = order_in.customer_name
            cust.phone = order_in.customer_phone
            cust.address = order_in.delivery_address
            if order_in.delivery_lat:
                cust.lat = order_in.delivery_lat
            if order_in.delivery_lng:
                cust.lng = order_in.delivery_lng
            cust.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(new_order)
    
    # Reload with relationships
    return await get_order_by_id(db, new_order.id)

async def get_order_by_id(db: AsyncSession, order_id: int) -> Optional[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.courier))
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()

async def get_order_by_number(db: AsyncSession, order_number: str) -> Optional[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.courier))
        .where(Order.order_number == order_number)
    )
    return result.scalar_one_or_none()

async def get_orders(
    db: AsyncSession,
    status: Optional[str] = None,
    telegram_user_id: Optional[str] = None,
    courier_id: Optional[int] = None,
    limit: int = 50
) -> List[Order]:
    stmt = (
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.courier))
        .order_by(desc(Order.created_at))
        .limit(limit)
    )
    if status:
        stmt = stmt.where(Order.status == status)
    if telegram_user_id:
        stmt = stmt.where(Order.telegram_user_id == telegram_user_id)
    if courier_id:
        stmt = stmt.where(Order.courier_id == courier_id)

    result = await db.execute(stmt)
    return list(result.scalars().all())

async def update_order_status(db: AsyncSession, order_id: int, status_update: OrderStatusUpdate) -> Optional[Order]:
    order = await get_order_by_id(db, order_id)
    if not order:
        return None

    order.status = status_update.status
    if status_update.courier_id is not None:
        order.courier_id = status_update.courier_id
        if status_update.status == "yangi":
            order.status = "tasdiqlandi"

    if status_update.status == "yetkazildi" and order.payment_method == "naqd":
        order.payment_status = "tolandi"

    order.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(order)
    return await get_order_by_id(db, order.id)

# --- Couriers ---
async def get_couriers(db: AsyncSession, active_only: bool = False) -> List[Courier]:
    stmt = select(Courier)
    if active_only:
        stmt = stmt.where(Courier.is_active == True)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_courier_by_id(db: AsyncSession, courier_id: int) -> Optional[Courier]:
    result = await db.execute(select(Courier).where(Courier.id == courier_id))
    return result.scalar_one_or_none()

async def get_courier_by_telegram_id(db: AsyncSession, telegram_id: str) -> Optional[Courier]:
    result = await db.execute(select(Courier).where(Courier.telegram_id == str(telegram_id)))
    return result.scalar_one_or_none()

async def get_courier_by_username(db: AsyncSession, username: str) -> Optional[Courier]:
    u = username.strip().lstrip("@").lower()
    result = await db.execute(select(Courier).where(Courier.username.ilike(u)))
    return result.scalar_one_or_none()

async def get_courier_by_phone(db: AsyncSession, phone: str) -> Optional[Courier]:
    clean_p = phone.strip().replace(" ", "").replace("-", "")
    result = await db.execute(select(Courier).where(Courier.phone.contains(clean_p[-9:])))
    return result.scalar_one_or_none()

async def create_or_update_courier(db: AsyncSession, courier_data: dict) -> Courier:
    telegram_id = courier_data.get("telegram_id")
    courier = None
    if telegram_id:
        courier = await get_courier_by_telegram_id(db, str(telegram_id))
    
    if not courier and courier_data.get("phone"):
        courier = await get_courier_by_phone(db, courier_data["phone"])

    if not courier:
        courier = Courier(
            telegram_id=str(telegram_id) if telegram_id else None,
            username=courier_data.get("username", "").strip().lstrip("@") or None,
            name=courier_data.get("name", "Yangi Kuryer"),
            phone=courier_data.get("phone", ""),
            vehicle_type=courier_data.get("vehicle_type", "car"),
            is_active=courier_data.get("is_active", True)
        )
        db.add(courier)
    else:
        if "name" in courier_data and courier_data["name"]:
            courier.name = courier_data["name"]
        if "phone" in courier_data and courier_data["phone"]:
            courier.phone = courier_data["phone"]
        if "username" in courier_data:
            courier.username = courier_data["username"].strip().lstrip("@") if courier_data["username"] else courier.username
        if "vehicle_type" in courier_data and courier_data["vehicle_type"]:
            courier.vehicle_type = courier_data["vehicle_type"]
        if "is_active" in courier_data:
            courier.is_active = courier_data["is_active"]
        if telegram_id:
            courier.telegram_id = str(telegram_id)

    await db.commit()
    await db.refresh(courier)
    return courier

async def delete_courier(db: AsyncSession, courier_id: int) -> bool:
    courier = await get_courier_by_id(db, courier_id)
    if not courier:
        return False
    await db.delete(courier)
    await db.commit()
    return True
