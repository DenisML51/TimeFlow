import pandas as pd
from prophet import Prophet

def apply_confidence_intervals(forecast_df, confidence_level):
    """
    Если в прогнозе отсутствуют столбцы yhat_lower и yhat_upper,
    устанавливаем их в None (так как Prophet при корректном параметре interval_width
    должен их генерировать).
    """
    if 'yhat_lower' in forecast_df.columns and 'yhat_upper' in forecast_df.columns:
        return forecast_df
    forecast_df['yhat_lower'] = None
    forecast_df['yhat_upper'] = None
    return forecast_df

def prophet_forecast(df,
                     horizon,
                     test_size,
                     dt_name,
                     y_name,
                     freq,
                     confidence_level=95):
    """
    Если test_size > 0, делим данные на train и test.
    Возвращаем:
      - forecast_all: прогноз и фактические значения для всей истории,
      - forecast_train: для тренировочной части,
      - forecast_test: для тестовой части,
      - forecast_horizon: прогноз на будущий горизонт.
    """
    try:
        data = df.copy()
        data[dt_name] = pd.to_datetime(data[dt_name])
        data.sort_values(dt_name, inplace=True)
        data.set_index(dt_name, inplace=True)
        # Применяем forward fill, чтобы заполнить пропущенные значения (без вставки нулей)
        data = data.ffill()
        # Приводим временной ряд к регулярной частоте
        data = data.asfreq(freq=freq)
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
            train_df = df_prophet.copy()
            test_df = pd.DataFrame(columns=['ds', 'y'])

        # Инициализируем Prophet с заданным уровнем доверия
        m = Prophet(interval_width=confidence_level / 100.0)
        m.fit(train_df)

        # Прогноз для всей истории
        forecast_all = m.predict(df_prophet[['ds']])
        forecast_all = apply_confidence_intervals(forecast_all, confidence_level)
        # Сливаем фактические значения (y) с прогнозом
        forecast_all = forecast_all.merge(df_prophet, on='ds', how='left')
        forecast_all.rename(columns={'y': 'y_fact', 'yhat': 'y_forecast'}, inplace=True)
        forecast_all['model_name'] = 'Prophet'
        forecast_all = forecast_all[['ds', 'y_fact', 'y_forecast', 'yhat_lower', 'yhat_upper', 'model_name']]

        train_forecast = forecast_all[forecast_all['ds'].isin(train_df['ds'])].copy()
        test_forecast = forecast_all[forecast_all['ds'].isin(test_df['ds'])].copy()

        # Прогноз для будущего горизонта
        last_date = df_prophet['ds'].max()
        future = m.make_future_dataframe(periods=horizon, freq=freq, include_history=True)
        future = future[future['ds'] > last_date]
        future_fore = m.predict(future)
        future_fore = apply_confidence_intervals(future_fore, confidence_level)
        future_fore.rename(columns={'yhat': 'y_forecast'}, inplace=True)
        forecast_horizon = future_fore[['ds', 'y_forecast', 'yhat_lower', 'yhat_upper']].copy()
        forecast_horizon['model_name'] = 'Prophet'

        return forecast_all, train_forecast, test_forecast, forecast_horizon
    except Exception as e:
        print("Ошибка при прогнозировании:", e)
        raise e
