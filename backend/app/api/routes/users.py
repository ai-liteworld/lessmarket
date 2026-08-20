"""Profile endpoints (phase 2): basic info, posted ads, saved ads."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.ad import Ad
from app.models.ad_image import AdImage
from app.models.saved_ad import SavedAd
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["users"])


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    location: str | None = None
    email: str | None = None


def _serialize_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "phone": user.phone,
        "phone_verified": user.phone_verified,
        "email": user.email,
        "full_name": user.full_name,
        "location": user.location,
    }


def _serialize_ad_summary(ad: Ad, image_url: str | None) -> dict:
    return {
        "id": str(ad.id),
        "title": ad.title,
        "price": float(ad.price),
        "status": ad.status,
        "category_paths": ad.category_paths,
        "location": ad.location,
        "image_url": image_url,
        "created_at": ad.created_at.isoformat() if ad.created_at else None,
    }


def _primary_images_by_ad_id(db: Session, ad_ids: list) -> dict:
    if not ad_ids:
        return {}
    rows = db.query(AdImage).filter(AdImage.ad_id.in_(ad_ids), AdImage.is_primary.is_(True)).all()
    return {row.ad_id: row.url for row in rows}


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return _serialize_user(user)


@router.put("/me")
def update_me(payload: UpdateProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.get("/me/ads")
def list_my_ads(
    status_filter: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ads this user has posted (the 'Manage ads' list). `status_filter`
    narrows to one status (active/sold/expired); omit for all non-deleted."""
    query = db.query(Ad).filter(Ad.seller_id == user.id)
    if status_filter:
        query = query.filter(Ad.status == status_filter)
    else:
        query = query.filter(Ad.status != "deleted")
    ads = query.order_by(Ad.created_at.desc()).all()
    images = _primary_images_by_ad_id(db, [a.id for a in ads])
    return {"ads": [_serialize_ad_summary(a, images.get(a.id)) for a in ads]}


@router.get("/me/saved")
def list_saved_ads(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = (
        db.query(SavedAd)
        .filter(SavedAd.user_id == user.id)
        .order_by(SavedAd.created_at.desc())
        .all()
    )
    ad_ids = [s.ad_id for s in saved]
    if not ad_ids:
        return {"ads": []}
    ads_by_id = {a.id: a for a in db.query(Ad).filter(Ad.id.in_(ad_ids)).all()}
    images = _primary_images_by_ad_id(db, ad_ids)
    # Preserve save-order (most recently saved first), skip ads that were
    # hard-removed some other way so a dangling saved_ads row can't 500 this.
    ads = [ads_by_id[ad_id] for ad_id in ad_ids if ad_id in ads_by_id]
    return {"ads": [_serialize_ad_summary(a, images.get(a.id)) for a in ads]}
