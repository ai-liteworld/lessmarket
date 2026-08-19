"""
Seller endpoints (spec 7.2): schema generation + CRUD + image upload.
Handlers are stubs (TODO markers) — wiring to S3/Cloudinary and the
embedding pipeline lands in M1/M4 of docs/DEVELOPMENT_PLAN.md.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.llm.client import generate_seller_schema
from app.models.ad import Ad
from app.models.user import User
from app.schemas.llm import SchemaGenerationResult

router = APIRouter(prefix="/api/ads", tags=["ads"])


class SchemaRequest(BaseModel):
    description: str


class CreateAdRequest(BaseModel):
    title: str
    description: str
    price: float
    category_path: str
    specs: dict
    excluded_category_paths: list[str] = []
    user_added_fields: list[str] = []


@router.post("/schema", response_model=SchemaGenerationResult)
def generate_schema(payload: SchemaRequest, _user: User = Depends(get_current_user)):
    # TODO: read-through app.models.schema_cache before calling the LLM (spec 4.4).
    return generate_seller_schema(payload.description)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_ad(payload: CreateAdRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ad = Ad(
        id=uuid.uuid4(),
        seller_id=user.id,
        title=payload.title,
        description=payload.description,
        price=payload.price,
        category_path=payload.category_path,
        excluded_category_paths=payload.excluded_category_paths,
        specs=payload.specs,
        user_added_fields=payload.user_added_fields,
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    # TODO: enqueue embedding generation (Celery) so `ad.embedding` gets populated (spec 4.3).
    return {"id": str(ad.id)}


@router.put("/{ad_id}")
def update_ad(ad_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ad = db.get(Ad, ad_id)
    if ad is None or ad.seller_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad not found")
    # TODO: apply partial update fields.
    return {"id": str(ad.id)}


@router.delete("/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ad(ad_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ad = db.get(Ad, ad_id)
    if ad is None or ad.seller_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad not found")
    ad.status = "deleted"
    db.commit()


@router.post("/{ad_id}/images", status_code=status.HTTP_201_CREATED)
def upload_image(ad_id: uuid.UUID, _user: User = Depends(get_current_user)):
    # TODO: generate S3 presigned URL (spec 6.1), return it to the frontend.
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented yet")


@router.get("/{ad_id}")
def get_ad(ad_id: uuid.UUID, db: Session = Depends(get_db)):
    ad = db.get(Ad, ad_id)
    if ad is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad not found")
    return {
        "id": str(ad.id),
        "title": ad.title,
        "description": ad.description,
        "price": float(ad.price),
        "category_path": ad.category_path,
        "specs": ad.specs,
    }
