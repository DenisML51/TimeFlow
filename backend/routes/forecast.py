from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from forecast.prophet_forecast import prophet_forecast
from forecast.xgboost_forecast import xgboost_forecast
from forecast.arima_forecast import sarima_forecast
from forecast.lstm_forecast import lstm_forecast 
from forecast.gru_forecast import gru_forecast
from forecast.transformers_forecast import transformer_forecast

forecast_router = APIRouter()

class ForecastRequest(BaseModel):
    model: str
    uniqueParams: dict = {}
    horizon: int
    history: int
    dt_name: str
    y_name: str
    freq: str
    confidence_level: int = 95
    data: list

@forecast_router.post("/forecast")
async def forecast_endpoint(request: ForecastRequest):
    try:
        df = pd.DataFrame(request.data)
        if request.model == "Prophet":
            forecast_all, forecast_train, forecast_test, forecast_horizon = prophet_forecast(
                df,
                horizon=request.horizon,
                test_size=request.history,
                dt_name=request.dt_name,
                y_name=request.y_name,
                freq=request.freq,
                confidence_level=request.confidence_level
            )
        elif request.model == "XGBoost":
            forecast_all, forecast_train, forecast_test, forecast_horizon = xgboost_forecast(
                df,
                horizon=request.horizon,
                test_size=request.history,
                dt_name=request.dt_name,
                y_name=request.y_name,
                freq=request.freq,
                confidence_level=request.confidence_level,
                xgb_params=request.uniqueParams
            )
        elif request.model == "SARIMA":
            order = (request.uniqueParams.get("p", 1),
                     request.uniqueParams.get("d", 1),
                     request.uniqueParams.get("q", 1))
            seasonal_order = (
                request.uniqueParams.get("P", 1),
                request.uniqueParams.get("D", 1),
                request.uniqueParams.get("Q", 1),
                request.uniqueParams.get("s", 12)
            )
            forecast_all, forecast_train, forecast_test, forecast_horizon = sarima_forecast(
                df,
                horizon=request.horizon,
                test_size=request.history,
                dt_name=request.dt_name,
                y_name=request.y_name,
                freq=request.freq,
                confidence_level=request.confidence_level,
                order=order,
                seasonal_order=seasonal_order
            )
        elif request.model == "LSTM":
            forecast_all, forecast_train, forecast_test, forecast_horizon = lstm_forecast(
                df,
                horizon=request.horizon,
                test_size=request.history,
                dt_name=request.dt_name,
                y_name=request.y_name,
                freq=request.freq,
                confidence_level=request.confidence_level,
                model_params=request.uniqueParams,
                seasonality=request.uniqueParams.get("seasonality", "MS"),
                criterion=request.uniqueParams.get("criterion", "Huber"),
                optimizer_type=request.uniqueParams.get("optimizer_type", "AdamW")
            )
        elif request.model == "GRU": 
            forecast_all, forecast_train, forecast_test, forecast_horizon = gru_forecast(
                df,
                horizon=request.horizon,
                test_size=request.history,
                dt_name=request.dt_name,
                y_name=request.y_name,
                freq=request.freq,
                confidence_level=request.confidence_level,
                model_params=request.uniqueParams,
                seasonality=request.uniqueParams.get("seasonality", "MS"),
                criterion=request.uniqueParams.get("criterion", "Huber"),
                optimizer_type=request.uniqueParams.get("optimizer_type", "AdamW")
            )
        elif request.model == "Transformer":
            print(request.model)
            forecast_all, forecast_train, forecast_test, forecast_horizon = transformer_forecast(
                df,
                horizon=request.horizon,
                test_size=request.history,
                dt_name=request.dt_name,
                y_name=request.y_name,
                freq=request.freq,
                confidence_level=request.confidence_level,
                model_params=request.uniqueParams,
                seasonality=request.uniqueParams.get("seasonality", "MS"),
                criterion=request.uniqueParams.get("criterion", "MSE"),
                optimizer_type=request.uniqueParams.get("optimizer_type", "AdamW")
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported model")

        return {
            "forecast_all": forecast_all.to_dict(orient="records"),
            "forecast_train": forecast_train.to_dict(orient="records"),
            "forecast_test": forecast_test.to_dict(orient="records"),
            "forecast_horizon": forecast_horizon.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
