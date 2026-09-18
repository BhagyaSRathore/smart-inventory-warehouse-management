from fastapi import APIRouter

from app.schemas import RestockRequest, RestockResponse
from app.services.restock_service import recommend_restock

router = APIRouter(prefix="/api/v1/recommend", tags=["recommendations"])


@router.post("/restock", response_model=RestockResponse)
def restock_recommendation(request: RestockRequest) -> RestockResponse:
    return recommend_restock(request)