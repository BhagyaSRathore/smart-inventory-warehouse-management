import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createOrder, getRestockRecommendations, getWarehouses } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Restock() {
  const [recommendations, setRecommendations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [poFormData, setPOFormData] = useState({
    orderNumber: '',
    productId: '',
    productName: '',
    quantity: '',
    costPrice: '',
    warehouseId: '',
    supplierName: '',
    notes: '',
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [recResult, warehousesResult] = await Promise.all([
          getRestockRecommendations(),
          getWarehouses(),
        ]);

        if (!active) return;
        setRecommendations(recResult || []);
        setWarehouses(warehousesResult || []);
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

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleCreatePO = (rec) => {
    setSelectedRec(rec);
    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    setPOFormData({
      orderNumber: poNumber,
      productId: rec.productId,
      productName: rec.productName,
      quantity: String(rec.recommendedQuantity || 0),
      costPrice: String(rec.costPrice || 0),
      warehouseId: rec.warehouseId || (warehouses[0]?.id || ''),
      supplierName: rec.supplierName || 'Not specified',
      notes: `Restock recommendation - Priority: ${rec.priority}`,
    });
    setIsPOModalOpen(true);
  };

  const handlePOFieldChange = (event) => {
    const { name, value } = event.target;
    setPOFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPO = async (event) => {
    event.preventDefault();

    if (!poFormData.orderNumber || !poFormData.productId || !poFormData.quantity) {
      setError('Order number, product, and quantity are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      await createOrder({
        orderNumber: poFormData.orderNumber,
        status: 'pending',
        items: [
          {
            productId: Number(poFormData.productId),
            quantity: Number(poFormData.quantity),
          },
        ],
      });

      setIsPOModalOpen(false);
      setSelectedRec(null);
      setPOFormData({
        orderNumber: '',
        productId: '',
        productName: '',
        quantity: '',
        costPrice: '',
        warehouseId: '',
        supplierName: '',
        notes: '',
      });
      
      alert('Purchase Order created successfully!');
    } catch (requestError) {
      setError(requestError.message || 'Unable to create purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const critical = useMemo(() => recommendations.filter((r) => r.priority === 'critical'), [recommendations]);
  const high = useMemo(() => recommendations.filter((r) => r.priority === 'high'), [recommendations]);
  const medium = useMemo(() => recommendations.filter((r) => r.priority === 'medium'), [recommendations]);
  const low = useMemo(() => recommendations.filter((r) => r.priority === 'low'), [recommendations]);

  const totalCost = useMemo(() => {
    const qty = Number(poFormData.quantity) || 0;
    const cost = Number(poFormData.costPrice) || 0;
    return qty * cost;
  }, [poFormData.quantity, poFormData.costPrice]);

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading restock recommendations…</div></div></div>;
  }

  if (error && !isPOModalOpen) {
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
                  <button className="btn btn-primary btn-sm" onClick={() => handleCreatePO(rec)}>
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

      {isPOModalOpen && (
        <div
          onClick={() => setIsPOModalOpen(false)}
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
              maxWidth: '700px',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.20)',
              display: 'flex',
              flexDirection: 'column',
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
                  Create Purchase Order
                </h2>

                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: '13px',
                    color: '#6b7280',
                  }}
                >
                  Enter purchase order details below
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
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
              onSubmit={handleSubmitPO}
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '18px',
                }}
              >
                {/* PO Number */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    PO Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  <input
                    name="orderNumber"
                    value={poFormData.orderNumber}
                    onChange={handlePOFieldChange}
                    required
                    readOnly
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      fontWeight: '600',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Product */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Product <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  <input
                    name="productName"
                    value={poFormData.productName}
                    readOnly
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                    }}
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Supplier
                  </label>

                  <input
                    value={poFormData.supplierName}
                    readOnly
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                    }}
                  />
                </div>

                {/* Warehouse */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Warehouse <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  <select
                    name="warehouseId"
                    value={poFormData.warehouseId}
                    onChange={handlePOFieldChange}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Quantity <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={poFormData.quantity}
                    onChange={handlePOFieldChange}
                    placeholder="Enter quantity"
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

                {/* Unit Cost */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Unit Cost (₹) <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  <input
                    name="costPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={poFormData.costPrice}
                    onChange={handlePOFieldChange}
                    placeholder="0.00"
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

                {/* Total Cost - Full Width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Total Cost
                  </label>

                  <input
                    value={`₹${totalCost.toFixed(2)}`}
                    readOnly
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      textAlign: 'center',
                    }}
                  />
                </div>

                {/* Notes - Full Width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    rows="3"
                    value={poFormData.notes}
                    onChange={handlePOFieldChange}
                    placeholder="Add any special instructions or notes..."
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
                  onClick={() => setIsPOModalOpen(false)}
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
                  {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
