from fastapi import APIRouter, File, UploadFile, Depends
import pandas as pd
import io

predict_router = APIRouter()

# @predict_router.post("/upload/")
# async def upload_file(file: UploadFile = File(...)):
#     contents = await file.read()
#     df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
#     return {"preview": df.head().to_json()}
