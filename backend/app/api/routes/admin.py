from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.tasks.spec_promotion import promote_user_specs

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/promoted-specs")
def list_promoted_specs(_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # TODO: query the promoted_specs table (backend/db/init.sql).
    return {"promoted_specs": []}


@router.post("/promote-specs")
def trigger_promotion(_user: User = Depends(get_current_user)):
    promote_user_specs.delay()
    return {"status": "queued"}
