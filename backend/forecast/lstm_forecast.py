import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import TimeSeriesSplit
from typing import Dict, Union, Optional, List
import random


class TimeSeriesDataset(Dataset):
    def __init__(self, data: np.ndarray, seq_length: int, horizon: int):
        self.data = data
        self.seq_length = seq_length
        self.horizon = horizon

    def __len__(self):
        length = len(self.data) - self.seq_length - self.horizon + 1
        return max(0, length)

    def __getitem__(self, idx):
        x = self.data[idx:idx + self.seq_length]
        y = self.data[idx + self.seq_length: idx + self.seq_length + self.horizon, 0]
        return torch.FloatTensor(x), torch.FloatTensor(y)


class Attention(nn.Module):
    def __init__(self, hidden_size: int):
        super().__init__()
        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size * 2),
            nn.Tanh(),
            nn.Linear(hidden_size * 2, 1),
        )

    def forward(self, lstm_output: torch.Tensor) -> torch.Tensor:
        attn_weights = torch.softmax(self.attention(lstm_output).squeeze(2), dim=1)
        return torch.sum(lstm_output * attn_weights.unsqueeze(-1), dim=1)


class LSTMRegressor(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int,
                 output_dim: int, dropout: float, device: str, use_attention: bool = True):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.device = device
        self.use_attention = use_attention

        self.lstm = nn.LSTM(
            input_dim, hidden_dim, num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )

        if self.use_attention:
            self.attention = Attention(hidden_dim)

        self.layer_norm = nn.LayerNorm(hidden_dim * 2)
        self.linear = nn.Linear(hidden_dim * 2, output_dim)
        self._init_weights()
        self.relu = nn.ReLU()

    def _init_weights(self):
        for name, param in self.lstm.named_parameters():
            if 'weight_ih' in name:
                nn.init.xavier_normal_(param)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param)
            elif 'bias' in name:
                nn.init.zeros_(param)
        nn.init.xavier_normal_(self.linear.weight)
        nn.init.zeros_(self.linear.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h0 = torch.zeros(self.num_layers * 2, x.size(0), self.hidden_dim).to(self.device)
        c0 = torch.zeros(self.num_layers * 2, x.size(0), self.hidden_dim).to(self.device)
        out, _ = self.lstm(x, (h0, c0))
        if self.use_attention:
            out = self.attention(out)
        else:
            out = out[:, -1, :]
        out = self.layer_norm(out)
        return self.linear(out)


class EarlyStopping:
    def __init__(self, patience=5, delta=0):
        self.patience = patience
        self.delta = delta
        self.counter = 0
        self.best_score = None
        self.early_stop = False

    def __call__(self, val_loss: float):
        if self.best_score is None:
            self.best_score = val_loss
        elif val_loss > self.best_score + self.delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_score = val_loss
            self.counter = 0


def create_features(df: pd.DataFrame, dt_col: str, target_col: str,
                    lag_periods: int, seasonality: str, window_sizes: List[int] = None) -> pd.DataFrame:
    df = df.copy()
    df[dt_col] = pd.to_datetime(df[dt_col])
    df.set_index(dt_col, inplace=True)
    for i in range(1, lag_periods + 1):
        df[f'lag_{i}'] = df[target_col].shift(i)
    if window_sizes:
        for window in window_sizes:
            df[f'rolling_mean_{window}'] = df[target_col].rolling(window=window).mean()
            df[f'rolling_std_{window}'] = df[target_col].rolling(window=window).std()
        df['diff_1'] = df[target_col].diff()
    if 'M' in seasonality:
        df['month'] = df.index.month
    elif 'W' in seasonality:
        df['week'] = df.index.isocalendar().week
    elif 'D' in seasonality:
        df['day'] = df.index.day
        df['weekday'] = df.index.weekday
    df.dropna(inplace=True)
    return df


def inverse_transform_target(scaler: MinMaxScaler, y_norm: np.ndarray, target_index: int = 0) -> np.ndarray:
    data_min = scaler.data_min_[target_index]
    data_max = scaler.data_max_[target_index]
    return y_norm * (data_max - data_min) + data_min



def lstm_forecast(
        df: pd.DataFrame,
        horizon: int,
        test_size: int,
        dt_name: str,
        y_name: str,
        freq: str,
        confidence_level: float = 95,
        model_params: Optional[Dict] = None,
        seasonality: str = 'MS',
        criterion: str = 'Huber',
        optimizer_type: str = 'AdamW',
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
) -> Union[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    default_params = {
        'seq_length': 12,
        'lag_periods': 6,
        'window_sizes': [3, 6, 12],
        'num_layers': 2,
        'hidden_dim': 128,
        'dropout': 0.3,
        'batch_size': 64,
        'epochs': 200,
        'learning_rate': 0.001,
        'patience': 15,
        'delta': 0.001,
        'n_splits': 5,
        'use_attention': True,
        'mc_dropout': True,
        'mc_samples': 100
    }
    if model_params:
        default_params.update(model_params)
    params = default_params

    torch.manual_seed(42)
    np.random.seed(42)
    random.seed(42)

    try:
        df = df.sort_values(dt_name).reset_index(drop=True)
        feature_df = create_features(
            df, dt_name, y_name,
            params['lag_periods'],
            seasonality,
            params['window_sizes']
        )
    except Exception as e:
        raise ValueError("Ошибка при создании признаков: " + str(e))

    if feature_df.empty:
        raise ValueError("После создания признаков DataFrame пуст. Проверьте входные данные и параметры.")


    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(feature_df)


    if len(scaled_data) < test_size + params['seq_length']:
        raise ValueError("Данные слишком малы для заданных test_size и seq_length.")

    train_size = len(scaled_data) - test_size
    train_data = scaled_data[:train_size]
    test_data = scaled_data[train_size - params['seq_length']:]

    tscv = TimeSeriesSplit(n_splits=params['n_splits'])
    splits = list(tscv.split(train_data))

    input_dim = scaled_data.shape[1]
    model = LSTMRegressor(
        input_dim=input_dim,
        hidden_dim=params['hidden_dim'],
        num_layers=params['num_layers'],
        output_dim=horizon,
        dropout=params['dropout'],
        device=device,
        use_attention=params['use_attention']
    ).to(device)

    if criterion == 'MSE':
        loss_fn = nn.MSELoss()
    elif criterion == 'MAE':
        loss_fn = nn.L1Loss()
    elif criterion == 'Huber':
        loss_fn = nn.HuberLoss()
    else:
        raise ValueError("Unsupported loss function")

    if optimizer_type == 'AdamW':
        optimizer = optim.AdamW(model.parameters(), lr=params['learning_rate'], weight_decay=1e-4)
    elif optimizer_type == 'Adam':
        optimizer = optim.Adam(model.parameters(), lr=params['learning_rate'], weight_decay=1e-4)
    elif optimizer_type == 'SGD':
        optimizer = optim.SGD(model.parameters(), lr=params['learning_rate'], momentum=0.9)
    elif optimizer_type == 'RMSprop':
        optimizer = optim.RMSprop(model.parameters(), lr=params['learning_rate'])
    else:
        raise ValueError("Unsupported optimizer type")

    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode='min',
        patience=3,
        factor=0.5
    )

    early_stopping = EarlyStopping(
        patience=params['patience'],
        delta=params['delta']
    )

    trained = False
    try:
        for fold, (train_idx, val_idx) in enumerate(splits):
            train_fold = train_data[train_idx]
            val_fold = train_data[val_idx]
            if len(train_fold) - params['seq_length'] - horizon + 1 <= 0:
                continue
            if len(val_fold) - params['seq_length'] - horizon + 1 <= 0:
                continue

            train_loader = DataLoader(
                TimeSeriesDataset(train_fold, params['seq_length'], horizon),
                batch_size=params['batch_size'],
                shuffle=False
            )
            val_loader = DataLoader(
                TimeSeriesDataset(val_fold, params['seq_length'], horizon),
                batch_size=params['batch_size'],
                shuffle=False
            )

            trained = True
            for epoch in range(params['epochs']):
                model.train()
                train_loss = 0.0
                for x, y in train_loader:
                    x, y = x.to(device), y.to(device)
                    optimizer.zero_grad()
                    output = model(x)
                    loss = loss_fn(output, y)
                    loss.backward()
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    optimizer.step()
                    train_loss += loss.item()

                model.eval()
                val_loss = 0.0
                with torch.no_grad():
                    for x, y in val_loader:
                        x, y = x.to(device), y.to(device)
                        output = model(x)
                        val_loss += loss_fn(output, y).item()

                avg_val_loss = val_loss / len(val_loader)
                scheduler.step(avg_val_loss)
                early_stopping(avg_val_loss)
                if early_stopping.early_stop:
                    break
    except Exception as foldError:
        raise foldError

    if not trained:
        train_loader = DataLoader(
            TimeSeriesDataset(train_data, params['seq_length'], horizon),
            batch_size=params['batch_size'],
            shuffle=True
        )
        for epoch in range(params['epochs']):
            model.train()
            train_loss = 0.0
            for x, y in train_loader:
                x, y = x.to(device), y.to(device)
                optimizer.zero_grad()
                output = model(x)
                loss = loss_fn(output, y)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                train_loss += loss.item()
            scheduler.step(train_loss/len(train_loader))
            early_stopping(train_loss/len(train_loader))
            if early_stopping.early_stop:
                break

    def make_forecast(data_loader: DataLoader) -> np.ndarray:
        model.train(params['mc_dropout'])
        forecasts = []
        with torch.no_grad():
            for x, _ in data_loader:
                x = x.to(device)
                if params['mc_dropout']:
                    preds = [model(x).cpu().numpy() for _ in range(params['mc_samples'])]
                    forecasts.append(np.mean(preds, axis=0))
                else:
                    forecasts.append(model(x).cpu().numpy())
        return np.concatenate(forecasts, axis=0)

    full_dataset = TimeSeriesDataset(scaled_data, params['seq_length'], horizon)
    full_loader = DataLoader(full_dataset, batch_size=params['batch_size'], shuffle=False)
    all_forecasts = make_forecast(full_loader)
    print("Размер all_forecasts:", all_forecasts.shape)

    forecast_steps = []
    for i in range(all_forecasts.shape[0]):
        for h in range(horizon):
            idx = params['seq_length'] + i + h
            if idx < len(feature_df):
                forecast_steps.append((
                    feature_df.index[idx],
                    all_forecasts[i, h] * (scaler.data_max_[0] - scaler.data_min_[0]) + scaler.data_min_[0]
                ))
    forecast_df = pd.DataFrame(forecast_steps, columns=['ds', 'y_forecast'])
    forecast_df = forecast_df.groupby('ds')['y_forecast'].mean().reset_index()

    forecast_all = pd.merge(
        feature_df[[y_name]].reset_index().rename(columns={dt_name: 'ds'}),
        forecast_df,
        on='ds',
        how='left'
    )
    forecast_all.rename(columns={y_name: 'y_fact'}, inplace=True)

    residuals = forecast_all['y_fact'] - forecast_all['y_forecast']
    std_val = residuals.std()
    z_score = 1.96 
    forecast_all['yhat_lower'] = forecast_all['y_forecast'] - z_score * std_val
    forecast_all['yhat_upper'] = forecast_all['y_forecast'] + z_score * std_val

    split_idx = len(forecast_all) - test_size
    forecast_train = forecast_all.iloc[:split_idx]
    forecast_test = forecast_all.iloc[split_idx:]

    last_seq = scaled_data[-params['seq_length']:]
    current_seq = last_seq.copy()
    future_forecasts = []
    for _ in range(horizon):
        x = torch.FloatTensor(current_seq[-params['seq_length']:]).unsqueeze(0).to(device)
        with torch.no_grad():
            pred = model(x).cpu().numpy()[0]
        future_forecasts.append(
            pred[0] * (scaler.data_max_[0] - scaler.data_min_[0]) + scaler.data_min_[0]
        )
        new_row = np.zeros_like(scaled_data[0])
        new_row[0] = (pred[0] - scaler.data_min_[0]) / (scaler.data_max_[0] - scaler.data_min_[0])
        current_seq = np.vstack([current_seq, new_row])

    future_dates = pd.date_range(
        start=forecast_all['ds'].max(),
        periods=horizon + 1,
        freq=freq
    )[1:]
    forecast_horizon = pd.DataFrame({
        'ds': future_dates,
        'y_forecast': future_forecasts,
        'yhat_lower': np.array(future_forecasts) - z_score * std_val,
        'yhat_upper': np.array(future_forecasts) + z_score * std_val
    })

    forecast_all = forecast_all.replace([np.inf, -np.inf], np.nan).fillna(0)
    forecast_train = forecast_train.replace([np.inf, -np.inf], np.nan).fillna(0)
    forecast_test = forecast_test.replace([np.inf, -np.inf], np.nan).fillna(0)
    forecast_horizon = forecast_horizon.replace([np.inf, -np.inf], np.nan).fillna(0)

    return forecast_all, forecast_train, forecast_test, forecast_horizon
