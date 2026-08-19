"""
Buyer/search endpoints (spec 7.1, 7.3, 4.2, 4.3).

Search execution (spec 4.3), extended per docs/ADDENDUM_negative_categories.md:
  1. Semantic search via pgvector cosine similarity on ads.embedding.
  2. Apply JSONB `filters` from the LLM on the specs column.
  3. Apply `excluded_categories` / `negative_filters` from the LLM to rule
     out near-miss matches (category_path NOT IN excluded_categories, and
     specs values NOT matching negative_filters).
  4. Rank by weighted combination: vector similarity (70%) + recency (30%).
  5. Return paginated results.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.llm.client import generate_buyer_filters
from app.models.ad import Ad
from app.models.ad_image import AdImage
from app.schemas.llm import FilterGenerationResult

router = APIRouter(prefix="/api", tags=["search"])


class FilterRequest(BaseModel):
    query: str


@router.post("/search/filters", response_model=FilterGenerationResult)
def get_filters(payload: FilterRequest):
    # TODO: read-through schema_cache before calling the LLM (spec 4.4).
    return generate_buyer_filters(payload.query)


@router.get("/ads/search")
def search_ads(
    q: str | None = None,
    category_path: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    # TODO: embed `q`, run pgvector cosine similarity + JSONB filter predicates
    # + excluded_categories / negative_filters exclusion, rank 70/30, paginate.
    # Until the embedding pipeline lands, default to recency - this also
    # means calling this endpoint with no q/category_path (as the landing
    # page's "top ads" grid does) returns the most recently posted active
    # ads, a reasonable stand-in for "top" before any view/click tracking
    # exists.
    stmt = select(Ad).where(Ad.status == "active").order_by(Ad.created_at.desc())
    if category_path:
        stmt = stmt.where(Ad.category_path == category_path)
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
                "category_path": a.category_path,
                "location": a.location,
                "image_url": primary_images.get(a.id),
            }
            for a in ads
        ],
        "page": page,
        "page_size": page_size,
    }
