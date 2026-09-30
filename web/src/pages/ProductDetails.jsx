import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getProductById,
  getPredictionByProduct,
  getInventoryByProduct,
} from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProductDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const [productResponse, predictionResponse, inventoryResponse] =
          await Promise.all([
            getProductById(id),
            getPredictionByProduct(id),
            getInventoryByProduct(id),
          ]);

        setProduct(productResponse || null);
        setPrediction(predictionResponse || null);
        setInventory(inventoryResponse || []);
      } catch (requestError) {
        console.error('Failed to load product details:', requestError);
        setError(requestError.message || 'Unable to load product details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProductDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-title">Loading product details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-title">Unable to load product</div>
          <div className="empty-state-description">{error}</div>

          <Link
            to="/products"
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-title">Product not found</div>

          <Link
            to="/products"
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const currentStock = inventory.reduce(
  (total, item) => total + Number(item.quantity || item.quantityAvailable || 0),
  0
);

  return (
    <div>
      {/* Back */}
      <div style={{ marginBottom: '18px' }}>
        <Link to="/products" className="link">
          ← Back to Products
        </Link>
      </div>

      {/* Product Header */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                opacity: 0.65,
                marginBottom: '7px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Product Details
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: '30px',
                fontWeight: '700',
              }}
            >
              {product.name}
            </h1>

            <p
              style={{
                margin: '8px 0 0',
                opacity: 0.7,
              }}
            >
              SKU: {product.sku || 'N/A'}
            </p>
          </div>

          <div>
            <StatusBadge
              status={
                currentStock === 0
                  ? 'out_of_stock'
                  : currentStock <= Number(product.reorderLevel || 0)
                    ? 'low_stock'
                    : 'in_stock'
              }
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ opacity: 0.65, fontSize: '13px' }}>
            Current Stock
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              marginTop: '8px',
            }}
          >
            {currentStock}
          </div>
          <div style={{ opacity: 0.6, fontSize: '13px' }}>
            units available
          </div>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <div style={{ opacity: 0.65, fontSize: '13px' }}>
            Selling Price
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              marginTop: '8px',
            }}
          >
            ₹{Number(product.price || 0).toFixed(2)}
          </div>
          <div style={{ opacity: 0.6, fontSize: '13px' }}>
            per unit
          </div>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <div style={{ opacity: 0.65, fontSize: '13px' }}>
            Reorder Level
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              marginTop: '8px',
            }}
          >
            {product.reorderLevel ?? 0}
          </div>
          <div style={{ opacity: 0.6, fontSize: '13px' }}>
            units
          </div>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <div style={{ opacity: 0.65, fontSize: '13px' }}>
            Safety Stock
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '700',
              marginTop: '8px',
            }}
          >
            {product.safetyStock ?? 0}
          </div>
          <div style={{ opacity: 0.6, fontSize: '13px' }}>
            units
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '24px',
        }}
      >
        <h3
          className="card-title"
          style={{ marginBottom: '22px' }}
        >
          Product Information
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          <InfoItem label="Product Name" value={product.name} />
          <InfoItem label="SKU" value={product.sku} />
          <InfoItem label="Barcode" value={product.barcode} />
          <InfoItem
            label="Category"
            value={
              product.category?.name ||
              product.categoryName ||
              'N/A'
            }
          />
          <InfoItem
            label="Supplier"
            value={
              product.supplier?.name ||
              product.supplierName ||
              'N/A'
            }
          />
          <InfoItem
            label="Cost Price"
            value={`₹${Number(product.costPrice || 0).toFixed(2)}`}
          />
        </div>

        {product.description && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(128,128,128,0.18)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                opacity: 0.65,
                marginBottom: '7px',
              }}
            >
              Description
            </div>

            <div style={{ lineHeight: '1.6' }}>
              {product.description}
            </div>
          </div>
        )}
      </div>

      {/* Prediction */}
      {prediction && (
        <div
          className="card"
          style={{
            marginBottom: '24px',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '22px',
            }}
          >
            <h3 className="card-title" style={{ margin: 0 }}>
              Stock Prediction & Risk
            </h3>

            {prediction.riskLevel && (
              <StatusBadge status={prediction.riskLevel} />
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '18px',
                borderRadius: '10px',
                background: 'var(--bg-secondary, rgba(128,128,128,0.08))',
              }}
            >
              <div style={{ fontSize: '13px', opacity: 0.65 }}>
                Predicted Demand
              </div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '22px',
                  marginTop: '7px',
                }}
              >
                {prediction.predictedDemand ??
                  prediction.demand ??
                  'N/A'}
              </strong>
            </div>

            <div
              style={{
                padding: '18px',
                borderRadius: '10px',
                background: 'var(--bg-secondary, rgba(128,128,128,0.08))',
              }}
            >
              <div style={{ fontSize: '13px', opacity: 0.65 }}>
                Current Stock
              </div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '22px',
                  marginTop: '7px',
                }}
              >
                {prediction.currentStock ?? currentStock}
              </strong>
            </div>
          </div>

          {prediction.riskLevel === 'high' && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(220, 80, 80, 0.3)',
              }}
            >
              <strong>High Risk</strong>
              <div style={{ marginTop: '4px', opacity: 0.75 }}>
                Stock levels are approaching a critical threshold.
                Consider restocking soon.
              </div>
            </div>
          )}

          {prediction.riskLevel === 'medium' && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(220, 160, 50, 0.3)',
              }}
            >
              <strong>Medium Risk</strong>
              <div style={{ marginTop: '4px', opacity: 0.75 }}>
                Stock is adequate but should be monitored closely.
              </div>
            </div>
          )}

          {prediction.riskLevel === 'low' && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(70, 170, 100, 0.3)',
              }}
            >
              <strong>Low Risk</strong>
              <div style={{ marginTop: '4px', opacity: 0.75 }}>
                Stock level is currently healthy.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Locations */}
      <div className="card" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Inventory Locations
            </h3>

            <p
              style={{
                margin: '5px 0 0',
                fontSize: '13px',
                opacity: 0.65,
              }}
            >
              Where this product is currently stored
            </p>
          </div>

          <strong>{inventory.length} location(s)</strong>
        </div>

        {inventory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Rack</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      {inv.warehouseId ? (
                        <Link
                          to={`/warehouses/${inv.warehouseId}`}
                          className="link"
                        >
                          {inv.warehouseName ||
                            inv.warehouse?.name ||
                            'Warehouse'}
                        </Link>
                      ) : (
                        inv.warehouseName ||
                        inv.warehouse?.name ||
                        'N/A'
                      )}
                    </td>

                    <td>
                      {inv.rackNumber ||
                        inv.rack?.rackNumber ||
                        inv.rack?.name ||
                        'N/A'}
                    </td>

                    <td>
                      <strong>
                        {inv.quantityAvailable ??
                          inv.quantity ??
                          0}
                      </strong>{' '}
                      units
                    </td>

                    <td>
                      {inv.quantityReserved ?? 0} units
                    </td>

                    <td>
                      <StatusBadge
                        status={inv.status || 'in_stock'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">
              No inventory found
            </div>

            <div className="empty-state-description">
              This product is not currently assigned to any
              inventory location.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: '600',
          opacity: 0.6,
          marginBottom: '6px',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '15px',
          fontWeight: '500',
        }}
      >
        {value || 'N/A'}
      </div>
    </div>
  );
}