import { Link } from 'react-router-dom';
import { getStockMovements } from '../services/api';

export default function StockMovements() {
  const movements = getStockMovements();

  const getTypeStyle = (type) => {
    const styles = {
      STOCK_IN: { bg: '#d1fae5', color: '#065f46', icon: '📥' },
      STOCK_OUT: { bg: '#fee2e2', color: '#991b1b', icon: '📤' },
      TRANSFER: { bg: '#e0e7ff', color: '#3730a3', icon: '🔄' },
      ADJUSTMENT: { bg: '#fef3c7', color: '#92400e', icon: '⚖️' }
    };
    return styles[type] || styles.ADJUSTMENT;
  };

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
              <th>Date & Time</th>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Warehouse</th>
              <th>Rack</th>
              <th>User</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(movement => {
              const style = getTypeStyle(movement.type);
              return (
                <tr key={movement.id}>
                  <td style={{ fontSize: '13px' }}>{movement.date}</td>
                  <td>
                    <Link to={`/products/${movement.productId}`} className="link">
                      <strong>{movement.productName}</strong>
                    </Link>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: style.bg,
                      color: style.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{style.icon}</span>
                      {movement.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <strong style={{ 
                      color: movement.type === 'STOCK_OUT' || movement.quantity < 0 ? '#ef4444' : '#10b981' 
                    }}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </strong> units
                  </td>
                  <td>{movement.warehouseName}</td>
                  <td>{movement.rackNumber}</td>
                  <td style={{ fontSize: '13px' }}>{movement.user}</td>
                  <td><code style={{ fontSize: '12px', color: '#6b7280' }}>{movement.reference}</code></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
