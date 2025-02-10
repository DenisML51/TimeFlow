from fastapi import FastAPI
from routes.auth import auth_router
from routes.prediction import prediction_router
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from routes.google_auth import google_router



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем фронту делать запросы
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы (GET, POST, PUT, DELETE и т. д.)
    allow_headers=["*"],  # Разрешаем все заголовки
)

# Подключение роутеров
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(prediction_router, prefix="/predict", tags=["Prediction"])
app.include_router(prediction_router, prefix="/api", tags=["Prediction"])
app.include_router(prediction_router, prefix="/api")
app.include_router(google_router)

# Создание таблиц при старте
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def home():
    return {"message": "FastAPI Prediction App"}
