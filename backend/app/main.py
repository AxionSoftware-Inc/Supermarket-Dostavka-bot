import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base, AsyncSessionLocal
from app.seed_data import seed_database
from app.config import HOST, PORT, BOT_TOKEN
from app.bot.bot_instance import bot, dp
from app.bot.handlers import router as bot_router

from app.routers import categories, products, orders, couriers, admin, customers

bot_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed default data if empty
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    # 3. Start aiogram bot polling in background
    dp.include_router(bot_router)
    global bot_task
    async def start_polling():
        try:
            print("Telegram bot polling starting...")
            await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
        except Exception as e:
            print(f"Bot polling error: {e}")

    bot_task = asyncio.create_task(start_polling())

    yield

    # Shutdown
    if bot_task:
        bot_task.cancel()
    await bot.session.close()
    await engine.dispose()
    print("Application shutdown complete.")

app = FastAPI(
    title="Korzinka Delivery API",
    description="FastAPI Backend for Korzinka Telegram Mini App Delivery System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(couriers.router)
app.include_router(admin.router)
app.include_router(customers.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "Korzinka Delivery System"}

# Frontend static serving if built
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
