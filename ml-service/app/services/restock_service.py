from app.schemas import RestockRequest, RestockResponse


def recommend_restock(request: RestockRequest) -> RestockResponse:
    recommended_quantity = max(
        request.predicted_demand - request.current_stock,
        0,
    )
    if request.current_stock == 0:
        priority = "critical"
        reason = "Current stock is zero. Immediate restocking is recommended."
    elif recommended_quantity > 0:
        priority = "high"
        reason = "Current stock is below predicted demand."
    else:
        priority = "low"
        reason = "Current stock covers predicted demand; no restock is required."

    return RestockResponse(
        productId=request.product_id,
        currentStock=request.current_stock,
        predictedDemand=request.predicted_demand,
        recommendedQuantity=recommended_quantity,
        priority=priority,
        reason=reason,
    )