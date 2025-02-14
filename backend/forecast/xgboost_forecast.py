# forecast/xgboost_model.py

import pandas as pd
import numpy as np
from xgboost import XGBRegressor

def apply_confidence_intervals(df_forecast, confidence_level):
    if 'yhat_lower' not in df_forecast.columns or 'yhat_upper' not in df_forecast.columns:
        margin = (100 - confidence_level) / 100.0
        df_forecast['yhat_lower'] = df_forecast['y_forecast'] * (1 - margin)
        df_forecast['yhat_upper'] = df_forecast['y_forecast'] * (1 + margin)
    return df_forecast

def make_lags(series, lags=7):
    """
    Пример: создаёт DataFrame с колонками:
      y(t), lag_1(t-1), lag_2(t-2), ..., lag_n(t-n)
    """
    df = pd.DataFrame({'y': series})
    for i in range(1, lags + 1):
        df[f'lag_{i}'] = df['y'].shift(i)
    return df

def xgboost_forecast(df,
                     horizon,
                     test_size,
                     dt_name,
                     y_name,
                     freq,
                     confidence_level=95):
    """
    Упрощённое XGBoost-прогнозирование.
    1) Приводим данные к нужному виду.
    2) Генерируем лаги для train/test.
    3) Обучаем XGBoost.
    4) Формируем forecast_all (train + test), потом отдельно
       forecast_train, forecast_test.
    5) Рекурсивно прогнозируем будущее на horizon шагов => forecast_horizon.
    """
    data = df.copy()
    data[dt_name] = pd.to_datetime(data[dt_name])
    data.set_index(dt_name, inplace=True)
    data = data.sort_index()
    # Частота
    data = data.asfreq(freq=freq)
    data = data.fillna(0)
    data[y_name] = data[y_name].astype(float)

    # Исходный ряд
    full_series = data[y_name]

    # 1) Генерируем лаги (например 7)
    lags = 7
    df_lags = make_lags(full_series, lags=lags)
    df_lags['ds'] = df_lags.index

    # Обрезаем NaN (первые 7 строк)
    df_lags = df_lags.dropna()

    # Делим на train/test
    n = len(df_lags)
    if test_size > 0 and test_size < n:
        train_df = df_lags.iloc[:(n - test_size)].copy()
        test_df = df_lags.iloc[(n - test_size):].copy()
    else:
        train_df = df_lags.copy()
        test_df = pd.DataFrame(columns=df_lags.columns)

    # Формируем X_train, y_train, X_test, y_test
    feature_cols = [c for c in train_df.columns if c.startswith('lag_')]
    X_train = train_df[feature_cols]
    y_train = train_df['y']
    X_test = test_df[feature_cols] if not test_df.empty else pd.DataFrame()
    y_test = test_df['y'] if not test_df.empty else pd.Series()

    # 2) Обучаем XGBRegressor
    model = XGBRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 3) Прогноз на train (fitted values)
    train_pred = model.predict(X_train)

    # 4) Прогноз на test (можно делать "batch", но лучше пошагово)
    #   Для упрощения используем batch-подход (могут быть ошибки при генерации новых лагов).
    test_pred = []
    if not test_df.empty:
        test_pred = model.predict(X_test)

    # Дата/факт для train/test
    train_df['y_forecast'] = train_pred
    test_df['y_forecast'] = test_pred if len(test_pred) else np.nan

    # Соединяем обратно
    all_df = pd.concat([train_df, test_df], axis=0)
    all_df = all_df.sort_values('ds')
    all_df.rename(columns={'y': 'y_fact'}, inplace=True)
    all_df['model_name'] = 'XGBoost'
    # Интервалы
    all_df['yhat_lower'] = np.nan
    all_df['yhat_upper'] = np.nan
    all_df = apply_confidence_intervals(all_df, confidence_level)

    # Сохраняем только нужные колонки
    forecast_all = all_df[['ds','y_fact','y_forecast','yhat_lower','yhat_upper','model_name']].copy()

    # Отдельно
    forecast_train = forecast_all[forecast_all['ds'].isin(train_df['ds'])].copy()
    forecast_test = forecast_all[forecast_all['ds'].isin(test_df['ds'])].copy()

    # 5) Прогноз на будущее (horizon):
    #    Рекурсивный прогноз:
    #    Берём последнюю доступную строку, генерируем лаги, один шаг -> добавляем ...
    last_series = full_series.copy()
    future_predictions = []
    current_input = last_series[-lags:].values  # последние 7 значений

    current_date = last_series.index.max()

    for step in range(horizon):
        # формируем вектор признаков (lag_1..lag_7)
        X_new = current_input[::-1]  # т.к. lag_1 = последнее значение, lag_7 = более старое
        # перевернём обратно, чтобы порядок lag_1...lag_7 был корректным:
        X_new = X_new.reshape(1, -1)

        y_new = model.predict(X_new)[0]  # прогноз на 1 шаг
        future_predictions.append(y_new)

        # обновляем current_input
        current_input = np.append(current_input[1:], y_new)

    future_dates = pd.date_range(current_date + pd.Timedelta(freq), periods=horizon, freq=freq)
    future_df = pd.DataFrame({
        'ds': future_dates,
        'y_forecast': future_predictions,
        'model_name': 'XGBoost'
    })
    future_df['yhat_lower'] = np.nan
    future_df['yhat_upper'] = np.nan
    future_df = apply_confidence_intervals(future_df, confidence_level)

    forecast_horizon = future_df[['ds','y_forecast','yhat_lower','yhat_upper','model_name']].copy()

    return forecast_all, forecast_train, forecast_test, forecast_horizon
