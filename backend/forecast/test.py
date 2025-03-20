# =============================================================================
# Пример использования
# =============================================================================

import pandas as pd
from forecast.transformers_forecast import transformer_forecast
import matplotlib.pyplot as plt
if __name__ == '__main__':
    # Загрузка данных (убедитесь, что файл 'count_project_data_week_laptop.csv' существует и содержит столбцы 'date' и 'product_count')
    df = pd.read_csv('count_project_data_week_laptop.csv')
    print("Первые строки исходных данных:")
    print(df.head())

    # Параметры для Transformer (переименованы и адаптированы для модели Transformer)
    transformer_params = {
        'seq_length': 24,
        'lag_periods': 12,
        'window_sizes': [6, 12, 24],
        'd_model': 256,
        'nhead': 8,
        'num_encoder_layers': 3,
        'num_decoder_layers': 1,
        'dim_feedforward': 512,
        'dropout': 0.2,
        'batch_size': 128,
        'epochs': 60,
        'learning_rate': 0.0005,
        'patience': 20,
        'delta': 0.001,
        'n_splits': 3,
        'mc_dropout': True,
        'mc_samples': 200,
        'use_encoder': True,
        'use_decoder': False,
        'activation': 'gelu'
    }

    # Запуск прогнозирования
    forecast_all, forecast_train, forecast_test, forecast_horizon = transformer_forecast(
        df=df,
        horizon=12,
        test_size=8,
        dt_name='date',
        y_name='product_count',
        freq='W-MON',
        confidence_level=95,
        model_params=transformer_params,
        seasonality='W',  # Для недельной сезонности
        criterion='Huber',
        optimizer_type='AdamW'
    )

    # Вывод результатов
    print("Общий DataFrame с прогнозами:")
    print(forecast_all.head())
    print(forecast_all)

    # Построение графиков
    plt.figure(figsize=(12, 6))
    plt.plot(pd.to_datetime(forecast_all['ds']), forecast_all['y_fact'], label='Фактические значения')
    plt.plot(pd.to_datetime(forecast_all['ds']), forecast_all['y_forecast'], label='Прогноз')
    plt.plot(pd.to_datetime(df['date']), df['product_count'], label='Исходные данные')
    plt.xlabel('Дата')
    plt.ylabel('Количество продукта')
    plt.legend()
    plt.show()