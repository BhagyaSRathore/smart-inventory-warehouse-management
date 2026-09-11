import { Link } from 'react-router-dom';
import { getPredictions } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Predictions() {
  const predictions = getPredictions();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Demand Predictions</h1>
        <p className="page-subtitle">ML-powered demand forecasting</p>
      </div>

      <div className="card" style={{ marginBottom: '24px', backgroundColor: '#e0e7ff', border: '2px solid #4f46e5' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#3730a3' }}>
          ℹ️ About Demand Predictions
        </h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#3730a3', margin: 0 }}>
          These predictions are generated using machine learning models that analyze historical sales data, seasonality patterns, and market trends. 
          In production, this data will come from the Python ML service (FastAPI) which will be integrated with the backend.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Prediction Results</h3>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Current Stock</th>
              <th>7-Day Demand</th>
              <th>30-Day Demand</th>
              <th>Trend</th>
              <th>Risk Level</th>
              <th>Confidence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map(pred => (
              <tr key={pred.id}>
                <td>
                  <Link to={`/products/${pred.productId}`} className="link">
                    <strong>{pred.productName}</strong>
                  </Link>
                </td>
                <td>
                  <strong style={{ 
                    color: pred.currentStock === 0 ? '#ef4444' : 
                           pred.currentStock < pred.predicted7Day ? '#f59e0b' : '#10b981' 
                  }}>
                    {pred.currentStock}
                  </strong> units
                </td>
                <td><strong>{pred.predicted7Day}</strong> units</td>
                <td><strong>{pred.predicted30Day}</strong> units</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: pred.demandTrend === 'increasing' ? '#fef3c7' : '#e0e7ff',
                    color: pred.demandTrend === 'increasing' ? '#92400e' : '#3730a3'
                  }}>
                    {pred.demandTrend === 'increasing' ? '📈' : '📊'} {pred.demandTrend}
                  </span>
                </td>
                <td><StatusBadge status={pred.riskLevel} /></td>
                <td>
                  <span style={{ fontWeight: '600', color: pred.confidence >= 85 ? '#10b981' : '#f59e0b' }}>
                    {pred.confidence}%
                  </span>
                </td>
                <td>
                  <Link to={`/products/${pred.productId}`}>
                    <button className="btn btn-secondary btn-sm">View</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Historical vs Predicted Demand</h3>
          <div className="chart-container">
            Chart: Line chart showing historical sales vs predicted demand
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Risk Distribution</h3>
          <div className="chart-container">
            Chart: Pie chart showing risk level distribution (Critical, High, Medium, Low)
          </div>
        </div>
      </div>
    </div>
  );
}
