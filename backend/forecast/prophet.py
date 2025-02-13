import pandas as pd 
from prophet import Prophet

def apply_confidence_intervals(forecast_df, confidence_level):
    """
    Если в прогнозе отсутствуют столбцы yhat_lower и yhat_upper,
    вычисляем их на основе среднего прогноза и заданного уровня доверия.
    """
    if 'yhat_lower' not in forecast_df.columns or 'yhat_upper' not in forecast_df.columns:
        margin = (100 - confidence_level) / 100.0
        forecast_df['yhat_lower'] = forecast_df['yhat'] * (1 - margin)
        forecast_df['yhat_upper'] = forecast_df['yhat'] * (1 + margin)
    return forecast_df

def prophet_forecast(df, horizon, include_history, dt_name, y_name, freq, confidence_level=95):
    # Копирование и предварительная обработка данных
    data = df.copy()
    data[dt_name] = pd.to_datetime(data[dt_name])
    data.set_index(dt_name, inplace=True)
    data = data.sort_index()
    data = data.asfreq(freq=freq)
    data = data.fillna(0)
    data[y_name] = data[y_name].astype(float)

    # Формируем DataFrame для Prophet
    df_prophet = pd.DataFrame({
        'ds': data.index,
        'y': data[y_name]
    }).sort_values('ds')

    # Обучение модели Prophet
    m = Prophet()
    m.fit(df_prophet)

    # Формирование прогноза (как для обучающей выборки, так и для будущих периодов)
    future = m.make_future_dataframe(periods=horizon, freq=freq)
    forecast = m.predict(future)

    # Применяем функцию для гарантированного формирования доверительных интервалов
    forecast = apply_confidence_intervals(forecast, confidence_level)

    # Исторический прогноз: выбираем строки, где дата ≤ последней дате обучения,
    # объединяем с фактическими значениями и переименовываем колонки
    if include_history:
        last_train_date = df_prophet['ds'].max()
        hist_forecast = forecast[forecast['ds'] <= last_train_date].copy()
        hist_forecast = hist_forecast.merge(df_prophet, on='ds', how='left')
        hist_forecast.rename(columns={'y': 'y_fact', 'yhat': 'y_forecast'}, inplace=True)
        forecast_hist = hist_forecast[['ds', 'y_fact', 'y_forecast', 'yhat_lower', 'yhat_upper']].copy()
        forecast_hist.loc[:, 'model_name'] = 'Prophet'
    else:
        forecast_hist = None

    # Прогноз для будущего: строки, где дата > последняя дата обучения
    if horizon > 0:
        future_forecast = forecast[forecast['ds'] > df_prophet['ds'].max()].copy()
        future_forecast.rename(columns={'yhat': 'y_forecast'}, inplace=True)
        forecast_horizon = future_forecast[['ds', 'y_forecast', 'yhat_lower', 'yhat_upper']].copy()
        forecast_horizon.loc[:, 'model_name'] = 'Prophet'
    else:
        forecast_horizon = None

    return forecast_hist, forecast_horizon
