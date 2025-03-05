import os
from dotenv import load_dotenv

# Загружаем переменные окружения из файла .env
load_dotenv()

# Ключ для подписи JWT
SECRET_KEY = os.getenv("SECRET_KEY", "my-secret-key")
# Алгоритм для подписи JWT
ALGORITHM = os.getenv("ALGORITHM", "HS256")
# Время жизни access-токена (в минутах)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
# Время жизни refresh-токена (в минутах)
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080"))
# Строка подключения к базе данных
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db")

# Настройки Celery: брокер и backend для хранения результатов
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")
