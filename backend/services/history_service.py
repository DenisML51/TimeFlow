from database import SessionLocal
from models.history import History

async def record_history(db, user_id: int, action: str):
    history = History(user_id=user_id, action=action)
    db.add(history)
    await db.commit()

async def record_history_bg(user_id: int, action: str):
    """
    Фоновая запись истории: создаёт новый сеанс БД.
    """
    async with SessionLocal() as db:
         history = History(user_id=user_id, action=action)
         db.add(history)
         await db.commit()
