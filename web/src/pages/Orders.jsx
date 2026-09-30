import { useEffect, useState } from 'react';
import {
  createOrder,
  getOrders,
  getProducts,
} from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [statusFilter, setStatusFilter] =
    useState('All');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Order Modal
  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formData, setFormData] = useState({
    orderNumber: '',
    status: 'pending',
    productId: '',
    quantity: '1',
  });

  // =========================
  // LOAD ORDERS
  // =========================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const [
        orderResponse,
        productResponse,
      ] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);

      setOrders(orderResponse || []);
      setProducts(productResponse || []);
      setError('');
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load orders.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================
  // OPEN MODAL
  // =========================

  const openModal = () => {
    setError('');

    setFormData({
      orderNumber: '',
      status: 'pending',
      productId: '',
      quantity: '1',
    });

    setIsModalOpen(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setError('');
  };

  // =========================
  // HANDLE FORM CHANGE
  // =========================

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // CREATE ORDER
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.orderNumber.trim()) {
      setError('Order number is required.');
      return;
    }

    if (!formData.productId) {
      setError('Product is required.');
      return;
    }

    if (
      formData.quantity === '' ||
      Number(formData.quantity) < 1
    ) {
      setError(
        'Quantity must be at least 1.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await createOrder({
        orderNumber:
          formData.orderNumber.trim(),

        status: formData.status,

        items: [
          {
            productId: Number(
              formData.productId
            ),
            quantity: Number(
              formData.quantity
            ),
          },
        ],
      });

      setIsModalOpen(false);

      setFormData({
        orderNumber: '',
        status: 'pending',
        productId: '',
        quantity: '1',
      });

      await loadOrders();
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to create order.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // FILTER
  // =========================

  const filteredOrders = orders.filter(
    (order) =>
      statusFilter === 'All' ||
      order.status === statusFilter
  );

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-title">
            Loading orders...
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error && !isModalOpen) {
    return (
      <div className="card">
        <div className="empty-state">

          <div className="empty-state-title">
            Unable to load orders.
          </div>

          <div className="empty-state-description">
            {error}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openModal}
            style={{
              marginTop: '16px',
            }}
          >
            + Create Order
          </button>

        </div>
      </div>
    );
  }

  return (
    <div>

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">

        <div>
          <h1 className="page-title">
            Orders
          </h1>

          <p className="page-subtitle">
            Manage purchase and sales orders
          </p>
        </div>

        <button
          className="btn btn-primary"
          type="button"
          onClick={openModal}
        >
          + Create Order
        </button>

      </div>

      {/* =========================
          ORDER LIST
      ========================= */}

      <div className="card">

        <div className="card-header">

          <div>
            <h3 className="card-title">
              Order List
            </h3>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                opacity: 0.65,
              }}
            >
              {orders.length} order
              {orders.length !== 1
                ? 's'
                : ''}{' '}
              available
            </p>
          </div>

          <button
            className="btn btn-primary"
            type="button"
            onClick={openModal}
          >
            + Create Order
          </button>

        </div>

        {/* FILTER */}

        <div className="filters">

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="confirmed">
              Confirmed
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

        </div>

        {/* ORDER TABLE */}

        {filteredOrders.length ? (
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

              {filteredOrders.map(
                (order) => (
                  <tr key={order.id}>

                    <td>
                      <strong>
                        {order.orderNumber ||
                          `#${order.id}`}
                      </strong>
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          order.status ||
                          'pending'
                        }
                      />
                    </td>

                    <td>
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      {order.id}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>
        ) : (
          <div className="empty-state">

            <div className="empty-state-title">
              No orders found.
            </div>

            <div className="empty-state-description">
              Create your first order to
              get started.
            </div>


          </div>
        )}

      </div>

      {/* =========================
          CREATE ORDER MODAL
      ========================= */}

      {isModalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: '620px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow:
                '0 25px 60px rgba(0, 0, 0, 0.20)',
              overflow: 'hidden',
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                padding: '22px 24px',
                borderBottom:
                  '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
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
                  Create Order
                </h2>

                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: '13px',
                    color: '#6b7280',
                  }}
                >
                  Enter order details below
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                style={{
                  border: 'none',
                  background:
                    'transparent',
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

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              style={{
                padding: '24px',
              }}
            >

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '18px',
                }}
              >

                {/* ORDER NUMBER */}

                <div>

                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Order Number{' '}
                    <span
                      style={{
                        color: '#dc2626',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <input
                    name="orderNumber"
                    value={
                      formData.orderNumber
                    }
                    onChange={
                      handleFieldChange
                    }
                    placeholder="Enter order number"
                    required
                    style={{
                      width: '100%',
                      boxSizing:
                        'border-box',
                      padding:
                        '11px 12px',
                      border:
                        '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />

                </div>

                {/* STATUS */}

                <div>

                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleFieldChange
                    }
                    style={{
                      width: '100%',
                      boxSizing:
                        'border-box',
                      padding:
                        '11px 12px',
                      border:
                        '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >

                    <option value="pending">
                      Pending
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                  </select>

                </div>

                {/* PRODUCT */}

                <div>

                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Product{' '}
                    <span
                      style={{
                        color: '#dc2626',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <select
                    name="productId"
                    value={
                      formData.productId
                    }
                    onChange={
                      handleFieldChange
                    }
                    required
                    style={{
                      width: '100%',
                      boxSizing:
                        'border-box',
                      padding:
                        '11px 12px',
                      border:
                        '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >

                    <option value="">
                      Select product
                    </option>

                    {products.map(
                      (product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* QUANTITY */}

                <div>

                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '7px',
                    }}
                  >
                    Quantity{' '}
                    <span
                      style={{
                        color: '#dc2626',
                      }}
                    >
                      *
                    </span>
                  </label>

                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleFieldChange
                    }
                    placeholder="Enter quantity"
                    required
                    style={{
                      width: '100%',
                      boxSizing:
                        'border-box',
                      padding:
                        '11px 12px',
                      border:
                        '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />

                </div>

              </div>

              {/* ERROR */}

              {error && (
                <div
                  style={{
                    marginTop: '16px',
                    padding:
                      '10px 12px',
                    borderRadius: '8px',
                    background:
                      '#fef2f2',
                    color: '#b91c1c',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* MODAL FOOTER */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop:
                    '1px solid #e5e7eb',
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
                  {isSubmitting
                    ? 'Creating...'
                    : 'Create Order'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}