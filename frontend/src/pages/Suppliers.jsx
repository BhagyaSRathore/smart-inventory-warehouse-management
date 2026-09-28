import { useEffect, useState } from 'react';
import { createSupplier, getSuppliers } from '../services/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

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

  const openModal = () => {
    setError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setError('');
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError('Supplier name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await createSupplier({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
      });

      setIsModalOpen(false);

      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
      });

      await loadSuppliers();
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to create supplier.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-title">
            Loading suppliers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">
            Manage your supplier relationships
          </p>
        </div>
      </div>

      {/* Supplier List */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Supplier List</h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                opacity: 0.65,
              }}
            >
              {suppliers.length} supplier
              {suppliers.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <button
            className="btn btn-primary"
            type="button"
            onClick={openModal}
          >
            + Add Supplier
          </button>
        </div>

        {error && !isModalOpen && (
          <div className="form-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {suppliers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
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
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <strong>{supplier.name}</strong>
                    </td>

                    <td>
                      {supplier.email || '—'}
                    </td>

                    <td>
                      {supplier.phone || '—'}
                    </td>

                    <td>
                      {supplier.address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">
              No suppliers found
            </div>

            <div className="empty-state-description">
              Add your first supplier to get started.
            </div>

            <button
              className="btn btn-primary"
              type="button"
              onClick={openModal}
              style={{ marginTop: '16px' }}
            >
              + Add Supplier
            </button>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
     {isModalOpen && (
  <div
    onClick={closeModal}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999,
    }}
  >
    <div
      onClick={(event) => event.stopPropagation()}
      style={{
        width: '100%',
        maxWidth: '620px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.20)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '22px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '21px',
              fontWeight: '700',
            }}
          >
            Add Supplier
          </h2>

          <p
            style={{
              margin: '5px 0 0',
              fontSize: '13px',
              color: '#6b7280',
            }}
          >
            Enter supplier details below
          </p>
        </div>

        <button
          type="button"
          onClick={closeModal}
          disabled={isSubmitting}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '26px',
            lineHeight: 1,
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '18px',
          }}
        >
          {/* Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '7px',
              }}
            >
              Supplier Name <span style={{ color: '#dc2626' }}>*</span>
            </label>

            <input
              name="name"
              value={formData.name}
              onChange={handleFieldChange}
              placeholder="Enter supplier name"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '7px',
              }}
            >
              Email
            </label>

            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFieldChange}
              placeholder="supplier@example.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '7px',
              }}
            >
              Phone
            </label>

            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleFieldChange}
              placeholder="Enter phone number"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Address */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '7px',
              }}
            >
              Address
            </label>

            <textarea
              name="address"
              rows="4"
              value={formData.address}
              onChange={handleFieldChange}
              placeholder="Enter supplier address"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
         
    </div>
  );
}