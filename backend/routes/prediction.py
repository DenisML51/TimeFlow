import os
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from models.history import History
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from utils.auth import get_current_user
from models.user import User


prediction_router = APIRouter()

@prediction_router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Создаем папку, сохраняем файл, читаем CSV с поддержкой NaN и т.д.
    upload_folder = "./uploads"
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    file_path = os.path.join(upload_folder, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        data = pd.read_csv(file_path, na_values=["NaN", "nan", ""])
    except Exception:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Неверный формат CSV файла")

    df_head = data.head().to_dict(orient="records")
    full_data = data.to_dict(orient="records")
    columns = list(data.columns)

    os.remove(file_path)
    
    # Записываем в историю: например, "Загружен файл: <имя файла>"
    await record_history(db, current_user.id, f"Загружен файл: {file.filename}")
    
    return {"df_head": df_head, "full_data": full_data, "columns": columns}


async def record_history(db: AsyncSession, user_id: int, action: str):
    history = History(user_id=user_id, action=action)
    db.add(history)
    await db.commit()


