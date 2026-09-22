import { useEffect, useState } from 'react';
import { createSupplier, getSuppliers } from '../services/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getSuppliers();
      setSuppliers(response || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name) {
      setError('Supplier name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createSupplier(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      await loadSuppliers();
    } catch (requestError) {
      setError(requestError.message || 'Unable to create supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading suppliers…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load suppliers.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Suppliers</h1>
        <p className="page-subtitle">Manage supplier relationships</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Supplier List</h3>
          <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}><span>➕</span> Add Supplier</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length ? suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td><strong>{supplier.name}</strong></td>
                <td>{supplier.email || '—'}</td>
                <td>{supplier.phone || '—'}</td>
                <td>{supplier.address || '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="empty-state">No suppliers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Supplier</h3>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <label>
                  <span>Name</span>
                  <input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} required />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} />
                </label>
                <label>
                  <span>Phone</span>
                  <input value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} />
                </label>
                <label className="full-width">
                  <span>Address</span>
                  <textarea rows="3" value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} />
                </label>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
