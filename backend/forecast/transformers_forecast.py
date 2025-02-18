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

# =============================================================================
# Dataset для временных рядов
# =============================================================================
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

# =============================================================================
# Модуль внимания (не используется в Transformer, но оставлен для примера)
# =============================================================================
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

# =============================================================================
# Positional Encoding
# =============================================================================
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

# =============================================================================
# Transformer-модель для прогнозирования
# =============================================================================
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
            # Для decoder создаём нулевой вход той же размерности, что и src
            output = self.decoder(torch.zeros_like(src), memory)
        else:
            output = memory

        # Используем последний временной шаг для прогноза
        return self.output_layer(output[:, -1, :])

# =============================================================================
# Класс ранней остановки (Early Stopping)
# =============================================================================
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

# =============================================================================
# Функция создания признаков: лаги, скользящие статистики и сезонные признаки
# =============================================================================
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

# =============================================================================
# Функция обратного масштабирования для целевой переменной
# =============================================================================
def inverse_transform_target(scaler: MinMaxScaler, y_norm: np.ndarray, target_index: int = 0) -> np.ndarray:
    data_min = scaler.data_min_[target_index]
    data_max = scaler.data_max_[target_index]
    return y_norm * (data_max - data_min) + data_min

# =============================================================================
# Основная функция прогнозирования с использованием Transformer и MC-Dropout
# =============================================================================
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
    # Задаём параметры по умолчанию и обновляем их из model_params
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

    print(df.shape)

    # Если window_sizes передан как строка, преобразуем его в список чисел
    if isinstance(params.get('window_sizes'), str):
        try:
            params['window_sizes'] = [int(x.strip()) for x in params['window_sizes'].split(',') if x.strip().isdigit()]
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
    # test_data используется для формирования DataLoader, если потребуется
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

    # Выбор функции потерь (MSE или SmoothL1)
    if criterion == 'MSE':
        loss_fn = nn.MSELoss()
    elif criterion == 'SmoothL1':
        loss_fn = nn.SmoothL1Loss()
    elif criterion == 'MAE':
        loss_fn = nn.MSELoss()
    elif criterion == 'Huber':
        loss_fn = nn.HuberLoss()
    else:
        raise ValueError("Unsupported loss function for Transformer. Use 'MSE' or 'SmoothL1'.")

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
        raise ValueError("Unsupported optimizer type for Transformer. Use 'AdamW', 'Adam', 'SGD' or 'RMSprop'.")

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
            if early_stopping.early_stop:
                break
    except Exception as foldError:
        raise foldError

    # Если ни один fold не был использован, обучаем модель на полном наборе train_data
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
            scheduler.step(train_loss / len(train_loader))
            early_stopping(train_loss / len(train_loader))
            if early_stopping.early_stop:
                break

    # Функция для прогноза с использованием MC-Dropout
    def make_forecast(data_loader: DataLoader) -> np.ndarray:
        # Чтобы dropout оставался активным, переводим модель в режим train
        model.train()
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

    # Формирование DataFrame с прогнозами (обратное масштабирование)
    forecast_steps = []
    for i in range(all_forecasts.shape[0]):
        for h in range(horizon):
            idx = params['seq_length'] + i + h
            if idx < len(feature_df):
                forecast_value = all_forecasts[i, h] * (scaler.data_max_[0] - scaler.data_min_[0]) + scaler.data_min_[0]
                forecast_steps.append((feature_df.index[idx], forecast_value))
    forecast_df = pd.DataFrame(forecast_steps, columns=['ds', 'y_forecast'])
    forecast_df = forecast_df.groupby('ds')['y_forecast'].mean().reset_index()

    forecast_all = pd.merge(
        feature_df[[y_name]].reset_index().rename(columns={y_name: 'y_fact', feature_df.index.name: 'ds'}),
        forecast_df,
        on='ds',
        how='left'
    )

    # Расчёт доверительных интервалов
    residuals = forecast_all['y_fact'] - forecast_all['y_forecast']
    std_val = residuals.std()
    z_score = 1.96
    forecast_all['yhat_lower'] = forecast_all['y_forecast'] - z_score * std_val
    forecast_all['yhat_upper'] = forecast_all['y_forecast'] + z_score * std_val

    split_idx = len(forecast_all) - test_size
    forecast_train = forecast_all.iloc[:split_idx]
    forecast_test = forecast_all.iloc[split_idx:]

    # Прогноз на будущее
    last_seq = scaled_data[-params['seq_length']:]
    current_seq = last_seq.copy()
    future_forecasts = []
    for _ in range(horizon):
        x = torch.FloatTensor(current_seq[-params['seq_length']:]).unsqueeze(0).to(device)
        with torch.no_grad():
            pred = model(x).cpu().numpy()[0]
        future_value = pred[0] * (scaler.data_max_[0] - scaler.data_min_[0]) + scaler.data_min_[0]
        future_forecasts.append(future_value)
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



