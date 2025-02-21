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

    # Определяем расширение файла
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx"]:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Неверный формат файла. Допустимые форматы: CSV и XLSX.")

    try:
        if ext == ".csv":
            data = await run_in_threadpool(pd.read_csv, file_path, na_values=["NaN", "nan", ""])
        else:  # Для .xlsx
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
