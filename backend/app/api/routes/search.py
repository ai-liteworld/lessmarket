"""
Buyer/search endpoints (spec 7.1, 7.3, 4.2, 4.3).

Search execution (spec 4.3), extended per docs/ADDENDUM_negative_categories.md
and phase 3 (multi-category + AI-generated relevant/exclude chip groups):
  1. Keyword match on title/description (interim stand-in for semantic
     search - `ads.embedding` is never populated yet, since nothing enqueues
     the Celery embedding job on ad creation; see the TODO on POST /api/ads).
     Once that lands, this becomes pgvector cosine similarity on the query
     embedding, ranked 70% similarity / 30% recency per the original spec.
  2. `category_paths` (buyer-selected "relevant" chips, seeded by
     POST /api/search/filters) narrow results to ads sharing ANY of those
     categories (array overlap).
  3. `exclude_category_paths` (buyer-selected "exclude" chips, seeded by the
     same call's `excluded_categories`) rule OUT ads sharing ANY of those.
  4. `sort` orders the page: recency (default), price, or a numeric field
     from the dynamic per-category `specs` JSONB (one of the
     `refinement_options` keys the filters call returned) - rows missing
     that field, or where it isn't numeric, sort last rather than erroring.
  5. Paginated.
"""
from sqlalchemy import Numeric, case, cast, or_, select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.db.session import get_db
from app.llm.client import generate_buyer_filters
from app.models.ad import Ad
from app.models.ad_image import AdImage
from app.schemas.llm import FilterGenerationResult

router = APIRouter(prefix="/api", tags=["search"])

# Matches an optionally-signed integer or decimal, e.g. "12", "-3.5". Spec
# values that don't look like this (including missing keys, which come back
# as NULL from the JSONB ->> operator) are excluded from the numeric cast
# instead of raising a cast error that would 500 the whole search.
_NUMERIC_SPEC_RE = r"^-?\d+(\.\d+)?$"


class FilterRequest(BaseModel):
    query: str


@router.post("/search/filters", response_model=FilterGenerationResult)
def get_filters(payload: FilterRequest):
    # TODO: read-through schema_cache before calling the LLM (spec 4.4).
    return generate_buyer_filters(payload.query)


def _spec_sort_column(key: str, direction: str):
    raw = Ad.specs[key].astext
    numeric = cast(case((raw.op("~")(_NUMERIC_SPEC_RE), raw), else_=None), Numeric)
    return numeric.asc().nulls_last() if direction == "asc" else numeric.desc().nulls_last()


@router.get("/ads/search")
def search_ads(
    q: str | None = None,
    category_paths: list[str] = Query(default=[]),
    exclude_category_paths: list[str] = Query(default=[]),
    sort: str = "recent",
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    """
    `sort`: "recent" (default) | "price_asc" | "price_desc" |
    "spec:<key>:asc" | "spec:<key>:desc" - the spec:* forms sort by a
    dynamic per-category field inside `ads.specs` (typically one of the
    `refinement_options` keys from POST /api/search/filters).
    """
    stmt = select(Ad).where(Ad.status == "active")

    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Ad.title.ilike(like), Ad.description.ilike(like)))

    if category_paths:
        stmt = stmt.where(Ad.category_paths.overlap(category_paths))
    if exclude_category_paths:
        stmt = stmt.where(~Ad.category_paths.overlap(exclude_category_paths))

    parts = sort.split(":") if sort else []
    if sort == "price_asc":
        stmt = stmt.order_by(Ad.price.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Ad.price.desc())
    elif len(parts) == 3 and parts[0] == "spec" and parts[2] in ("asc", "desc"):
        stmt = stmt.order_by(_spec_sort_column(parts[1], parts[2]))
    else:
        stmt = stmt.order_by(Ad.created_at.desc())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    ads = db.execute(stmt).scalars().all()

    ad_ids = [a.id for a in ads]
    primary_images: dict = {}
    if ad_ids:
        image_rows = (
            db.query(AdImage)
            .filter(AdImage.ad_id.in_(ad_ids), AdImage.is_primary.is_(True))
            .all()
        )
        primary_images = {img.ad_id: img.url for img in image_rows}

    return {
        "results": [
            {
                "id": str(a.id),
                "title": a.title,
                "price": float(a.price),
                "category_paths": a.category_paths,
                "location": a.location,
                "image_url": primary_images.get(a.id),
            }
            for a in ads
        ],
        "page": page,
        "page_size": page_size,
    }
