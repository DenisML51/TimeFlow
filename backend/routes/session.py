from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from models.session import SessionState
from models.user import User
from database import get_db
from utils.auth import get_current_user
from typing import List

session_router = APIRouter()

class SessionStateCreate(BaseModel):
    state: dict

class SessionStateUpdate(BaseModel):
    state: dict

@session_router.post("/", response_model=dict)
async def create_session_state(
    session_data: SessionStateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_session = SessionState(user_id=current_user.id, state=session_data.state)
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return {
        "id": new_session.id,
        "state": new_session.state,
        "created_at": new_session.created_at
    }

@session_router.put("/{session_id}", response_model=dict)
async def update_session_state(
    session_id: int,
    session_update: SessionStateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SessionState).where(SessionState.id == session_id, SessionState.user_id == current_user.id)
    )
    session_obj = result.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session state not found")
    session_obj.state = session_update.state
    await db.commit()
    await db.refresh(session_obj)
    return {
        "id": session_obj.id,
        "state": session_obj.state,
        "updated_at": session_obj.updated_at
    }

@session_router.get("/", response_model=List[dict])
async def get_all_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SessionState).where(SessionState.user_id == current_user.id).order_by(SessionState.created_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {"id": s.id, "state": s.state, "created_at": s.created_at}
        for s in sessions
    ]

@session_router.get("/{session_id}", response_model=dict)
async def get_session_state(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SessionState).where(SessionState.id == session_id, SessionState.user_id == current_user.id)
    )
    session_obj = result.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session state not found")
    return {
        "id": session_obj.id,
        "state": session_obj.state,
        "created_at": session_obj.created_at
    }

@session_router.delete("/{session_id}", response_model=dict)
async def delete_session_state(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(SessionState).where(SessionState.id == session_id, SessionState.user_id == current_user.id)
    )
    session_obj = result.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session state not found")
    await db.delete(session_obj)
    await db.commit()
    return {"detail": "Session deleted successfully"}
