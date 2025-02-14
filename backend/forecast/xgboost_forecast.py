import pandas as pd
from xgboost import XGBRegressor

def xgboost_forecast(df, horizon, test_size, dt_name, y_name, freq, confidence_level=95, xgb_params=None):
    """
    Прогнозирование с использованием XGBoost.
    Создаются лаговые признаки (lag = 5).
    Данные делятся на train и test (последние test_size строк).
    Выполняется рекурсивное прогнозирование на заданный горизонт.
    Возвращаются четыре DataFrame:
      - forecast_all: прогноз для всей истории с фактическими значениями (если есть)
      - forecast_train: прогноз для тренировочной выборки
      - forecast_test: прогноз для тестовой выборки
      - forecast_horizon: прогноз на будущее (горизонт)
    """
    if xgb_params is None:
        xgb_params = {}
    try:
        # 1. Предобработка данных
        data = df.copy()
        data[dt_name] = pd.to_datetime(data[dt_name])
        data.set_index(dt_name, inplace=True)
        data = data.sort_index()
        data = data.asfreq(freq=freq)
        data = data.fillna(method='ffill').fillna(0)
        data[y_name] = data[y_name].astype(float)

        # 2. Создание лаговых признаков (lag = 5)
        lag = 5
        df_features = pd.DataFrame()
        for i in range(1, lag + 1):
            df_features[f'lag_{i}'] = data[y_name].shift(i)
        df_features['y'] = data[y_name]
        df_features['ds'] = data.index
        df_features = df_features.dropna()

        # 3. Деление на train и test
        n = len(df_features)
        if test_size > 0 and test_size < n:
            train_df = df_features.iloc[: (n - test_size)].copy()
            test_df = df_features.iloc[(n - test_size) :].copy()
        else:
            train_df = df_features.copy()
            test_df = pd.DataFrame(columns=df_features.columns)

        # 4. Обучение модели XGBoost
        model = XGBRegressor(**xgb_params)
        feature_cols = [f"lag_{i}" for i in range(1, lag + 1)]
        model.fit(train_df[feature_cols], train_df["y"])

        # 5. Прогноз для всей истории
        pred_all = model.predict(df_features[feature_cols])
        forecast_all = df_features.copy()
        forecast_all["y_forecast"] = pred_all
        margin = (100 - confidence_level) / 100.0
        forecast_all["yhat_lower"] = forecast_all["y_forecast"] * (1 - margin)
        forecast_all["yhat_upper"] = forecast_all["y_forecast"] * (1 + margin)
        forecast_all.rename(columns={"y": "y_fact"}, inplace=True)
        forecast_all["model_name"] = "XGBoost"
        forecast_all = forecast_all[["ds", "y_fact", "y_forecast", "yhat_lower", "yhat_upper", "model_name"]]

        # 6. Разбиение прогноза на train и test
        forecast_train = forecast_all[forecast_all["ds"].isin(train_df["ds"])].copy()
        forecast_test = forecast_all[forecast_all["ds"].isin(test_df["ds"])].copy()

        # 7. Прогноз на будущее (horizon) с рекурсией
        last_row = df_features.iloc[-1]
        last_lags = list(last_row[feature_cols])
        future_forecasts = []
        last_date = df_features["ds"].max()
        future_dates = pd.date_range(start=last_date, periods=horizon + 1, freq=freq)[1:]
        current_lags = last_lags.copy()
        for dt in future_dates:
            X_input = [current_lags]
            y_pred = model.predict(X_input)[0]
            future_forecasts.append({"ds": dt, "y_forecast": y_pred})
            current_lags = current_lags[1:] + [y_pred]
        future_fore = pd.DataFrame(future_forecasts)
        future_fore["yhat_lower"] = future_fore["y_forecast"] * (1 - margin)
        future_fore["yhat_upper"] = future_fore["y_forecast"] * (1 + margin)
        future_fore["model_name"] = "XGBoost"
        forecast_horizon = future_fore[["ds", "y_forecast", "yhat_lower", "yhat_upper", "model_name"]]

        return forecast_all, forecast_train, forecast_test, forecast_horizon
    except Exception as e:
        print(e)
        raise e
