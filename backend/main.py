from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import auth_router
from routes.prediction import prediction_router
from database import engine, Base

app = FastAPI(title="FastAPI Prediction App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # точно указываем URL фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(prediction_router, prefix="/api", tags=["Prediction"])

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/", summary="Home endpoint")
def home():
    return {"message": "FastAPI Prediction App"}
