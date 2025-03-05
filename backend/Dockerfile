# Dockerfile для FastAPI backend
FROM python:3.10-slim

WORKDIR /app

# Копируем файл зависимостей и устанавливаем пакеты
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Копируем весь исходный код проекта
COPY . .

# Открываем порт 8000 для FastAPI
EXPOSE 8000

# Запускаем приложение через uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
