from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import require_role
from backend.app.models.user import User
from backend.app.schemas.analytics import AnalyticsOverviewResponse
from backend.app.services.analytics_service import get_analytics_overview

router = APIRouter(prefix="/analytics", tags=["Operational Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics(
    current_user: User = Depends(require_role(["STAFF", "ADMIN"])),
    db: Session = Depends(get_db)
):
    return get_analytics_overview(db)
