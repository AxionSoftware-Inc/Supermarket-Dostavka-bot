# 🛒 Korzinka — Telegram Mini App Dostavka Tizimi

Yirik do'konlar va supermarketlar uchun mo'ljallangan zamonaviy, to'liq avtomatlashtirilgan Telegram orqali boshqariladigan yetkazib berish ekotizimi.

---

## 🌟 Tizim Imkoniyatlari

### 1. 🛍️ Mijozlar uchun Telegram Mini App:
- **Telegram ichida 1 bosishda ochiladi** (Chat menu button va inline tugmalar orqali).
- **8 ta asosiy toifa va 23+ ta mahsulot** (Meva-sabzavotlar, Go'sht, Sut mahsulotlari, Non, Ichimliklar, Shirinliklar, Don-makaron, Maishiy kimyo).
- **Aksiyalar va chegirmalar:** Eski narx ustidan chizilgan, chegirma foizi (`-15%`) va `TOP` belgilari.
- **Tezkor qidiruv va filtrlar:** Mahsulot nomi va tavsifi bo'yicha jonli qidiruv.
- **Smart Savatcha:**
  - Mahsulot qo'shish/ayirishda Telegram Haptic tebranishi (Haptic Feedback).
  - Bepul yetkazib berish progress-bari (*"Yana 22 000 so'mlik xarid qiling va bepul yetkazishga ega bo'ling!"*).
- **Rasmiylashtirish (Checkout):**
  - Telegram foydalanuvchi ma'lumotlarini avtomatik to'ldirish.
  - **📍 Geolokatsiya tugmasi:** GPS orqali mijozning aniq lokatsiyasini 1 bosishda aniqlash.
  - To'lov turlari: Naqd pul, Click, Payme, Terminal (Karta orqali kuryerga).
- **Jonli kuzatuv (Order Tracking):**
  - Real-vaqtda status indikatori: *Qabul qilindi ➔ Tasdiqlandi ➔ Yig'ilmoqda ➔ Kuryer yo'lda ➔ Yetkazildi*.
  - Biriktirilgan kuryer ismi va unga to'g'ridan-to'g'ri qo'ng'iroq qilish tugmasi.

### 2. 🛵 Kuryerlar Ishchi Paneli:
- Har bir kuryer o'ziga biriktirilgan yoki bo'sh buyurtmalarni ko'radi.
- **🗺️ Xaritada ochish:** Yandex Go / Google Maps orqali mijoz manzili yoki GPS koordinatasiga 1 bosishda marshrut ochish.
- **📞 Mijozga qo'ng'iroq:** 1 bosishda mijoz telefoniga ulanish.
- **Tezkor status o'zgartirish:** *"Yo'lga chiqdim"* va *"Yetkazildi"*. Status o'zgarganda mijozga Telegram botdan xabar boradi.

### 3. ⚙️ Admin & Dispetcher Paneli:
- **Jonli statistika:** Umumiy tushum, faol buyurtmalar, kuryerlar va mahsulotlar soni.
- **Buyurtmalar oqimi:** Filtrlar (Yangi, Tasdiqlangan, Kuryerda, Yetkazilgan).
- **Kuryer biriktirish:** Istalgan buyurtmaga kuryerni biriktirish yoki bekor qilish.

### 4. 🤖 Telegram Bot Integratsiyasi:
- **Bot username:** [@testkorzinkaucun_bot](https://t.me/testkorzinkaucun_bot)
- Yangi buyurtma tushganda mijozga to'liq chek va kuzatish havolasi boradi.
- Kuryer yoki admin buyurtma holatini yangilaganda mijozga xabarnoma yuboriladi.

---

## 🛠️ Texnologiyalar Steki

- **Backend:** Python 3.14 + FastAPI + SQLAlchemy 2.0 (Async) + aiosqlite + Aiogram 3.x
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Telegram WebApp SDK
- **Database:** SQLite (lokal va tezkor, PostgreSQL ga o'tishga 100% tayyor ORM)
- **Public Tunnel:** Cloudflare Tunnel (HTTPS)

---

## 🚀 Ishga tushirish (Local & Production)

```bash
# 1. Repozitoriyga kiring
cd /Users/macbookpro/Documents/Dostavka

# 2. Virtual muhitni faollashtiring
source venv/bin/activate

# 3. Backend va botni ishga tushiring
export PYTHONPATH=backend
python3 backend/app/main.py
```

Frontendni qayta yig'ish (agar o'zgartirish kiritilsa):
```bash
cd frontend
npm run build
```
