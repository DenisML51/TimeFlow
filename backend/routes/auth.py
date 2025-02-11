from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user import User
from utils.auth import get_password_hash, verify_password, create_access_token
from database import get_db
from pydantic import BaseModel

auth_router = APIRouter()

class UserRegister(BaseModel):
    username: str
    password: str

@auth_router.post("/register")
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Пользователь уже существует")
    hashed_password = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "Пользователь успешно зарегистрирован"}

# Новая модель для входа
class UserLogin(BaseModel):
    username: str
    password: str

@auth_router.post("/login")
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(user_data.password, user.hashed_password):
         raise HTTPException(status_code=400, detail="Неверные учетные данные")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token}
