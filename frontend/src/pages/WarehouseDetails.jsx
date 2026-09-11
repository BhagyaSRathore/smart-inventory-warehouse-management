import { useParams, Link } from 'react-router-dom';
import { getWarehouseById, getInventoryByWarehouse } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function WarehouseDetails() {
  const { id } = useParams();
  const warehouse = getWarehouseById(id);
  const inventory = getInventoryByWarehouse(id);

  if (!warehouse) {
    return (
      <div className="card">
        <p>Warehouse not found</p>
        <Link to="/warehouses" className="btn btn-primary">Back to Warehouses</Link>
      </div>
    );
  }

  const utilizationPercent = ((warehouse.currentUtilization / warehouse.capacity) * 100).toFixed(1);
  const lowStockItems = inventory.filter(inv => inv.status === 'low_stock');

  return (
    <div>
      <div className="page-header">
        <Link to="/warehouses" className="link">← Back to Warehouses</Link>
        <h1 className="page-title">{warehouse.name}</h1>
        <p className="page-subtitle">📍 {warehouse.location}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Capacity</h3>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{warehouse.capacity.toLocaleString()}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>units</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Current Stock</h3>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{warehouse.currentUtilization.toLocaleString()}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>units</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Utilization</h3>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{utilizationPercent}%</p>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ width: `${utilizationPercent}%`, height: '100%', backgroundColor: utilizationPercent > 80 ? '#f59e0b' : '#10b981' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Warehouse Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Manager</p>
              <p>{warehouse.manager}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Contact</p>
              <p>{warehouse.phone}</p>
              <p style={{ color: 'var(--primary-color)' }}>{warehouse.email}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</p>
              <StatusBadge status={warehouse.status} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Rack Information</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rack</th>
                <th>Capacity</th>
                <th>Utilized</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {warehouse.racks.map(rack => {
                const rackUtil = ((rack.utilized / rack.capacity) * 100).toFixed(0);
                return (
                  <tr key={rack.id}>
                    <td><strong>{rack.rackNumber}</strong></td>
                    <td>{rack.capacity}</td>
                    <td>{rack.utilized}</td>
                    <td><strong>{rackUtil}%</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Inventory in this Warehouse ({inventory.length} items)</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Rack</th>
              <th>Available</th>
              <th>Reserved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(inv => (
              <tr key={inv.id}>
                <td>
                  <Link to={`/products/${inv.productId}`} className="link">
                    <strong>{inv.productName}</strong>
                  </Link>
                </td>
                <td>{inv.rackNumber}</td>
                <td><strong>{inv.quantityAvailable}</strong> units</td>
                <td>{inv.quantityReserved} units</td>
                <td><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
