import { useState } from 'react';
import { getOrders } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Orders() {
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const orders = getOrders();

  const filteredOrders = orders.filter(order => {
    const matchesType = typeFilter === 'All' || order.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">Manage purchase and sales orders</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Order List</h3>
          <button className="btn btn-primary">
            <span>➕</span>
            Create Order
          </button>
        </div>

        <div className="filters">
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="purchase">Purchase Orders</option>
            <option value="sales">Sales Orders</option>
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Type</th>
              <th>Supplier/Customer</th>
              <th>Order Date</th>
              <th>Expected Delivery</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td><strong>{order.orderNumber}</strong></td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    backgroundColor: order.type === 'purchase' ? '#e0e7ff' : '#d1fae5',
                    color: order.type === 'purchase' ? '#3730a3' : '#065f46',
                    fontWeight: '600'
                  }}>
                    {order.type === 'purchase' ? '📦 Purchase' : '💰 Sales'}
                  </span>
                </td>
                <td>{order.supplier || order.customer}</td>
                <td>{order.orderDate}</td>
                <td>{order.expectedDelivery || order.deliveryDate}</td>
                <td><strong>₹{order.totalAmount.toLocaleString()}</strong></td>
                <td><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
