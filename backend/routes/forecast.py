# forecast_router.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from forecast.prophet import prophet_forecast

forecast_router = APIRouter()

class ForecastRequest(BaseModel):
    model: str
    horizon: int
    history: int  # Кол-во точек для тестовой выборки
    dt_name: str
    y_name: str
    freq: str
    confidence_level: int = 95
    data: list  # Список объектов (JSON)

@forecast_router.post("/forecast")
async def forecast_endpoint(request: ForecastRequest):
    """
    Если history > 0, тогда последние `history` точек считаются тестовой выборкой.
    """
    try:
        df = pd.DataFrame(request.data)
        forecast_all, forecast_train, forecast_test, forecast_horizon = prophet_forecast(
            df,
            horizon=request.horizon,
            test_size=request.history,  # <-- передаём как test_size
            dt_name=request.dt_name,
            y_name=request.y_name,
            freq=request.freq,
            confidence_level=request.confidence_level
        )

        # Преобразуем в JSON
        forecast_all_json = forecast_all.to_dict(orient="records") if not forecast_all.empty else []
        forecast_train_json = forecast_train.to_dict(orient="records") if not forecast_train.empty else []
        forecast_test_json = forecast_test.to_dict(orient="records") if not forecast_test.empty else []
        forecast_horizon_json = forecast_horizon.to_dict(orient="records") if not forecast_horizon.empty else []

        return {
            "forecast_all": forecast_all_json,
            "forecast_train": forecast_train_json,
            "forecast_test": forecast_test_json,
            "forecast_horizon": forecast_horizon_json
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
