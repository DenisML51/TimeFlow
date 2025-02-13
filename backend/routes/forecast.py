from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from forecast.prophet import prophet

forecast_router = APIRouter()

class ForecastRequest(BaseModel):
    model: str
    horizon: int
    history: int
    dt_name: str
    y_name: str
    freq: str
    data: list  # Ожидается список объектов (JSON-формат)

@forecast_router.post("/forecast")
async def forecast_endpoint(request: ForecastRequest):
    try:
        df = pd.DataFrame(request.data)
        if request.model.lower() == "prophet":
            forecast_hist, forecast_horizon = prophet(
                df, request.horizon, request.history, request.dt_name, request.y_name, request.freq
            )
            forecast_hist_json = forecast_hist.to_dict(orient="records") if isinstance(forecast_hist, pd.DataFrame) else []
            forecast_horizon_json = forecast_horizon.to_dict(orient="records") if isinstance(forecast_horizon, pd.DataFrame) else []
            return {"forecast_history": forecast_hist_json, "forecast_horizon": forecast_horizon_json}
        else:
            raise HTTPException(status_code=400, detail="Unsupported model")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
