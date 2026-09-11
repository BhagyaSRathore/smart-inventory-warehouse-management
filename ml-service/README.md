# ML Service

## Overview

Python-based machine learning service for demand prediction and intelligent inventory recommendations.

## Technology Stack (Planned)

- **Python 3.9+** - Programming language
- **FastAPI** - API framework
- **scikit-learn** - ML library
- **pandas** - Data processing
- **numpy** - Numerical computing
- **Prophet** - Time series forecasting
- **joblib** - Model serialization

## ML Models (Planned)

### 1. Demand Prediction
- **Algorithm**: ARIMA, Prophet, or LSTM
- **Input**: Historical sales data, seasonality, trends
- **Output**: Predicted demand for next 7, 14, 30 days
- **Features**:
  - Past sales volume
  - Seasonality patterns
  - Day of week
  - Month
  - Promotions/events
  - Product category trends

### 2. Stock Risk Classification
- **Algorithm**: Random Forest or Gradient Boosting
- **Input**: Current stock, demand rate, lead time
- **Output**: Risk level (LOW, MEDIUM, HIGH, CRITICAL)
- **Features**:
  - Current stock level
  - Predicted demand
  - Reorder level
  - Safety stock
  - Lead time
  - Supplier reliability

### 3. Restock Quantity Recommendation
- **Algorithm**: Optimization model
- **Input**: Predicted demand, current stock, constraints
- **Output**: Optimal restock quantity
- **Considerations**:
  - Economic Order Quantity (EOQ)
  - Storage capacity
  - Budget constraints
  - Supplier minimum order quantity

## API Endpoints (Planned)

### Predictions
- `POST /api/v1/predict/demand` - Predict product demand
  ```json
  {
    "product_id": "M101",
    "days": 30,
    "historical_data": [...]
  }
  ```

- `POST /api/v1/predict/batch` - Batch prediction for multiple products

### Risk Assessment
- `POST /api/v1/risk/assess` - Assess stock risk
  ```json
  {
    "product_id": "M101",
    "current_stock": 60,
    "reorder_level": 100,
    "lead_time_days": 5
  }
  ```

### Recommendations
- `POST /api/v1/recommend/restock` - Get restock recommendation
  ```json
  {
    "product_id": "M101",
    "current_stock": 60,
    "predicted_demand": 80,
    "lead_time": 5
  }
  ```

### Model Management
- `GET /api/v1/models/status` - Get model status
- `POST /api/v1/models/train` - Trigger model training
- `GET /api/v1/models/metrics` - Get model performance metrics

## Training Pipeline (Planned)

1. **Data Collection**
   - Fetch historical sales from database
   - Clean and preprocess data
   - Feature engineering

2. **Model Training**
   - Split train/test data
   - Train multiple models
   - Cross-validation
   - Hyperparameter tuning

3. **Model Evaluation**
   - Calculate metrics (MAE, RMSE, MAPE)
   - Compare models
   - Select best model

4. **Model Deployment**
   - Save trained model
   - Update API to use new model
   - Version control

5. **Monitoring**
   - Track prediction accuracy
   - Monitor drift
   - Retrain when needed

## Project Structure (Planned)

```
ml-service/
├── app/
│   ├── main.py              # FastAPI app
│   ├── routers/             # API routes
│   ├── models/              # ML models
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
├── data/
│   ├── raw/                 # Raw data
│   ├── processed/           # Processed data
│   └── models/              # Saved models
├── notebooks/               # Jupyter notebooks
├── tests/                   # Unit tests
├── requirements.txt         # Dependencies
└── Dockerfile              # Container config
```

## Setup Instructions (When Implemented)

1. Create virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

3. Run development server
   ```bash
   uvicorn app.main:app --reload
   ```

4. Access API docs
   ```
   http://localhost:8000/docs
   ```

## Model Performance Targets

- **Demand Prediction MAPE**: < 15%
- **Risk Classification Accuracy**: > 85%
- **Prediction Latency**: < 100ms
- **Batch Processing**: 1000+ products/second

## Status

🔄 **Not yet implemented** - This will be Phase 3 of development
