import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.ad import Ad
from app.models.order import Order
from app.models.user import User

router = APIRouter(prefix="/api/orders", tags=["orders"])


class CreateOrderRequest(BaseModel):
    ad_id: uuid.UUID


@router.post("", status_code=status.HTTP_201_CREATED)
def place_order(payload: CreateOrderRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ad = db.get(Ad, payload.ad_id)
    if ad is None or ad.status != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad not available")

    order = Order(
        id=uuid.uuid4(),
        ad_id=ad.id,
        buyer_id=user.id,
        seller_id=ad.seller_id,
        total_price=ad.price,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"id": str(order.id), "status": order.status}
