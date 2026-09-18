from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HistoricalDemand(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: date
    quantity: int = Field(ge=0)


class DemandRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId", gt=0)
    days: Literal[7, 14, 30]
    historical_data: list[HistoricalDemand] = Field(
        default_factory=list, alias="historicalData"
    )


class DailyForecast(BaseModel):
    date: date
    quantity: int = Field(ge=0)


class DemandResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId")
    days: int
    predicted_demand: int = Field(alias="predictedDemand", ge=0)
    daily_forecast: list[DailyForecast] = Field(alias="dailyForecast")
    confidence: float | None = None
    method: str


class StockAssessmentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId", gt=0)
    current_stock: int = Field(alias="currentStock", ge=0)
    predicted_demand: int = Field(alias="predictedDemand", ge=0)


class StockRiskResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId")
    risk_level: Literal["CRITICAL", "HIGH", "LOW"] = Field(alias="riskLevel")
    current_stock: int = Field(alias="currentStock")
    predicted_demand: int = Field(alias="predictedDemand")
    reason: str


class RestockRequest(StockAssessmentRequest):
    pass


class RestockResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: int = Field(alias="productId")
    current_stock: int = Field(alias="currentStock")
    predicted_demand: int = Field(alias="predictedDemand")
    recommended_quantity: int = Field(alias="recommendedQuantity", ge=0)
    priority: Literal["critical", "high", "low"]
    reason: str