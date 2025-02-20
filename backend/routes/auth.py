from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models.user import User
from models.history import History  
from models.session import SessionState 
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user, create_refresh_token
from database import get_db
from pydantic import BaseModel, EmailStr, Field, validator
import re
from services.history_service import record_history_bg
from config import ALGORITHM, SECRET_KEY
from jose import jwt

auth_router = APIRouter()

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str

    @validator('password')
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError("Пароль должен содержать минимум 8 символов")
        if not re.search(r'[a-z]', v):
            raise ValueError("Пароль должен содержать хотя бы одну строчную букву")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Пароль должен содержать хотя бы одну прописную букву")
        if not re.search(r'\d', v):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        return v

@auth_router.post("/register")
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where((User.username == user_data.username) | (User.email == user_data.email))
    )
    if result.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Пользователь с таким именем или email уже существует")
    hashed_password = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, email=user_data.email, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "Пользователь успешно зарегистрирован"}

class UserLogin(BaseModel):
    username: str
    password: str

@auth_router.post("/login")
async def login(
        user_data: UserLogin,
        response: Response,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.username == user_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверные учетные данные")

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        path="/"
    )

    background_tasks.add_task(record_history_bg, user.id, "Пользователь вошел в систему")
    return {"message": "Успешный вход"}

@auth_router.post("/refresh")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token не предоставлен")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Некорректный refresh token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Некорректный refresh token")

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    new_access_token = create_access_token(data={"sub": username})
    new_refresh_token = create_refresh_token(data={"sub": username})

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        samesite="lax",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        samesite="lax",
        path="/"
    )

    return {"message": "Токены обновлены", "access_token": new_access_token}

@auth_router.get("/me")
async def read_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "email": current_user.email}

@auth_router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(History).where(History.user_id == current_user.id).order_by(History.timestamp.desc())
    )
    history_items = result.scalars().all()
    return [{"action": item.action, "timestamp": item.timestamp} for item in history_items]

@auth_router.post("/logout")
async def logout(response: Response, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    background_tasks.add_task(record_history_bg, current_user.id, "Пользователь вышел из системы")
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Вы успешно вышли"}

@auth_router.delete("/account", response_model=dict)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(delete(SessionState).where(SessionState.user_id == current_user.id))
    await db.delete(current_user)
    await db.commit()
    return {"detail": "Аккаунт и связанные сессии успешно удалены"}
