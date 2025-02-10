from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import auth_router
from routes.prediction import prediction_router
from database import engine, Base

app = FastAPI(title="FastAPI Prediction App")

# Настройка CORS для разрешения запросов с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем запросы с любых источников
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(prediction_router, prefix="/api", tags=["Prediction"])

# Создание таблиц при старте приложения
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/", summary="Home endpoint")
def home():
    return {"message": "FastAPI Prediction App"}
