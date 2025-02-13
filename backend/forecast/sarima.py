# forecast/sarima.py

import pandas as pd
import numpy as np

# Если используем pmdarima:
from pmdarima import ARIMA

def apply_conf_intervals(df_forecast, confidence_level):
    """
    Если нет столбцов yhat_lower / yhat_upper, формируем их
    на основе y_forecast и процента доверия (аналогично Prophet).
    """
    if 'yhat_lower' not in df_forecast.columns or 'yhat_upper' not in df_forecast.columns:
        margin = (100 - confidence_level) / 100.0
        df_forecast['yhat_lower'] = df_forecast['y_forecast'] * (1 - margin)
        df_forecast['yhat_upper'] = df_forecast['y_forecast'] * (1 + margin)
    return df_forecast

def sarima_forecast(df,
                    horizon,
                    test_size,
                    dt_name,
                    y_name,
                    freq,
                    confidence_level=95):
    """
    Аналогичная логика:
      1) Приводим DataFrame к нужной форме (дата -> индекс, сортируем)
      2) Если test_size > 0, делим историю на train/test
      3) Обучаем SARIMA на train-данных (используем pmdarima.ARIMA.auto_arima)
      4) Делаем прогноз:
         - на всю историю (чтобы получить fittedvalues) => forecast_all
         - отдельно train-участок => forecast_train
         - отдельно test-участок => forecast_test
         - будущее на `horizon` шагов => forecast_horizon
    """
    data = df.copy()
    data[dt_name] = pd.to_datetime(data[dt_name])
    data.set_index(dt_name, inplace=True)
    data = data.sort_index()
    # Устанавливаем частоту
    data = data.asfreq(freq=freq)
    # Заполняем пропуски нулями (или методами наподобие ffill/bfill)
    data = data.fillna(0)
    data[y_name] = data[y_name].astype(float)

    # Исходная таблица для удобства
    df_sarima = pd.DataFrame({
        'ds': data.index,
        'y': data[y_name]
    }).sort_values('ds')

    n = len(df_sarima)
    if test_size > 0 and test_size < n:
        train_df = df_sarima.iloc[:(n - test_size)].copy()
        test_df = df_sarima.iloc[(n - test_size):].copy()
    else:
        train_df = df_sarima.copy()
        test_df = pd.DataFrame(columns=['ds', 'y'])

    # 2) Обучение SARIMA
    #   auto_arima подберёт (p,d,q)(P,D,Q)m, где m - сезонный период
    #   Для упрощения можно выставить сезонность = False или задать period.
    #   freq='D' => сезонный период может быть 7 (неделя) или 365 (год), в зависимости от задачи.
    model = ARIMA(
        start_p=1, start_q=1,
        seasonal=False,  # для простоты, если нужна сезонность — seasonal=True + m=7/12/...
        suppress_warnings=True
    ).fit(train_df['y'])

    # 3) Прогноз на всю историю (All History)
    #   Здесь можно использовать fittedvalues
    #   Но в pmdarima .predict_in_sample(...) даёт прогноз
    #   или model.arima_res_ (внутренний ARIMAResults)
    fitted_vals = model.predict_in_sample(start=0, end=len(train_df)-1)
    # pmdarima выдаёт Series длины train. Для всей истории (train + test) придётся ещё
    # дообучать или просто склеить факты. Для упрощения: forecast_all = train + test
    # но для test-участка значения SARIMA (без дообучения)...

    # Реализуем грубо:
    # - "all" = train + test факты
    # - "fitted" = модельная оценка на train, test без прогноза (можно 0)
    all_df = df_sarima.copy()
    all_df['y_forecast'] = 0.0
    all_df.loc[train_df.index, 'y_forecast'] = fitted_vals.values

    all_df.rename(columns={'y': 'y_fact'}, inplace=True)

    # Укажем промежуточные столбцы yhat_lower / yhat_upper (нет точных доверительных интервалов)
    all_df['yhat_lower'] = np.nan
    all_df['yhat_upper'] = np.nan
    all_df['model_name'] = 'SARIMA'

    # Применяем упрощённое добавление доверительных интервалов
    all_df = apply_conf_intervals(all_df, confidence_level)

    # forecast_all
    forecast_all = all_df[['ds','y_fact','y_forecast','yhat_lower','yhat_upper','model_name']].copy()

    # train-участок
    forecast_train = forecast_all[forecast_all['ds'].isin(train_df['ds'])].copy()
    # test-участок
    forecast_test = forecast_all[forecast_all['ds'].isin(test_df['ds'])].copy()

    # 4) Прогноз на будущее (horizon шагов)
    #   model.predict(n_periods = horizon)
    future_index = pd.date_range(
        start= df_sarima['ds'].max() + pd.Timedelta(freq),
        periods=horizon,
        freq=freq
    )
    future_forecast_vals = model.predict(n_periods=horizon)
    future_df = pd.DataFrame({
        'ds': future_index,
        'y_forecast': future_forecast_vals
    })
    future_df['model_name'] = 'SARIMA'
    future_df['yhat_lower'] = np.nan
    future_df['yhat_upper'] = np.nan

    future_df = apply_conf_intervals(future_df, confidence_level)
    forecast_horizon = future_df[['ds','y_forecast','yhat_lower','yhat_upper','model_name']].copy()

    return forecast_all, forecast_train, forecast_test, forecast_horizon
