import { Link } from 'react-router-dom';
import { getWarehouses } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Warehouses() {
  const warehouses = getWarehouses();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Warehouses</h1>
        <p className="page-subtitle">Manage warehouse locations and capacity</p>
      </div>

      <div className="grid grid-3">
        {warehouses.map(warehouse => {
          const utilizationPercent = ((warehouse.currentUtilization / warehouse.capacity) * 100).toFixed(0);
          
          return (
            <Link 
              key={warehouse.id} 
              to={`/warehouses/${warehouse.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{warehouse.name}</h3>
                    <StatusBadge status={warehouse.status} />
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>📍 {warehouse.location}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Capacity Utilization</span>
                    <span style={{ fontWeight: '600' }}>{utilizationPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${utilizationPercent}%`,
                        height: '100%',
                        backgroundColor: utilizationPercent > 80 ? '#f59e0b' : '#10b981',
                        transition: 'width 0.3s'
                      }}
                    ></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Capacity</p>
                    <p style={{ fontWeight: '600', margin: 0 }}>{warehouse.capacity.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Current Stock</p>
                    <p style={{ fontWeight: '600', margin: 0 }}>{warehouse.currentUtilization.toLocaleString()} units</p>
                  </div>
                  <div>
                    <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Total Products</p>
                    <p style={{ fontWeight: '600', margin: 0 }}>{warehouse.totalProducts}</p>
                  </div>
                  <div>
                    <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Low Stock Items</p>
                    <p style={{ fontWeight: '600', margin: 0, color: warehouse.lowStockProducts > 10 ? '#f59e0b' : '#10b981' }}>
                      {warehouse.lowStockProducts}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                  <p style={{ margin: 0 }}>👤 {warehouse.manager}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
