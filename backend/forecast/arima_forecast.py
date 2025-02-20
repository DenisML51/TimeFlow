import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX


def sarima_forecast(df, horizon, test_size, dt_name, y_name, freq, confidence_level=95,
                    order=(1, 1, 1), seasonal_order=(1, 1, 1, 12)):
    try:
        data = df.copy()
        data[dt_name] = pd.to_datetime(data[dt_name])
        data.set_index(dt_name, inplace=True)
        data = data.sort_index()
        data = data.asfreq(freq=freq)
        data = data.ffill().fillna(0)
        data[y_name] = data[y_name].astype(float)

        ts = data[y_name]
        n = len(ts)

        if test_size > 0 and test_size < n:
            train_ts = ts.iloc[:n - test_size]
            test_ts = ts.iloc[n - test_size:]

            model_train = SARIMAX(train_ts, order=order, seasonal_order=seasonal_order)
            model_fit = model_train.fit(disp=False)

            train_pred = model_fit.predict(start=train_ts.index[0], end=train_ts.index[-1])
            forecast_train = pd.DataFrame({
                "ds": train_ts.index,
                "y_fact": train_ts.values,
                "y_forecast": train_pred.values
            })

            test_pred = model_fit.forecast(steps=test_size)
            forecast_test = pd.DataFrame({
                "ds": test_ts.index,
                "y_fact": test_ts.values,
                "y_forecast": test_pred
            })

            forecast_all = forecast_train.copy()
        else:
            model = SARIMAX(ts, order=order, seasonal_order=seasonal_order)
            model_fit = model.fit(disp=False)
            all_pred = model_fit.predict(start=ts.index[0], end=ts.index[-1])
            forecast_all = pd.DataFrame({
                "ds": ts.index,
                "y_fact": ts.values,
                "y_forecast": all_pred.values
            })
            forecast_train = forecast_all.copy()
            forecast_test = pd.DataFrame(columns=["ds", "y_fact", "y_forecast"])

        margin = (100 - confidence_level) / 100.0
        for df_forecast in [forecast_all, forecast_train, forecast_test]:
            if not df_forecast.empty:
                df_forecast["yhat_lower"] = df_forecast["y_forecast"] * (1 - margin)
                df_forecast["yhat_upper"] = df_forecast["y_forecast"] * (1 + margin)
                df_forecast["model_name"] = "SARIMA"

        model_future = SARIMAX(train_ts if (test_size > 0 and test_size < n) else ts,
                               order=order, seasonal_order=seasonal_order).fit(disp=False)
        future_pred = model_future.forecast(steps=horizon)
        last_date = ts.index[-1]
        future_dates = pd.date_range(start=last_date, periods=horizon + 1, freq=freq)[1:]
        forecast_horizon = pd.DataFrame({
            "ds": future_dates,
            "y_forecast": future_pred
        })
        forecast_horizon["yhat_lower"] = forecast_horizon["y_forecast"] * (1 - margin)
        forecast_horizon["yhat_upper"] = forecast_horizon["y_forecast"] * (1 + margin)
        forecast_horizon["model_name"] = "SARIMA"

        return forecast_all, forecast_train, forecast_test, forecast_horizon
    except Exception as e:
        print(e)
        raise e
