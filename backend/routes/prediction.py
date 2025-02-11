import os
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

prediction_router = APIRouter()

@prediction_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    upload_folder = "./uploads"
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    file_path = os.path.join(upload_folder, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        # Поддержка NaN-значений: пустые строки, "NaN", "nan"
        data = pd.read_csv(file_path, na_values=["NaN", "nan", ""])
    except Exception:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Неверный формат CSV файла")

    df_head = data.head().to_dict(orient="records")
    full_data = data.to_dict(orient="records")
    columns = list(data.columns)

    os.remove(file_path)
    return {"df_head": df_head, "full_data": full_data, "columns": columns}
