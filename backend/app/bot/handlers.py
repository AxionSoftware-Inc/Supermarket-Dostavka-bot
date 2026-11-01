import logging
from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    MenuButtonWebApp
)
from app.config import MINI_APP_URL
from app.bot.bot_instance import bot
from app.database import AsyncSessionLocal
from app.crud import sync_customer_profile
from app.schemas import CustomerCreateOrUpdate

logger = logging.getLogger(__name__)
router = Router()

def get_main_keyboard(user_id: int = None) -> InlineKeyboardMarkup:
    web_app_url = MINI_APP_URL
    if user_id:
        sep = "&" if "?" in web_app_url else "?"
        web_app_url = f"{web_app_url}{sep}tg_id={user_id}"

    kb = [
        [
            InlineKeyboardButton(
                text="🛒 Korzinka Do'konini Ochish",
                web_app=WebAppInfo(url=web_app_url)
            )
        ],
        [
            InlineKeyboardButton(
                text="📦 Buyurtmalarim",
                callback_data="my_orders"
            ),
            InlineKeyboardButton(
                text="📞 Aloqa / Yordam",
                callback_data="help_info"
            )
        ],
        [
            InlineKeyboardButton(
                text="🛵 Kuryer Paneli",
                web_app=WebAppInfo(url=f"{MINI_APP_URL}?role=courier")
            ),
            InlineKeyboardButton(
                text="⚙️ Admin Paneli",
                web_app=WebAppInfo(url=f"{MINI_APP_URL}?role=admin")
            )
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=kb)

@router.message(CommandStart())
async def handle_start(message: Message):
    user_id = message.from_user.id
    user_name = message.from_user.first_name or "Mijoz"

    # Set Telegram Chat Menu button to open the Mini App directly from bottom-left
    try:
        await bot.set_chat_menu_button(
            chat_id=message.chat.id,
            menu_button=MenuButtonWebApp(
                text="🛒 Do'kon",
                web_app=WebAppInfo(url=f"{MINI_APP_URL}?tg_id={user_id}")
            )
        )
    except Exception as e:
        logger.warning(f"Could not set menu button: {e}")

    welcome_text = (
        f"Assalomu alaykum, <b>{user_name}</b>! 👋\n\n"
        f"<b>Korzinka</b> tezkor yetkazib berish xizmati botiga xush kelibsiz! 🛍️\n\n"
        f"Bizda 1000 dan ortiq yangi meva-sabzavotlar, oziq-ovqat va maishiy mahsulotlar mavjud.\n"
        f"⚡️ <b>Yetkazib berish vaqti:</b> 25 - 40 daqiqa!\n"
        f"🚚 150 000 so'mdan yuqori xaridlar uchun <b>bepul yetkazish</b>!\n\n"
        f"Xaridni boshlash uchun quyidagi tugmani bosing 👇\n\n"
        f"🌐 <b>To'g'ridan-to'g'ri havola:</b>\n{MINI_APP_URL}"
    )

    await message.answer(
        text=welcome_text,
        reply_markup=get_main_keyboard(user_id)
    )

@router.message(F.contact)
async def handle_contact_message(message: Message):
    contact = message.contact
    if not contact:
        return

    phone = contact.phone_number
    if not phone.startswith('+'):
        phone = f"+{phone}"

    name = [contact.first_name, contact.last_name]
    full_name = " ".join([n for n in name if n]) or "Mijoz"

    async with AsyncSessionLocal() as session:
        await sync_customer_profile(
            session,
            CustomerCreateOrUpdate(
                telegram_id=str(message.from_user.id),
                name=full_name,
                phone=phone
            )
        )

    await message.answer(
        f"✅ Rahmat, <b>{full_name}</b>! Sizning telefon raqamingiz (<code>{phone}</code>) muvaffaqiyatli saqlandi.\n"
        f"Endi har safar xarid qilganda maʼlumotlarni qayta kiritishingiz shart emas! 🎉",
        reply_markup=get_main_keyboard(message.from_user.id)
    )

@router.message(Command("orders"))
async def handle_orders_cmd(message: Message):
    user_id = message.from_user.id
    await message.answer(
        "📦 Buyurtmalaringiz holatini ko'rish uchun ilovamizni oching:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="📋 Buyurtmalarimni ko'rish",
                web_app=WebAppInfo(url=f"{MINI_APP_URL}?tab=orders&tg_id={user_id}")
            )
        ]])
    )

@router.message(Command("courier"))
async def handle_courier_cmd(message: Message):
    await message.answer(
        "🛵 <b>Kuryer paneli:</b>\nBuyurtmalarni yetkazish va marshrutni ko'rish uchun quyidagi tugmani bosing:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="🛵 Kuryer Paneli",
                web_app=WebAppInfo(url=f"{MINI_APP_URL}?role=courier")
            )
        ]])
    )

