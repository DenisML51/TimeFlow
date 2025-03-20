import os
import pandas as pd
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from utils.auth import get_current_user
from models.user import User
from services.history_service import record_history_bg
from fastapi.concurrency import run_in_threadpool
from statsmodels.tsa.stattools import adfuller, kpss
from statsmodels.stats.diagnostic import acorr_ljungbox
import numpy as np
import logging

logger = logging.getLogger("prediction")
logger.setLevel(logging.DEBUG)

prediction_router = APIRouter()

@prediction_router.post("/upload")
async def upload_file(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    upload_folder = "./uploads"
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    file_path = os.path.join(upload_folder, file.filename)

    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        logger.error(f"Ошибка сохранения файла: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сохранения файла")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx"]:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Неверный формат файла. Допустимые форматы: CSV и XLSX.")

    try:
        if ext == ".csv":
            data = await run_in_threadpool(pd.read_csv, file_path, na_values=["NaN", "nan", ""])
        else:
            data = await run_in_threadpool(pd.read_excel, file_path, na_values=["NaN", "nan", ""])
    except Exception as e:
        os.remove(file_path)
        logger.error(f"Ошибка обработки файла: {e}")
        raise HTTPException(status_code=400, detail="Ошибка обработки файла. Проверьте корректность формата.")

    df_head = data.head().to_dict(orient="records")
    full_data = data.to_dict(orient="records")
    columns = list(data.columns)

    os.remove(file_path)

    background_tasks.add_task(record_history_bg, current_user.id, f"Загружен файл: {file.filename}")

    return {"df_head": df_head, "full_data": full_data, "columns": columns}

@prediction_router.post("/imputation")
async def imputation_endpoint(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        data_records = payload.get("data")
        date_column = payload.get("date_column")
        value_column = payload.get("value_column")
        method = payload.get("imputationMethod", "linear")
        freq = payload.get("imputationFrequency", "D")
        constant_val = payload.get("imputationConstant", 0)
        if not data_records or not date_column or not value_column:
            raise HTTPException(status_code=400, detail="Неверный формат данных")
        df = pd.DataFrame(data_records)
        df[date_column] = pd.to_datetime(df[date_column])
        df = df.sort_values(by=date_column)
        df = df.set_index(date_column)
        complete_index = pd.date_range(start=df.index.min(), end=df.index.max(), freq=freq)
        df = df.reindex(complete_index)
        df = df.reset_index().rename(columns={"index": date_column})
        if method == "linear":
            df[value_column] = df[value_column].interpolate(method='linear')
        elif method == "forwardFill":
            df[value_column] = df[value_column].fillna(method='ffill')
        elif method == "backwardFill":
            df[value_column] = df[value_column].fillna(method='bfill')
        elif method == "constant":
            df[value_column] = df[value_column].fillna(constant_val)
        else:
            df[value_column] = df[value_column].fillna(method='ffill')
        return df.to_dict(orient="records")
    except Exception as e:
        logger.error(f"Ошибка заполнения пропусков: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@prediction_router.post("/timeseries_tests")
async def timeseries_tests(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"Вызов /timeseries_tests от пользователя: {current_user.id}")
    
    values = payload.get("values")
    if not values or not isinstance(values, list):
        raise HTTPException(status_code=400, detail="Неверный формат данных")
    
    if len(values) < 15:
        raise HTTPException(status_code=400, detail="Слишком мало данных для проведения тестов")
    
    try:
        series = np.array([float(v) for v in values if v is not None], dtype=float)
        if np.isnan(series).any():
            raise HTTPException(status_code=400, detail="Данные содержат NaN")
        
        adf_result = adfuller(series)
        kpss_result = kpss(series, regression='c', nlags="auto")
        lb_result = acorr_ljungbox(series, lags=[10], return_df=True)
        results = {
            "ADF": {"statistic": float(adf_result[0]), "pvalue": float(adf_result[1])},
            "KPSS": {"statistic": float(kpss_result[0]), "pvalue": float(kpss_result[1])},
            "Ljung-Box": lb_result.to_dict(orient="records")
        }
        return results
    except Exception as e:
        logger.error(f"Ошибка в /timeseries_tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))
