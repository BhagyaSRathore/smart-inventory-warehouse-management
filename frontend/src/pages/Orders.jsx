import { useEffect, useState } from 'react';
import { createOrder, getOrders, getProducts } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ orderNumber: '', status: 'pending', productId: '', quantity: '1' });

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [orderResponse, productResponse] = await Promise.all([getOrders(), getProducts()]);
      setOrders(orderResponse || []);
      setProducts(productResponse || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.orderNumber || !formData.productId || !formData.quantity) {
      setError('Order number, product, and quantity are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createOrder({
        orderNumber: formData.orderNumber,
        status: formData.status,
        items: [{ productId: Number(formData.productId), quantity: Number(formData.quantity) }],
      });

      setIsModalOpen(false);
      setFormData({ orderNumber: '', status: 'pending', productId: '', quantity: '1' });
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message || 'Unable to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((order) => statusFilter === 'All' || order.status === statusFilter);

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading orders…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load orders.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">Manage purchase and sales orders</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Order List</h3>
          <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}><span>➕</span> Create Order</button>
        </div>

        <div className="filters">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
              <th>Status</th>
              <th>Created</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length ? filteredOrders.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.orderNumber || `#${order.id}`}</strong></td>
                <td><StatusBadge status={order.status || 'pending'} /></td>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
                <td>{order.id}</td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="empty-state">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Order</h3>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <label>
                  <span>Order Number</span>
                  <input value={formData.orderNumber} onChange={(event) => setFormData((prev) => ({ ...prev, orderNumber: event.target.value }))} required />
                </label>
                <label>
                  <span>Status</span>
                  <select value={formData.status} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label>
                  <span>Product</span>
                  <select value={formData.productId} onChange={(event) => setFormData((prev) => ({ ...prev, productId: event.target.value }))} required>
                    <option value="">Select product</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Quantity</span>
                  <input type="number" min="1" value={formData.quantity} onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))} required />
                </label>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
