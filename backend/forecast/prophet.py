import pandas as pd
from prophet import Prophet

def apply_confidence_intervals(forecast_df, confidence_level):
    """
    Если в прогнозе отсутствуют столбцы yhat_lower и yhat_upper,
    вычисляем их на основе среднего прогноза (yhat) и заданного уровня доверия.
    """
    if 'yhat_lower' not in forecast_df.columns or 'yhat_upper' not in forecast_df.columns:
        margin = (100 - confidence_level) / 100.0
        forecast_df['yhat_lower'] = forecast_df['yhat'] * (1 - margin)
        forecast_df['yhat_upper'] = forecast_df['yhat'] * (1 + margin)
    return forecast_df

def prophet_forecast(df,
                     horizon,
                     test_size,
                     dt_name,
                     y_name,
                     freq,
                     confidence_level=95):
    """
    Если test_size > 0, делим на train/test:
      - train = все, кроме последних test_size точек
      - test = последние test_size точек
    Возвращаем 4 набора:
      - forecast_all: прогноз/факт на всех исторических точках (если нужно)
      - forecast_train: прогноз/факт только на train-части
      - forecast_test: прогноз/факт только на test-части
      - forecast_future: прогноз на горизонте
    """

    # 1. Предобработка данных
    data = df.copy()
    data[dt_name] = pd.to_datetime(data[dt_name])
    data.set_index(dt_name, inplace=True)
    data = data.sort_index()
    data = data.asfreq(freq=freq)
    data = data.fillna(0)
    data[y_name] = data[y_name].astype(float)

    df_prophet = pd.DataFrame({
        'ds': data.index,
        'y': data[y_name]
    }).sort_values('ds')

    n = len(df_prophet)
    if test_size > 0 and test_size < n:
        train_df = df_prophet.iloc[:(n - test_size)].copy()
        test_df = df_prophet.iloc[(n - test_size):].copy()
    else:
        # Нет реального разбиения, вся история - train, test пустой
        train_df = df_prophet.copy()
        test_df = pd.DataFrame(columns=['ds', 'y'])

    # 2. Обучаем модель на train
    m = Prophet(interval_width=confidence_level / 100.0)
    m.fit(train_df)

    # 3. Прогноз на всю историю (All History)
    #    чтобы получить "fitted values" для каждой точки из df_prophet
    forecast_all = m.predict(df_prophet[['ds']])
    forecast_all = apply_confidence_intervals(forecast_all, confidence_level)
    # Соединяем с фактом
    forecast_all = forecast_all.merge(df_prophet, on='ds', how='left')
    forecast_all.rename(columns={'y': 'y_fact', 'yhat': 'y_forecast'}, inplace=True)
    forecast_all['model_name'] = 'Prophet'
    forecast_all = forecast_all[['ds', 'y_fact', 'y_forecast', 'yhat_lower', 'yhat_upper', 'model_name']]

    # 4. Прогноз на train-часть
    train_forecast = forecast_all[forecast_all['ds'].isin(train_df['ds'])].copy()

    # 5. Прогноз на test-часть
    test_forecast = forecast_all[forecast_all['ds'].isin(test_df['ds'])].copy()

    # 6. Прогноз на будущее (horizon)
    future = m.make_future_dataframe(periods=horizon, freq=freq, include_history=False)
    future_fore = m.predict(future)
    future_fore = apply_confidence_intervals(future_fore, confidence_level)

    future_fore.rename(columns={'yhat': 'y_forecast'}, inplace=True)
    forecast_horizon = future_fore[['ds', 'y_forecast', 'yhat_lower', 'yhat_upper']].copy()
    forecast_horizon['model_name'] = 'Prophet'

    return forecast_all, train_forecast, test_forecast, forecast_horizon
