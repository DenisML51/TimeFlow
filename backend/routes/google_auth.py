from fastapi import APIRouter, Depends, HTTPException
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.user import User
from sqlalchemy.future import select
import os

GOOGLE_CLIENT_ID = "your-google-client-id"
GOOGLE_CLIENT_SECRET = "your-google-client-secret"
REDIRECT_URI = "http://localhost:8000/auth/google/callback"

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    authorize_params={"scope": "openid email profile"},
    access_token_url="https://oauth2.googleapis.com/token",
    access_token_params=None,
    client_kwargs={"scope": "openid email profile"},
)

google_router = APIRouter()


@google_router.get("/auth/google/login")
async def login_google():
    return await oauth.google.authorize_redirect(RedirectResponse(REDIRECT_URI))


@google_router.get("/auth/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    if not user_info:
        raise HTTPException(status_code=400, detail="Google login failed")

    email = user_info["email"]

    result = await db.execute(select(User).where(User.username == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(username=email, hashed_password="google_oauth")  # Фиктивный пароль
        db.add(user)
        await db.commit()

    return {"access_token": token["id_token"], "token_type": "bearer"}
