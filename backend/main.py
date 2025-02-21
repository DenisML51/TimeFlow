from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import auth_router
from routes.prediction import prediction_router
from routes.forecast import forecast_router
from routes.session import session_router  
from database import engine, Base

app = FastAPI(title="TimeFlow Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(prediction_router, prefix="/api", tags=["Prediction"])
app.include_router(forecast_router, prefix="/api", tags=["Forecast"])
app.include_router(session_router, prefix="/session", tags=["Session"]) 

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/", summary="Home endpoint")
def home():
    return {"message": "TimeFlow Backend"}
