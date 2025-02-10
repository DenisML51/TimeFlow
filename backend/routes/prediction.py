from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd
import os
import json

prediction_router = APIRouter()

@prediction_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    upload_folder = "./uploads"
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    file_path = os.path.join(upload_folder, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Загружаем CSV в pandas
    data = pd.read_csv(file_path)

    # Приводим к JSON-совместимому формату
    df_head = data.head().to_dict(orient="records")
    full_data = data.to_dict(orient="records")
    columns = list(data.columns)

    os.remove(file_path)

    return {"df_head": df_head, "full_data": full_data, "columns": columns}
