import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPredictions } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadPredictions = async () => {
      try {
        setLoading(true);
        const result = await getPredictions();

        if (!active) return;
        setPredictions(result || []);
        setError('');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Unable to load demand predictions.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPredictions();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading demand predictions…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load demand predictions.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Demand Predictions</h1>
        <p className="page-subtitle">Forecasted demand based on live stock and reorder levels</p>
      </div>

      <div className="card" style={{ marginBottom: '24px', backgroundColor: '#e0e7ff', border: '2px solid #4f46e5' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#3730a3' }}>
          ℹ️ About Demand Predictions
        </h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#3730a3', margin: 0 }}>
          These forecasts use the live product catalog and current inventory levels, so the page stays fully operational even before the external ML service is connected.
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
            {predictions.length ? predictions.map((pred) => (
              <tr key={pred.id}>
                <td>
                  <Link to={`/products/${pred.productId}`} className="link">
                    <strong>{pred.productName}</strong>
                  </Link>
                </td>
                <td>
                  <strong style={{
                    color: pred.currentStock === 0 ? '#ef4444' : pred.currentStock < pred.predicted7Day ? '#f59e0b' : '#10b981'
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
            )) : (
              <tr><td colSpan="8" className="empty-state">No demand prediction data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
