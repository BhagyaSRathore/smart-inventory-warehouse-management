import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStockMovements } from '../services/api';

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMovements = async () => {
      try {
        setLoading(true);
        const response = await getStockMovements();
        setMovements(response || []);
        setError('');
      } catch (requestError) {
        setError(requestError.message || 'Unable to load stock movements.');
      } finally {
        setLoading(false);
      }
    };

    loadMovements();
  }, []);

  const getTypeStyle = (type) => {
    const styles = {
      IN: { bg: '#d1fae5', color: '#065f46', icon: '📥' },
      OUT: { bg: '#fee2e2', color: '#991b1b', icon: '📤' },
      TRANSFER_OUT: { bg: '#e0e7ff', color: '#3730a3', icon: '↔️' },
      TRANSFER_IN: { bg: '#dbeafe', color: '#1d4ed8', icon: '🔄' },
      ADJUSTMENT: { bg: '#fef3c7', color: '#92400e', icon: '⚖️' },
    };
    return styles[type] || { bg: '#f3f4f6', color: '#374151', icon: '•' };
  };

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading stock movements…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load stock movements.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stock Movements</h1>
        <p className="page-subtitle">Audit trail of all inventory transactions</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Movement History</h3>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Quantity</th>
              <th>Warehouse</th>
              <th>Notes</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {movements.length ? movements.map((movement) => {
              const style = getTypeStyle(movement.type);
              return (
                <tr key={movement.id}>
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: style.bg, color: style.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{style.icon}</span>
                      {movement.type}
                    </span>
                  </td>
                  <td><strong style={{ color: movement.type === 'OUT' || movement.type === 'TRANSFER_OUT' ? '#ef4444' : '#10b981' }}>{movement.quantity}</strong> units</td>
                  <td>{movement.warehouseId || '—'}</td>
                  <td>{movement.notes || '—'}</td>
                  <td>{movement.referenceNumber || '—'}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan="5" className="empty-state">No stock movements found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
