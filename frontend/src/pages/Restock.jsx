import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRestockRecommendations } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Restock() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const result = await getRestockRecommendations();

        if (!active) return;
        setRecommendations(result || []);
        setError('');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Unable to load restock recommendations.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      active = false;
    };
  }, []);

  const critical = useMemo(() => recommendations.filter((r) => r.priority === 'critical'), [recommendations]);
  const high = useMemo(() => recommendations.filter((r) => r.priority === 'high'), [recommendations]);
  const medium = useMemo(() => recommendations.filter((r) => r.priority === 'medium'), [recommendations]);
  const low = useMemo(() => recommendations.filter((r) => r.priority === 'low'), [recommendations]);

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading restock recommendations…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load restock recommendations.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔔 Restock Recommendations</h1>
        <p className="page-subtitle">Live replenishment alerts from product and stock levels</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Critical Priority</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#ef4444' }}>{critical.length}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Immediate action required</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>High Priority</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#f59e0b' }}>{high.length}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Restock within 1 week</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Medium Priority</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#3b82f6' }}>{medium.length}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Restock within 2 weeks</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Low Priority</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#10b981' }}>{low.length}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Monitor and plan ahead</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Restock Recommendations</h3>
          <button className="btn btn-primary">
            Generate Purchase Orders
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Current Stock</th>
              <th>Predicted Demand</th>
              <th>Safety Stock</th>
              <th>Lead Time</th>
              <th>Recommended Qty</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.length ? recommendations.map((rec) => (
              <tr key={rec.id}>
                <td>
                  <Link to={`/products/${rec.productId}`} className="link">
                    <strong>{rec.productName}</strong>
                  </Link>
                </td>
                <td>
                  <strong style={{
                    color: rec.currentStock === 0 ? '#ef4444' : rec.currentStock < rec.reorderPoint ? '#f59e0b' : '#10b981'
                  }}>
                    {rec.currentStock}
                  </strong> units
                </td>
                <td>{rec.predictedDemand} units</td>
                <td>{rec.safetyStock} units</td>
                <td>{rec.leadTimeDays} days</td>
                <td>
                  <strong style={{ fontSize: '16px', color: 'var(--primary-color)' }}>
                    {rec.recommendedQuantity}
                  </strong> units
                </td>
                <td><StatusBadge status={rec.priority} /></td>
                <td>
                  <button className="btn btn-primary btn-sm">
                    Create PO
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="8" className="empty-state">No restock alerts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '24px' }}>
        {recommendations.map((rec) => (
          rec.priority === 'critical' || rec.priority === 'high' ? (
            <div key={rec.id} className="card" style={{
              marginBottom: '16px',
              borderLeft: `4px solid ${rec.priority === 'critical' ? '#ef4444' : '#f59e0b'}`,
              backgroundColor: rec.priority === 'critical' ? '#fee2e2' : '#fef3c7'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: rec.priority === 'critical' ? '#991b1b' : '#78350f'
                  }}>
                    {rec.priority === 'critical' ? '🚨' : '⚠️'} {rec.productName}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: 0,
                    color: rec.priority === 'critical' ? '#991b1b' : '#78350f'
                  }}>
                    {rec.explanation}
                  </p>
                </div>
                <div style={{ marginLeft: '16px' }}>
                  <Link to={`/products/${rec.productId}`}>
                    <button className="btn btn-secondary btn-sm">View Details</button>
                  </Link>
                </div>
              </div>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}
