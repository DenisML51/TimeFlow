from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from forecast.prophet import prophet_forecast

forecast_router = APIRouter()

class ForecastRequest(BaseModel):
    model: str
    horizon: int
    history: int  # Если >0, то возвращать исторический прогноз
    dt_name: str
    y_name: str
    freq: str
    confidence_level: int = 95  # Новый параметр, по умолчанию 95%
    data: list  # Список объектов (JSON)

@forecast_router.post("/forecast")
async def forecast_endpoint(request: ForecastRequest):
    try:
        df = pd.DataFrame(request.data)
        forecast_hist, forecast_horizon = prophet_forecast(
            df,
            request.horizon,
            request.history > 0,
            request.dt_name,
            request.y_name,
            request.freq,
            request.confidence_level
        )
        forecast_hist_json = forecast_hist.to_dict(orient="records") if forecast_hist is not None else []
        forecast_horizon_json = forecast_horizon.to_dict(orient="records") if forecast_horizon is not None else []
        return {"forecast_history": forecast_hist_json, "forecast_horizon": forecast_horizon_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
