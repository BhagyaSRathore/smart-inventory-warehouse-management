import { useParams, Link } from 'react-router-dom';
import { getProductById, getPredictionByProduct, getInventoryByProduct } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ProductDetails() {
  const { id } = useParams();
  const product = getProductById(id);
  const prediction = getPredictionByProduct(id);
  const inventory = getInventoryByProduct(id);

  if (!product) {
    return (
      <div className="card">
        <p>Product not found</p>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/products" className="link">← Back to Products</Link>
        <h1 className="page-title">{product.name}</h1>
        <p className="page-subtitle">SKU: {product.sku} | Barcode: {product.barcode}</p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Product Information</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Name</p>
              <p style={{ fontWeight: '600' }}>{product.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Description</p>
              <p>{product.description}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Category</p>
                <p>{product.category}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Supplier</p>
                <p>{product.supplier}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Cost Price</p>
                <p>₹{product.costPrice.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Selling Price</p>
                <p style={{ fontWeight: '600', fontSize: '18px', color: 'var(--primary-color)' }}>
                  ₹{product.sellingPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Stock Information</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Current Stock</p>
              <p style={{ fontWeight: '700', fontSize: '24px', color: product.currentStock === 0 ? 'var(--danger-color)' : 'var(--text-dark)' }}>
                {product.currentStock} units
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Reorder Level</p>
                <p>{product.reorderLevel} units</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Safety Stock</p>
                <p>{product.safetyStock} units</p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</p>
              <StatusBadge status={product.status} />
            </div>
          </div>
        </div>
      </div>

      {prediction && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>🤖 AI Intelligence & Predictions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#78350f', marginBottom: '4px' }}>Predicted 7-Day Demand</p>
              <p style={{ fontWeight: '700', fontSize: '20px', color: '#78350f' }}>{prediction.predicted7Day} units</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#78350f', marginBottom: '4px' }}>Predicted 30-Day Demand</p>
              <p style={{ fontWeight: '700', fontSize: '20px', color: '#78350f' }}>{prediction.predicted30Day} units</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#78350f', marginBottom: '4px' }}>Demand Trend</p>
              <StatusBadge status={prediction.demandTrend} text={prediction.demandTrend.toUpperCase()} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#78350f', marginBottom: '4px' }}>Risk Level</p>
              <StatusBadge status={prediction.riskLevel} text={prediction.riskLevel.toUpperCase()} />
            </div>
          </div>
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#78350f' }}>AI Explanation:</p>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#78350f' }}>
              {prediction.riskLevel === 'critical' && `⚠️ CRITICAL: Current stock (${product.currentStock} units) is insufficient to meet predicted demand. Immediate restocking required to avoid stockouts.`}
              {prediction.riskLevel === 'high' && `⚠️ HIGH RISK: Stock levels are approaching critical threshold. Current inventory will not cover predicted demand. Restock soon.`}
              {prediction.riskLevel === 'medium' && `⚠️ MEDIUM RISK: Stock is adequate but monitor closely. Consider restocking within 1-2 weeks based on demand trend.`}
              {prediction.riskLevel === 'low' && `✅ LOW RISK: Stock level is healthy and can cover predicted demand for the next 30 days. Continue monitoring trend.`}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '20px' }}>📍 Inventory Locations</h3>
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
            {inventory.map(inv => (
              <tr key={inv.id}>
                <td>
                  <Link to={`/warehouses/${inv.warehouseId}`} className="link">
                    {inv.warehouseName}
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
