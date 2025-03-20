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
import math
import matplotlib.pyplot as plt
from torch.cuda.amp import autocast, GradScaler

# Функция для включения MC-Dropout: перевод dropout-слоёв в режим train
def enable_mc_dropout(model: nn.Module):
    model.eval()
    for m in model.modules():
        if isinstance(m, nn.Dropout):
            m.train()

# Набор данных для временных рядов
class TimeSeriesDataset(Dataset):
    def __init__(self, data: np.ndarray, seq_length: int, horizon: int):
        self.data = data
        self.seq_length = seq_length
        self.horizon = horizon

    def __len__(self):
        length = len(self.data) - self.seq_length - self.horizon + 1
        return max(0, length)

    def __getitem__(self, idx):
        x = self.data[idx: idx + self.seq_length]
        y = self.data[idx + self.seq_length: idx + self.seq_length + self.horizon, 0]
        return torch.FloatTensor(x), torch.FloatTensor(y)

# Модуль внимания
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

# Positional Encoding для Transformer
class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 5000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)
        position = torch.arange(max_len).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2) * (-math.log(10000.0) / d_model))
        pe = torch.zeros(max_len, d_model)
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.pe[:x.size(1)]
        return self.dropout(x)

# Модель Transformer для прогнозирования
class TransformerModel(nn.Module):
    def __init__(self, input_size: int, d_model: int, nhead: int,
                 num_encoder_layers: int, num_decoder_layers: int,
                 dim_feedforward: int, dropout: float, horizon: int,
                 activation: str = 'gelu', use_encoder: bool = True,
                 use_decoder: bool = False):
        super().__init__()
        self.d_model = d_model
        self.use_encoder = use_encoder
        self.use_decoder = use_decoder

        self.input_proj = nn.Linear(input_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model, dropout)

        if use_encoder:
            encoder_layer = nn.TransformerEncoderLayer(
                d_model, nhead, dim_feedforward, dropout, activation=activation)
            self.encoder = nn.TransformerEncoder(encoder_layer, num_encoder_layers)

        if use_decoder:
            decoder_layer = nn.TransformerDecoderLayer(
                d_model, nhead, dim_feedforward, dropout, activation=activation)
            self.decoder = nn.TransformerDecoder(decoder_layer, num_decoder_layers)

        self.output_layer = nn.Linear(d_model, horizon)
        self._init_weights()

    def _init_weights(self):
        for p in self.parameters():
            if p.dim() > 1:
                nn.init.xavier_uniform_(p)

    def forward(self, src: torch.Tensor):
        # src: [batch, seq_length, features]
        src = self.input_proj(src) * math.sqrt(self.d_model)
        src = self.pos_encoder(src)
        if self.use_encoder:
            memory = self.encoder(src)
        else:
            memory = src
        if self.use_decoder:
            # Создаём нулевой decoder input той же размерности, что и src
            output = self.decoder(torch.zeros_like(src), memory)
        else:
            output = memory
        # Используем последний временной шаг для прогноза
        return self.output_layer(output[:, -1, :])

# Механизм ранней остановки
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

# Функция создания признаков из временного ряда
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
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    elif 'W' in seasonality:
        df['week'] = df.index.isocalendar().week
        df['month'] = df.index.month
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    elif 'D' in seasonality:
        df['day'] = df.index.day
        df['weekday'] = df.index.weekday
    df.dropna(inplace=True)
    return df

# Функция обратного преобразования нормализованных данных
def inverse_transform_target(scaler: MinMaxScaler, y_norm: np.ndarray, target_index: int = 0) -> np.ndarray:
    data_min = scaler.data_min_[target_index]
    data_max = scaler.data_max_[target_index]
    return y_norm * (data_max - data_min) + data_min

# Функция обучения модели с кросс-валидацией
def train_model(model, train_data, params, horizon, device, loss_fn, optimizer, scheduler, amp_scaler, early_stopping, splits):
    best_val_loss = np.inf
    best_model_state = None
    trained = False
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
            epoch_train_loss = 0.0
            for x, y in train_loader:
                x, y = x.to(device), y.to(device)
                optimizer.zero_grad()
                with autocast(enabled=(amp_scaler is not None)):
                    output = model(x)
                    loss = loss_fn(output, y)
                if amp_scaler:
                    amp_scaler.scale(loss).backward()
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    amp_scaler.step(optimizer)
                    amp_scaler.update()
                else:
                    loss.backward()
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    optimizer.step()
                epoch_train_loss += loss.item()
            model.eval()
            epoch_val_loss = 0.0
            with torch.no_grad():
                for x, y in val_loader:
                    x, y = x.to(device), y.to(device)
                    with autocast(enabled=(amp_scaler is not None)):
                        output = model(x)
                        loss = loss_fn(output, y)
                    epoch_val_loss += loss.item()
            avg_val_loss = epoch_val_loss / len(val_loader)
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                best_model_state = model.state_dict()
            scheduler.step()
            early_stopping(avg_val_loss)
            if early_stopping.early_stop:
                break
        if early_stopping.early_stop:
            break
    return trained, best_model_state

