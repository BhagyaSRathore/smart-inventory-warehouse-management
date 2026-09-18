from app.schemas import StockAssessmentRequest, StockRiskResponse


def assess_stock_risk(request: StockAssessmentRequest) -> StockRiskResponse:
    if request.current_stock == 0:
        risk_level = "CRITICAL"
        reason = "Current stock is zero."
    elif request.current_stock < request.predicted_demand:
        risk_level = "HIGH"
        reason = "Current stock is below predicted demand."
    else:
        risk_level = "LOW"
        reason = "Current stock covers predicted demand."

    return StockRiskResponse(
        productId=request.product_id,
        riskLevel=risk_level,
        currentStock=request.current_stock,
        predictedDemand=request.predicted_demand,
        reason=reason,
    )