from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery("lessmarket", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.update(task_serializer="json", result_serializer="json", accept_content=["json"])

# Nightly spec-promotion job (spec section 5).
celery_app.conf.beat_schedule = {
    "promote-user-specs-nightly": {
        "task": "app.tasks.spec_promotion.promote_user_specs",
        "schedule": 24 * 60 * 60,  # every 24h; replace with crontab() for a fixed time
    },
}

# Ensure task modules register with this app instance.
import app.tasks.image_processing  # noqa: E402,F401
import app.tasks.spec_promotion  # noqa: E402,F401