# Функция fallback‑обучения модели на полном наборе данных
def train_full_model(model, train_data, params, horizon, device, loss_fn, optimizer, scheduler, amp_scaler, early_stopping):
    best_train_loss = np.inf
    best_model_state = None
    train_loader = DataLoader(
        TimeSeriesDataset(train_data, params['seq_length'], horizon),
        batch_size=params['batch_size'],
        shuffle=True
    )
    for epoch in range(params['epochs']):
        model.train()
        epoch_train_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            with autocast(enabled=(amp_scaler is not None)):
                output = model(x)
                loss = loss_fn(output, y)
            if amp_scaler:
                amp_scaler.scale(loss).backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                amp_scaler.step(optimizer)
                amp_scaler.update()
            else:
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
            epoch_train_loss += loss.item()
        avg_train_loss = epoch_train_loss / len(train_loader)
        if avg_train_loss < best_train_loss:
            best_train_loss = avg_train_loss
            best_model_state = model.state_dict()
        scheduler.step()
        early_stopping(avg_train_loss)
        if early_stopping.early_stop:
            break
    return best_model_state

# Функция прогнозирования батчами с использованием MC-Dropout
def make_forecast(model: nn.Module, data_loader: DataLoader, params, device, amp_scaler) -> np.ndarray:
    if params['mc_dropout']:
        enable_mc_dropout(model)
    else:
        model.eval()
    forecasts = []
    with torch.no_grad():
        for x, _ in data_loader:
            x = x.to(device)
            if params['mc_dropout']:
                preds = [model(x).cpu().numpy() for _ in range(params['mc_samples'])]
                forecasts.append(np.mean(preds, axis=0))
            else:
                forecasts.append(model(x).cpu().numpy())
    return np.concatenate(forecasts, axis=0) if forecasts else np.array([])

# Функция генерации исторического прогноза по батчевым прогнозам
def generate_historical_forecast(feature_df: pd.DataFrame, all_forecasts: np.ndarray,
                                 scaler: MinMaxScaler, params, horizon: int) -> pd.DataFrame:
    forecast_steps = [
        (feature_df.index[params['seq_length'] + i + h],
         all_forecasts[i, h] * (scaler.data_max_[0] - scaler.data_min_[0]) + scaler.data_min_[0])
        for i in range(all_forecasts.shape[0])
        for h in range(horizon)
        if params['seq_length'] + i + h < len(feature_df)
    ]
    forecast_df = pd.DataFrame(forecast_steps, columns=['ds', 'y_forecast'])
    forecast_df = forecast_df.groupby('ds')['y_forecast'].mean().reset_index()
    return forecast_df

# Функция итеративного прогнозирования будущих значений
def iterative_forecast(model: nn.Module, scaled_data: np.ndarray, params, scaler: MinMaxScaler,
                         horizon: int, device: str, amp_scaler) -> List[float]:
    last_seq = scaled_data[-params['seq_length']:]
    current_seq = last_seq.copy()
    future_forecasts = []
    for i in range(horizon):
        try:
            x = torch.FloatTensor(current_seq[-params['seq_length']:]).unsqueeze(0).to(device)
            with torch.no_grad(), autocast(enabled=(amp_scaler is not None)):
                pred = model(x).cpu().numpy()[0]
            future_value = pred[0] * (scaler.data_max_[0] - scaler.data_min_[0]) + scaler.data_min_[0]
            future_forecasts.append(future_value)
            new_row = np.zeros_like(scaled_data[0])
            new_row[0] = (pred[0] - scaler.data_min_[0]) / (scaler.data_max_[0] - scaler.data_min_[0])
            current_seq = np.vstack([current_seq, new_row])
        except Exception as e:
            print(f"Ошибка при прогнозировании шага {i}: {e}")
            future_forecasts.extend([future_forecasts[-1]] * (horizon - i))
            break
    return future_forecasts

