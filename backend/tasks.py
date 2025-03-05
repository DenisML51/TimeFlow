# tasks.py
import os
import pandas as pd
from celery import Celery
from forecast.prophet_forecast import prophet_forecast
from forecast.xgboost_forecast import xgboost_forecast
from forecast.arima_forecast import sarima_forecast
from forecast.lstm_forecast import lstm_forecast
from forecast.gru_forecast import gru_forecast
from forecast.transformers_forecast import transformer_forecast

# Инициализируем Celery, считывая настройки из .env
celery_app = Celery(
    "timeflow_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")
)


@celery_app.task
def run_forecast(model: str, uniqueParams: dict, horizon: int, history: int,
                 dt_name: str, y_name: str, freq: str, confidence_level: int, data: list):
    """
    Выполняет прогнозирование, выбирая нужную модель по параметру `model`.
    Принимает данные в виде списка словарей (чтобы их можно было сериализовать).
    Возвращает результаты прогнозирования в виде словаря.
    """
    df = pd.DataFrame(data)

    if model == "Prophet":
        forecast_all, forecast_train, forecast_test, forecast_horizon = prophet_forecast(
            df,
            horizon=horizon,
            test_size=history,
            dt_name=dt_name,
            y_name=y_name,
            freq=freq,
            confidence_level=confidence_level
        )
    elif model == "XGBoost":
        forecast_all, forecast_train, forecast_test, forecast_horizon = xgboost_forecast(
            df,
            horizon=horizon,
            test_size=history,
            dt_name=dt_name,
            y_name=y_name,
            freq=freq,
            confidence_level=confidence_level,
            xgb_params=uniqueParams
        )
    elif model == "SARIMA":
        order = (uniqueParams.get("p", 1),
                 uniqueParams.get("d", 1),
                 uniqueParams.get("q", 1))
        seasonal_order = (
            uniqueParams.get("P", 1),
            uniqueParams.get("D", 1),
            uniqueParams.get("Q", 1),
            uniqueParams.get("s", 12)
        )
        forecast_all, forecast_train, forecast_test, forecast_horizon = sarima_forecast(
            df,
            horizon=horizon,
            test_size=history,
            dt_name=dt_name,
            y_name=y_name,
            freq=freq,
            confidence_level=confidence_level,
            order=order,
            seasonal_order=seasonal_order
        )
    elif model == "LSTM":
        forecast_all, forecast_train, forecast_test, forecast_horizon = lstm_forecast(
            df,
            horizon=horizon,
            test_size=history,
            dt_name=dt_name,
            y_name=y_name,
            freq=freq,
            confidence_level=confidence_level,
            model_params=uniqueParams,
            seasonality=uniqueParams.get("seasonality", "MS"),
            criterion=uniqueParams.get("criterion", "Huber"),
            optimizer_type=uniqueParams.get("optimizer_type", "AdamW")
        )
    elif model == "GRU":
        forecast_all, forecast_train, forecast_test, forecast_horizon = gru_forecast(
            df,
            horizon=horizon,
            test_size=history,
            dt_name=dt_name,
            y_name=y_name,
            freq=freq,
            confidence_level=confidence_level,
            model_params=uniqueParams,
            seasonality=uniqueParams.get("seasonality", "MS"),
            criterion=uniqueParams.get("criterion", "Huber"),
            optimizer_type=uniqueParams.get("optimizer_type", "AdamW")
        )
    elif model == "Transformer":
        forecast_all, forecast_train, forecast_test, forecast_horizon = transformer_forecast(
            df,
            horizon=horizon,
            test_size=history,
            dt_name=dt_name,
            y_name=y_name,
            freq=freq,
            confidence_level=confidence_level,
            model_params=uniqueParams,
            seasonality=uniqueParams.get("seasonality", "MS"),
            criterion=uniqueParams.get("criterion", "MSE"),
            optimizer_type=uniqueParams.get("optimizer_type", "AdamW")
        )
    else:
        raise ValueError("Unsupported model")

    result = {
        "forecast_all": forecast_all.to_dict(orient="records"),
        "forecast_train": forecast_train.to_dict(orient="records"),
        "forecast_test": forecast_test.to_dict(orient="records"),
        "forecast_horizon": forecast_horizon.to_dict(orient="records")
    }
    return result
