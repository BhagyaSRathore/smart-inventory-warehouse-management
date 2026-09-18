from fastapi import APIRouter

from app.schemas import DemandRequest, DemandResponse
from app.services.demand_service import forecast_demand

router = APIRouter(prefix="/api/v1/predict", tags=["predictions"])


@router.post("/demand", response_model=DemandResponse)
def predict_demand(request: DemandRequest) -> DemandResponse:
    return forecast_demand(request)