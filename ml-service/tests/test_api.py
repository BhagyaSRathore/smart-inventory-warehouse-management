from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_demand_prediction_with_historical_data() -> None:
    response = client.post(
        "/api/v1/predict/demand",
        json={
            "productId": 12,
            "days": 7,
            "historicalData": [
                {"date": "2026-09-10", "quantity": 4},
                {"date": "2026-09-11", "quantity": 6},
                {"date": "2026-09-12", "quantity": 5},
            ],
        },
    )
    body = response.json()

    assert response.status_code == 200
    assert body["predictedDemand"] == 35
    assert len(body["dailyForecast"]) == 7
    assert body["dailyForecast"][0] == {"date": "2026-09-13", "quantity": 5}
    assert body["confidence"] is None
    assert body["method"] == "rolling_average"


def test_demand_prediction_with_empty_historical_data() -> None:
    response = client.post(
        "/api/v1/predict/demand",
        json={"productId": 12, "days": 14, "historicalData": []},
    )
    body = response.json()

    assert response.status_code == 200
    assert body["predictedDemand"] == 0
    assert len(body["dailyForecast"]) == 14
    assert all(item["quantity"] == 0 for item in body["dailyForecast"])
    assert body["confidence"] is None


def test_demand_prediction_rejects_invalid_days() -> None:
    response = client.post(
        "/api/v1/predict/demand",
        json={"productId": 12, "days": 8, "historicalData": []},
    )

    assert response.status_code == 422


def test_critical_risk_when_stock_is_zero() -> None:
    response = client.post(
        "/api/v1/risk/assess",
        json={"productId": 12, "currentStock": 0, "predictedDemand": 35},
    )

    assert response.status_code == 200
    assert response.json()["riskLevel"] == "CRITICAL"


def test_high_risk_when_stock_is_below_predicted_demand() -> None:
    response = client.post(
        "/api/v1/risk/assess",
        json={"productId": 12, "currentStock": 20, "predictedDemand": 35},
    )

    assert response.status_code == 200
    assert response.json()["riskLevel"] == "HIGH"


def test_low_risk_when_stock_covers_predicted_demand() -> None:
    response = client.post(
        "/api/v1/risk/assess",
        json={"productId": 12, "currentStock": 35, "predictedDemand": 35},
    )

    assert response.status_code == 200
    assert response.json()["riskLevel"] == "LOW"


def test_restock_quantity_when_stock_is_insufficient() -> None:
    response = client.post(
        "/api/v1/recommend/restock",
        json={"productId": 12, "currentStock": 10, "predictedDemand": 35},
    )

    assert response.status_code == 200
    assert response.json()["recommendedQuantity"] == 25
    assert response.json()["priority"] == "high"


def test_restock_quantity_when_stock_is_sufficient() -> None:
    response = client.post(
        "/api/v1/recommend/restock",
        json={"productId": 12, "currentStock": 40, "predictedDemand": 35},
    )

    assert response.status_code == 200
    assert response.json()["recommendedQuantity"] == 0
    assert response.json()["priority"] == "low"


def test_restock_uses_reorder_and_safety_thresholds() -> None:
    response = client.post(
        "/api/v1/recommend/restock",
        json={
            "productId": 12,
            "currentStock": 20,
            "predictedDemand": 25,
            "reorderLevel": 30,
            "safetyStock": 10,
        },
    )

    assert response.status_code == 200
    assert response.json()["recommendedQuantity"] == 20
    assert response.json()["priority"] == "high"


def test_restock_rejects_negative_thresholds() -> None:
    response = client.post(
        "/api/v1/recommend/restock",
        json={
            "productId": 12,
            "currentStock": 20,
            "predictedDemand": 25,
            "reorderLevel": -1,
        },
    )

    assert response.status_code == 422