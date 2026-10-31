from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Category, Product, Courier, StoreSettings

CATEGORIES_DATA = [
    {
        "id": 1,
        "name_uz": "Mevalar va Sabzavotlar",
        "name_ru": "Фрукты и Овощи",
        "icon": "🍎",
        "sort_order": 1,
        "image_url": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80"
    },
    {
        "id": 2,
        "name_uz": "Go'sht va Parranda",
        "name_ru": "Мясо и Птица",
        "icon": "🥩",
        "sort_order": 2,
        "image_url": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80"
    },
    {
        "id": 3,
        "name_uz": "Sut va Tuxum",
        "name_ru": "Молоко и Яйца",
        "icon": "🥛",
        "sort_order": 3,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80"
    },
    {
        "id": 4,
        "name_uz": "Non va Pishiriqlar",
        "name_ru": "Хлеб и Выпечка",
        "icon": "🍞",
        "sort_order": 4,
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"
    },
    {
        "id": 5,
        "name_uz": "Ichimliklar va Sharbatlar",
        "name_ru": "Напитки и Соки",
        "icon": "🧃",
        "sort_order": 5,
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80"
    },
    {
        "id": 6,
        "name_uz": "Shirinliklar va Gazaklar",
        "name_ru": "Сладости и Снеки",
        "icon": "🍫",
        "sort_order": 6,
        "image_url": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&q=80"
    },
    {
        "id": 7,
        "name_uz": "Don va Makaronlar",
        "name_ru": "Бакалея и Макароны",
        "icon": "🍚",
        "sort_order": 7,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=400&q=80"
    },
    {
        "id": 8,
        "name_uz": "Maishiy Kimyo",
        "name_ru": "Бытовая Химия",
        "icon": "🧴",
        "sort_order": 8,
        "image_url": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80"
    }
]

