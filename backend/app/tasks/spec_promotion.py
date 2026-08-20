"""Background learning system (spec section 5): promote frequently-used
user-added spec fields to suggested fields per category."""
from sqlalchemy import func, select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.ad import Ad
from app.tasks.celery_app import celery_app

settings = get_settings()


@celery_app.task(name="app.tasks.spec_promotion.promote_user_specs")
def promote_user_specs():
    db = SessionLocal()
    try:
        # Phase 3: category_paths is an array (an ad can carry several
        # categories), so distinct categories come from unnesting it first.
        categories = db.execute(select(func.unnest(Ad.category_paths)).distinct()).scalars().all()
        for category_path in categories:
            ads = db.query(Ad).filter(Ad.category_paths.any(category_path)).all()
            if not ads:
                continue
            counts: dict[str, int] = {}
            for ad in ads:
                for field in ad.user_added_fields or []:
                    counts[field] = counts.get(field, 0) + 1
            total = len(ads)
            promoted = [k for k, v in counts.items() if v / total >= settings.SPEC_PROMOTION_THRESHOLD]
            if promoted:
                _upsert_promoted_specs(db, category_path, promoted, counts, total)
        db.commit()
    finally:
        db.close()


def _upsert_promoted_specs(db, category_path: str, promoted: list[str], counts: dict[str, int], total: int):
    # TODO: upsert into the promoted_specs table (backend/db/init.sql) and
    # refresh the LLM system-prompt context for this category (spec 5).
    for field in promoted:
        frequency = counts[field] / total
        db.execute(
            """
            INSERT INTO promoted_specs (category_path, field_key, frequency)
            VALUES (:category_path, :field_key, :frequency)
            ON CONFLICT (category_path, field_key)
            DO UPDATE SET frequency = EXCLUDED.frequency, promoted_at = NOW()
            """,
            {"category_path": category_path, "field_key": field, "frequency": frequency},
        )
