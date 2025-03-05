# celery_worker.py
from tasks import celery_app

# Файл используется для запуска воркера:
# celery -A celery_worker.celery_app worker --loglevel=info
