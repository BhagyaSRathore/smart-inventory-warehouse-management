from app.schemas import RestockRequest, RestockResponse


def recommend_restock(request: RestockRequest) -> RestockResponse:
    threshold_target = None
    if request.reorder_level is not None or request.safety_stock is not None:
        threshold_target = (request.reorder_level or 0) + (request.safety_stock or 0)

    target_stock = max(request.predicted_demand, threshold_target or 0)
    recommended_quantity = max(
        target_stock - request.current_stock,
        0,
    )
    if request.current_stock == 0:
        priority = "critical"
        reason = "Current stock is zero. Immediate restocking is recommended."
    elif recommended_quantity > 0:
        priority = "high"
        reason = "Current stock is below predicted demand or the product's replenishment thresholds."
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