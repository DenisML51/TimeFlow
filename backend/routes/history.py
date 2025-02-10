from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.prediction import Prediction
from models.user import User
from database import get_db
from utils.auth import get_current_user

history_router = APIRouter()

@history_router.get("/history")
async def get_upload_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prediction).where(Prediction.user_id == user.id))
    history = result.scalars().all()
    return [{"id": pred.id, "file_name": pred.file_name, "date": pred.created_at} for pred in history]

