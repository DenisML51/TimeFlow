import pandas as pd 
from prophet import Prophet

def prophet(df, horizon, history, dt_name, y_name, freq):
    data = df.copy()
    data.set_index(f'{dt_name}', inplace=True)
    data = data.sort_index()
    data.index = pd.to_datetime(data.index)
    data = data.asfreq(freq=freq)
    data = data.fillna(0)

    data[y_name] = data[y_name].astype(float)

    train_data = data.iloc[:]

    m1 = Prophet()
    df = pd.DataFrame(
        {
            'ds': pd.to_datetime(train_data.index),
            'y': train_data[y_name]
        }
    )

    df = df.sort_values('ds')
    m1.fit(df)

    forecast_time = m1.make_future_dataframe(periods=horizon, freq=freq)
    forecast = m1.predict(forecast_time)

    if history > 0:
        forecast_hist = pd.DataFrame(
            {
                'dt': forecast.iloc[:-horizon]['ds'],
                'y_fact': [x for x in df['y']],
                'y_forecast': forecast.iloc[:-horizon]['yhat'],
                'model_name': 'Prophet'
            }
        )
    else:
        forecast_hist = 0

    if horizon > 0:
        forecast_horizon = pd.DataFrame(
            {
                'dt': forecast.iloc[-horizon:]['ds'],
                'y_forecast': forecast[-horizon:]['yhat'],
                'model_name': 'Prophet'
            }
        ) 
    else:
        forecast_horizon = 0

    return forecast_hist, forecast_horizon


