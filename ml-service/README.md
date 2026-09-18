# ML Service

Small FastAPI service for demand forecasting, stock risk assessment, and restock recommendations. The first version is intentionally deterministic: it uses a rolling average of historical `OUT` stock movements and does not connect to PostgreSQL.

## Structure

```text
ml-service/
├── app/
│   ├── main.py
│   ├── schemas.py
│   ├── routers/
│   │   ├── predictions.py
│   │   ├── risk.py
│   │   └── recommendations.py
│   └── services/
│       ├── demand_service.py
│       ├── risk_service.py
│       └── restock_service.py
├── tests/
│   └── test_api.py
├── requirements.txt
└── README.md
```

## Setup

Use Python 3.13 or newer.

```powershell
cd ml-service
python -m venv venv
venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

On macOS/Linux, activate the environment with `source venv/bin/activate`.

## Run the service

```powershell
uvicorn app.main:app --reload
```

The service listens at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

## Endpoints

### `GET /health`

Returns `{ "status": "ok" }`.

### `POST /api/v1/predict/demand`

The Node/Express backend should query `StockMovement` records with `type: "OUT"` and send their dates and quantities. Supported forecast lengths are 7, 14, and 30 days.

Request:

```json
{
  "productId": 12,
  "days": 7,
  "historicalData": [
    {"date": "2026-09-10", "quantity": 4},
    {"date": "2026-09-11", "quantity": 6},
    {"date": "2026-09-12", "quantity": 5}
  ]
}
```

Response:

```json
{
  "productId": 12,
  "days": 7,
  "predictedDemand": 35,
  "dailyForecast": [
    {"date": "2026-09-13", "quantity": 5}
  ],
  "confidence": null,
  "method": "rolling_average"
}
```

The actual response contains one daily forecast entry for every requested day. Empty history returns zero quantities and a null confidence.

### `POST /api/v1/risk/assess`

Request:

```json
{"productId": 12, "currentStock": 20, "predictedDemand": 35}
```

Returns `CRITICAL` for zero stock, `HIGH` when stock is below demand, and `LOW` when stock covers demand.

### `POST /api/v1/recommend/restock`

Request:

```json
{"productId": 12, "currentStock": 10, "predictedDemand": 35}
```

The recommendation is `max(predictedDemand - currentStock, 0)`. Priority is `critical` for zero stock, `high` for insufficient positive stock, and `low` when current stock covers demand.

## Tests

```powershell
pytest
```

No forecasting model such as Prophet, ARIMA, or LSTM is included in this version.