PRODUCTS_DATA = [
    # 1. Mevalar va Sabzavotlar
    {
        "category_id": 1,
        "name_uz": "Olma 'Qizil Beshyulduz'",
        "name_ru": "Яблоки 'Красные'",
        "description": "Shirin va sersuv, yangi uzilgan mahalliy olma.",
        "price": 18000,
        "discount_price": 15000,
        "unit": "kg",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80"
    },
    {
        "category_id": 1,
        "name_uz": "Banan import",
        "name_ru": "Бананы спелые",
        "description": "Ekvador bananlari, vitaminlarga boy va xushbo'y.",
        "price": 24000,
        "discount_price": None,
        "unit": "kg",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80"
    },
    {
        "category_id": 1,
        "name_uz": "Pomidor 'Yusupov'",
        "name_ru": "Помидоры Юсуповские",
        "description": "Shirali va go'shtdor haqiqiy Toshkent pomidori.",
        "price": 22000,
        "discount_price": 19000,
        "unit": "kg",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80"
    },
    {
        "category_id": 1,
        "name_uz": "Bodring yangi",
        "name_ru": "Огурцы свежие",
        "description": "Qarsildoq va xushbo'y issiqxona bodringi.",
        "price": 14000,
        "discount_price": None,
        "unit": "kg",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&q=80"
    },
    {
        "category_id": 1,
        "name_uz": "Kartoshka saralangan",
        "name_ru": "Картофель отборный",
        "description": "Tozalangan va saralangan sifatli kartoshka.",
        "price": 7500,
        "discount_price": None,
        "unit": "kg",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80"
    },

    # 2. Go'sht va Parranda
    {
        "category_id": 2,
        "name_uz": "Mol go'shti (Lahm suyakisiz)",
        "name_ru": "Говядина бескостная (Мякоть)",
        "description": "Yangi so'yilgan yosh buzoq lahm go'shti.",
        "price": 105000,
        "discount_price": 98000,
        "unit": "kg",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&q=80"
    },
    {
        "category_id": 2,
        "name_uz": "Tovuq filesi (Ko'krak qismi)",
        "name_ru": "Куриное филе грудки",
        "description": "Yangi va parhezbop tovuq go'shti.",
        "price": 48000,
        "discount_price": 43000,
        "unit": "kg",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80"
    },
    {
        "category_id": 2,
        "name_uz": "Qiyma (Mol go'shtidan)",
        "name_ru": "Фарш говяжий свежий",
        "description": "Hech qanday qo'shimchalarsiz tabiiy toza qiyma.",
        "price": 85000,
        "discount_price": None,
        "unit": "kg",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80"
    },

    # 3. Sut va Tuxum
    {
        "category_id": 3,
        "name_uz": "Sut 'Nestle' 3.2%",
        "name_ru": "Молоко 'Nestle' 3.2%",
        "description": "Pasterizatsiyalangan tabiiy sigir suti 1 litr.",
        "price": 14500,
        "discount_price": 12500,
        "unit": "dona",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80"
    },
    {
        "category_id": 3,
        "name_uz": "Tuxum 'Diyor' C0 (10 dona)",
        "name_ru": "Яйца отборные C0 (10 шт)",
        "description": "Yangi va yirik saralangan tovuq tuxumi.",
        "price": 16000,
        "discount_price": None,
        "unit": "qadoq",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80"
    },
    {
        "category_id": 3,
        "name_uz": "Sariyog' 'Prezident' 82%",
        "name_ru": "Масло сливочное 'President' 82%",
        "description": "Fransuz sifatidagi tabiiy sariyog' 200g.",
        "price": 32000,
        "discount_price": 28000,
        "unit": "dona",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80"
    },

    # 4. Non va Pishiriqlar
    {
        "category_id": 4,
        "name_uz": "Samarqand noni tandir",
        "name_ru": "Самаркандская лепешка",
        "description": "Issiq va xushbo'y tandir noni, uzoq saqlanadi.",
        "price": 8000,
        "discount_price": None,
        "unit": "dona",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80"
    },
    {
        "category_id": 4,
        "name_uz": "Tost noni 'Toast' oq",
        "name_ru": "Хлеб тостовый белый",
        "description": "Ertalabki nonushta uchun kesilgan yumshoq non.",
        "price": 9500,
        "discount_price": None,
        "unit": "dona",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"
    },

    # 5. Ichimliklar
    {
        "category_id": 5,
        "name_uz": "Coca-Cola Classic 1.5L",
        "name_ru": "Кока-Кола 1.5 л",
        "description": "Klassik gazlangan tetiklantiruvchi ichimlik.",
        "price": 14000,
        "discount_price": 12000,
        "unit": "dona",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80"
    },
    {
        "category_id": 5,
        "name_uz": "Sharbat 'Dena' Olcha 1L",
        "name_ru": "Сок 'Dena' Вишневый 1л",
        "description": "100% tabiiy meva sharbati.",
        "price": 13000,
        "discount_price": None,
        "unit": "dona",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80"
    },
    {
        "category_id": 5,
        "name_uz": "Suv 'Montella' Gazsiz 1.5L",
        "name_ru": "Вода без газа Montella 1.5л",
        "description": "Tog' buloqlaridan olingan toza ichimlik suvi.",
        "price": 5000,
        "discount_price": None,
        "unit": "dona",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&q=80"
    },

    # 6. Shirinliklar
    {
        "category_id": 6,
        "name_uz": "Shokolad 'Alpen Gold' Sutli 85g",
        "name_ru": "Шоколад Alpen Gold молочный",
        "description": "Yong'oqli va mayizli nozik sutli shokolad.",
        "price": 11000,
        "discount_price": 9500,
        "unit": "dona",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&q=80"
    },
    {
        "category_id": 6,
        "name_uz": "Nutella yong'oqli pasta 350g",
        "name_ru": "Паста ореховая Nutella 350г",
        "description": "Mashhur italyan kakao va findiq pastasi.",
        "price": 45000,
        "discount_price": None,
        "unit": "dona",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&q=80"
    },

    # 7. Don va Makaronlar
    {
        "category_id": 7,
        "name_uz": "Guruch 'Laser' oliy nav",
        "name_ru": "Рис Лазер отборный",
        "description": "Haqiqiy toshkentcha va samarqandcha palov uchun.",
        "price": 26000,
        "discount_price": 23000,
        "unit": "kg",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80"
    },
    {
        "category_id": 7,
        "name_uz": "Makaron 'Makfa' Spaghetti 500g",
        "name_ru": "Макароны Makfa Спагетти 500г",
        "description": "Qattiq bug'doy navlaridan tayyorlangan sifatli makaron.",
        "price": 9500,
        "discount_price": None,
        "unit": "qadoq",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=400&q=80"
    },
    {
        "category_id": 7,
        "name_uz": "Pista yog'i 'Shedevr' 1L",
        "name_ru": "Масло подсолнечное Шедевр 1л",
        "description": "Tozalangan va xidsizlantirilgan o'simlik yog'i.",
        "price": 18500,
        "discount_price": 16500,
        "unit": "dona",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80"
    },

    # 8. Maishiy Kimyo
    {
        "category_id": 8,
        "name_uz": "Kir yuvish kukuni 'Ariel' 3kg",
        "name_ru": "Стиральный порошок Ariel 3кг",
        "description": "Rangli kiyimlar uchun avtomat kir yuvish kukuni.",
        "price": 68000,
        "discount_price": 59000,
        "unit": "dona",
        "is_popular": True,
        "image_url": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80"
    },
    {
        "category_id": 8,
        "name_uz": "Idish yuvish geli 'Fairy' 900ml",
        "name_ru": "Гель для посуды Fairy 900мл",
        "description": "Limonli, yog'larni sovuq suvda ham tez ketkazadi.",
        "price": 24000,
        "discount_price": None,
        "unit": "dona",
        "is_popular": False,
        "image_url": "https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=400&q=80"
    }
]

COURIERS_DATA = [
    {
        "id": 1,
        "name": "Alisher Qodirov",
        "phone": "+998 90 123 45 67",
        "vehicle_type": "car",
        "is_active": True
    },
    {
        "id": 2,
        "name": "Jasur Bekmirzayev",
        "phone": "+998 93 987 65 43",
        "vehicle_type": "moto",
        "is_active": True
    }
]

async def seed_database(db: AsyncSession):
    # Check if categories already exist
    result = await db.execute(select(Category))
    existing = result.scalars().first()
    if existing:
        return

    # Seed Categories
    for c_data in CATEGORIES_DATA:
        cat = Category(**c_data)
        db.add(cat)
    await db.commit()

    # Seed Products
    for p_data in PRODUCTS_DATA:
        prod = Product(**p_data)
        db.add(prod)
    await db.commit()

    # Seed Couriers
    for cr_data in COURIERS_DATA:
        cr = Courier(**cr_data)
        db.add(cr)
    await db.commit()

    # Seed Store Settings
    settings = StoreSettings(
        store_name="Korzinka Supermarket",
        phone="+998 78 140 14 14",
        address="Toshkent shahri, Yunusobod tumani",
        is_open=True,
        min_order_amount=30000.0,
        free_delivery_threshold=150000.0,
        base_delivery_fee=15000.0,
        delivery_time_text="25 - 40 daqiqa"
    )
    db.add(settings)
    await db.commit()
    print("Database successfully seeded with categories, products, couriers, and settings.")
