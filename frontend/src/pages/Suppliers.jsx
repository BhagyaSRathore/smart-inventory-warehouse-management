import { getSuppliers } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Suppliers() {
  const suppliers = getSuppliers();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Suppliers</h1>
        <p className="page-subtitle">Manage supplier relationships</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Supplier List</h3>
          <button className="btn btn-primary">
            <span>➕</span>
            Add Supplier
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Contact Person</th>
              <th>Products Supplied</th>
              <th>Pending Orders</th>
              <th>Avg Lead Time</th>
              <th>Rating</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td>
                  <strong>{supplier.name}</strong>
                  <br />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{supplier.email}</span>
                </td>
                <td>{supplier.contactPerson}</td>
                <td>{supplier.productsSupplied.length} products</td>
                <td><strong>{supplier.pendingOrders}</strong></td>
                <td>{supplier.averageLeadTime} days</td>
                <td>
                  <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                    ⭐ {supplier.rating}
                  </span>
                </td>
                <td><StatusBadge status={supplier.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
