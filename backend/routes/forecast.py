# routes/forecast.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from celery.result import AsyncResult
from forecast.arima_forecast import sarima_forecast
from forecast.prophet_forecast import prophet_forecast
from forecast.xgboost_forecast import xgboost_forecast
from tasks import run_forecast, celery_app
import pandas as pd

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
async def forecast_endpoint(request_data: ForecastRequest):
    """
    Принимает запрос на прогнозирование, отправляет задачу в очередь и возвращает task_id.
    """
    try:
        task = run_forecast.delay(
            request_data.model,
            request_data.uniqueParams,
            request_data.horizon,
            request_data.history,
            request_data.dt_name,
            request_data.y_name,
            request_data.freq,
            request_data.confidence_level,
            request_data.data
        )
        return {"message": "Forecast task submitted", "task_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@forecast_router.get("/forecast/status/{task_id}")
async def get_forecast_status(task_id: str):
    """
    Эндпоинт для получения статуса задачи прогнозирования.
    Если задача завершена, возвращается результат.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    if task_result.state == "PENDING":
        return {"task_id": task_id, "status": task_result.state}
    elif task_result.state != "FAILURE":
        return {
            "task_id": task_id,
            "status": task_result.state,
            "result": task_result.result
        }
    else:
        return {
            "task_id": task_id,
            "status": task_result.state,
            "result": str(task_result.info)
        }


@forecast_router.post("/forecast_demo")
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
                request.uniqueParams.get("s", 2)
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