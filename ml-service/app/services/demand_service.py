from datetime import date, timedelta

from app.schemas import DailyForecast, DemandRequest, DemandResponse


def forecast_demand(request: DemandRequest) -> DemandResponse:
    """Forecast each requested day using the average historical daily demand."""
    average_demand = (
        sum(item.quantity for item in request.historical_data)
        / len(request.historical_data)
        if request.historical_data
        else 0
    )
    daily_quantity = int(average_demand + 0.5)
    start_date = (
        max(item.date for item in request.historical_data) + timedelta(days=1)
        if request.historical_data
        else date.today()
    )
    daily_forecast = [
        DailyForecast(
            date=start_date + timedelta(days=offset),
            quantity=daily_quantity,
        )
        for offset in range(request.days)
    ]

    return DemandResponse(
        productId=request.product_id,
        days=request.days,
        predictedDemand=sum(item.quantity for item in daily_forecast),
        dailyForecast=daily_forecast,
        confidence=None,
        method="rolling_average",
    )