# Основная функция прогнозирования с использованием Transformer
def transformer_forecast(
        df: pd.DataFrame,
        horizon: int,
        test_size: int,
        dt_name: str,
        y_name: str,
        freq: str,
        confidence_level: float = 95,
        model_params: Optional[Dict] = None,
        seasonality: str = 'MS',
        criterion: str = 'MSE',
        optimizer_type: str = 'AdamW',
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
) -> Union[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    # Параметры по умолчанию
    default_params = {
        'seq_length': 24,
        'lag_periods': 12,
        'window_sizes': [6, 12, 24],
        'd_model': 256,
        'nhead': 8,
        'num_encoder_layers': 3,
        'num_decoder_layers': 1,
        'dim_feedforward': 512,
        'dropout': 0.2,
        'batch_size': 64,
        'epochs': 150,
        'learning_rate': 0.0005,
        'patience': 20,
        'delta': 0.001,
        'n_splits': 3,
        'mc_dropout': True,
        'mc_samples': 100,
        'use_encoder': True,
        'use_decoder': False,
        'activation': 'gelu'
    }
    if model_params:
        default_params.update(model_params)
    params = default_params

    print("Размер входного DataFrame:", df.shape)

    if isinstance(params.get('window_sizes'), str):
        try:
            params['window_sizes'] = [int(x.strip()) for x in params['window_sizes'].split(',')
                                      if x.strip().isdigit()]
        except Exception as e:
            raise ValueError("Ошибка преобразования window_sizes: " + str(e))

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

    model = TransformerModel(
        input_size=scaled_data.shape[1],
        d_model=params['d_model'],
        nhead=params['nhead'],
        num_encoder_layers=params['num_encoder_layers'],
        num_decoder_layers=params['num_decoder_layers'],
        dim_feedforward=params['dim_feedforward'],
        dropout=params['dropout'],
        horizon=horizon,
        activation=params['activation'],
        use_encoder=params['use_encoder'],
        use_decoder=params['use_decoder']
    ).to(device)

    # Выбор функции потерь
    if criterion == 'MSE':
        loss_fn = nn.MSELoss()
    elif criterion == 'SmoothL1':
        loss_fn = nn.SmoothL1Loss()
    elif criterion == 'MAE':
        loss_fn = nn.MSELoss()  # или можно заменить на L1Loss
    elif criterion == 'Huber':
        loss_fn = nn.HuberLoss()
    else:
        raise ValueError("Unsupported loss function для Transformer. Используйте 'MSE' или 'SmoothL1'.")

    # Выбор оптимизатора
    if optimizer_type == 'AdamW':
        optimizer = optim.AdamW(model.parameters(), lr=params['learning_rate'],
                                weight_decay=params.get('weight_decay', 1e-4))
    elif optimizer_type == 'Adam':
        optimizer = optim.Adam(model.parameters(), lr=params['learning_rate'])
    elif optimizer_type == 'SGD':
        optimizer = optim.SGD(model.parameters(), lr=params['learning_rate'])
    elif optimizer_type == 'RMSprop':
        optimizer = optim.RMSprop(model.parameters(), lr=params['learning_rate'])
    else:
        raise ValueError("Unsupported optimizer type для Transformer. Используйте 'AdamW', 'Adam', 'SGD' или 'RMSprop'.")

    scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=10, T_mult=2)
    early_stopping = EarlyStopping(patience=params['patience'], delta=params['delta'])
    amp_scaler = GradScaler() if device == 'cuda' else None

    best_model_state = None
    trained, best_model_state = train_model(
        model, train_data, params, horizon, device, loss_fn, optimizer, scheduler, amp_scaler, early_stopping, splits
    )
    if not trained:
        best_model_state = train_full_model(
            model, train_data, params, horizon, device, loss_fn, optimizer, scheduler, amp_scaler, early_stopping
        )
    if best_model_state is not None:
        model.load_state_dict(best_model_state)

    # Прогнозирование батчами с MC-Dropout
    full_dataset = TimeSeriesDataset(scaled_data, params['seq_length'], horizon)
    full_loader = DataLoader(full_dataset, batch_size=params['batch_size'], shuffle=False)
    all_forecasts = make_forecast(model, full_loader, params, device, amp_scaler)
    print("Размер all_forecasts:", all_forecasts.shape)

    # Генерация исторического прогноза
    forecast_df = generate_historical_forecast(feature_df, all_forecasts, scaler, params, horizon)
    forecast_all = pd.merge(
        feature_df[[y_name]].reset_index().rename(columns={y_name: 'y_fact'}),
        forecast_df,
        on='ds',
        how='left'
    )

    residuals = forecast_all['y_fact'] - forecast_all['y_forecast']
    std_val = residuals.std() if residuals.std() > 0 else 1e-5
    z_score = 1.96
    forecast_all['yhat_lower'] = forecast_all['y_forecast'] - z_score * std_val
    forecast_all['yhat_upper'] = forecast_all['y_forecast'] + z_score * std_val

    split_idx = len(forecast_all) - test_size
    forecast_train = forecast_all.iloc[:split_idx]
    forecast_test = forecast_all.iloc[split_idx:]

    # Итеративное прогнозирование будущих значений
    future_forecasts = iterative_forecast(model, scaled_data, params, scaler, horizon, device, amp_scaler)
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

    # Замена бесконечностей и NaN
    for df_ in [forecast_all, forecast_train, forecast_test, forecast_horizon]:
        df_.replace([np.inf, -np.inf], np.nan, inplace=True)
        df_.fillna(0, inplace=True)

    return forecast_all, forecast_train, forecast_test, forecast_horizon