@router.message(Command("admin"))
async def handle_admin_cmd(message: Message):
    await message.answer(
        "⚙️ <b>Do'kon Admin Paneli:</b>\nBuyurtmalar oqimi, mahsulotlar va kuryerlarni boshqarish:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="⚙️ Admin Paneli",
                web_app=WebAppInfo(url=f"{MINI_APP_URL}?role=admin")
            )
        ]])
    )

# Callback queries
@router.callback_query(F.data == "my_orders")
async def cb_my_orders(query):
    user_id = query.from_user.id
    await query.message.answer(
        "📦 Buyurtmalaringiz ro'yxatini ko'rish uchun:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="📋 Buyurtmalarni ochish",
                web_app=WebAppInfo(url=f"{MINI_APP_URL}?tab=orders&tg_id={user_id}")
            )
        ]])
    )
    await query.answer()

@router.callback_query(F.data == "help_info")
async def cb_help_info(query):
    text = (
        "📞 <b>Mijozlarni qo'llab-quvvatlash xizmati:</b>\n\n"
        "⏰ Ish vaqti: 08:00 dan 23:00 gacha\n"
        "☎️ Telefon: +998 78 140 14 14\n"
        "💬 Administrator: @korzinka_support\n\n"
        "Savollaringiz yoki takliflaringiz bo'lsa bemalol murojaat qiling!"
    )
    await query.message.answer(text)
    await query.answer()

# Notifications
async def notify_customer_new_order(order):
    if not order.telegram_user_id:
        return
    try:
        items_summary = "\n".join([
            f"• {item.product_name} - {item.quantity} {item.unit} x {int(item.price):,} so'm"
            for item in order.items
        ])
        text = (
            f"🎉 <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>\n\n"
            f"🆔 <b>Raqami:</b> {order.order_number}\n"
            f"📍 <b>Manzil:</b> {order.delivery_address}\n"
            f"💳 <b>To'lov:</b> {order.payment_method.capitalize()}\n\n"
            f"🛒 <b>Mahsulotlar:</b>\n{items_summary}\n\n"
            f"🚚 <b>Yetkazish:</b> {int(order.delivery_fee):,} so'm\n"
            f"💰 <b>Jami summa:</b> <b>{int(order.total_amount):,} so'm</b>\n\n"
            f"Tez orada buyurtmangiz tayyorlanib, kuryerimizga topshiriladi! 🛵"
        )
        await bot.send_message(
            chat_id=int(order.telegram_user_id),
            text=text,
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="🔍 Buyurtmani kuzatish",
                    web_app=WebAppInfo(url=f"{MINI_APP_URL}?track={order.order_number}")
                )
            ]])
        )
    except Exception as e:
        logger.error(f"Failed to notify customer for order {order.id}: {e}")

async def notify_customer_status_change(order):
    if not order.telegram_user_id:
        return
    status_messages = {
        "tasdiqlandi": "👨‍🍳 <b>Buyurtmangiz tasdiqlandi!</b>\nOmborimizda buyurtmangiz tayyorlanishni boshladi.",
        "yigilyapti": "📦 <b>Buyurtmangiz qadoqlanmoqda!</b>\nBarcha sifatli mahsulotlar to'planmoqda.",
        "kuryerda": f"🛵 <b>Kuryer buyurtmani qabul qildi va yo'lga chiqdi!</b>\nYetkazib berish vaqti: ~15-25 daqiqa.",
        "yetkazildi": "🎉 <b>Buyurtmangiz muvaffaqiyatli yetkazildi!</b>\nBizning do'kondan xarid qilganingiz uchun rahmat! Yoqimli ishtaha! 😊",
        "bekor": "❌ <b>Buyurtmangiz bekor qilindi.</b>\nAgar xatolik bo'lsa, operatorimiz bilan bog'laning."
    }
    msg = status_messages.get(order.status)
    if not msg:
        return

    try:
        courier_info = ""
        if order.courier and order.status == "kuryerda":
            courier_info = f"\n\n👤 <b>Kuryer:</b> {order.courier.name}\n📞 <b>Tel:</b> {order.courier.phone}"

        text = (
            f"📦 <b>Buyurtma #{order.order_number} holati:</b>\n\n"
            f"{msg}{courier_info}"
        )
        await bot.send_message(
            chat_id=int(order.telegram_user_id),
            text=text,
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="🔍 Buyurtmani kuzatish",
                    web_app=WebAppInfo(url=f"{MINI_APP_URL}?track={order.order_number}")
                )
            ]])
        )
    except Exception as e:
        logger.error(f"Failed to notify status change for order {order.id}: {e}")
