from fastapi import APIRouter

from app.schemas import StockAssessmentRequest, StockRiskResponse
from app.services.risk_service import assess_stock_risk

router = APIRouter(prefix="/api/v1/risk", tags=["risk"])


@router.post("/assess", response_model=StockRiskResponse)
def assess_risk(request: StockAssessmentRequest) -> StockRiskResponse:
    return assess_stock_risk(request)