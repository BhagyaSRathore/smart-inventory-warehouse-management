import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getInventoryByWarehouse, getProducts, getWarehouseById } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function WarehouseDetails() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadWarehouse = async () => {
      try {
        setLoading(true);
        const [warehouseResponse, inventoryResponse, productResponse] = await Promise.all([
          getWarehouseById(id),
          getInventoryByWarehouse(id),
          getProducts(),
        ]);

        if (!active) return;

        setWarehouse(warehouseResponse);
        setInventory(inventoryResponse || []);
        setProducts(productResponse || []);
        setError('');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Unable to load warehouse details.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadWarehouse();

    return () => {
      active = false;
    };
  }, [id]);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );

  const inventoryRows = useMemo(
    () => inventory.map((entry) => {
      const product = productMap[entry.productId];
      const quantity = Number(entry.quantity || 0);
      const reorderLevel = Number(product?.reorderLevel || 0);
      const status = quantity === 0 ? 'out_of_stock' : quantity <= reorderLevel ? 'low_stock' : 'in_stock';

      return {
        ...entry,
        productName: product?.name || `Product #${entry.productId}`,
        reorderLevel,
        status,
      };
    }),
    [inventory, productMap],
  );

  const totalUnits = inventoryRows.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  const totalProducts = new Set(inventoryRows.map((entry) => entry.productId)).size;
  const lowStockItems = inventoryRows.filter((entry) => entry.status === 'low_stock').length;

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading warehouse…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load warehouse.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  if (!warehouse) {
    return (
      <div className="card">
        <p>Warehouse not found</p>
        <Link to="/warehouses" className="btn btn-primary">Back to Warehouses</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/warehouses" className="link">← Back to Warehouses</Link>
        <h1 className="page-title">{warehouse.name}</h1>
        <p className="page-subtitle">📍 {warehouse.location || 'Location not set'}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Total Units</h3>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{totalUnits.toLocaleString()}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>units in stock</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Products</h3>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{totalProducts}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>active SKUs</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Low Stock</h3>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{lowStockItems}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>items need attention</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Warehouse Information</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Location</p>
            <p>{warehouse.location || 'Location not set'}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</p>
            <StatusBadge status={lowStockItems > 0 ? 'low_stock' : 'in_stock'} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Inventory in this Warehouse ({inventoryRows.length} items)</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventoryRows.length ? inventoryRows.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <Link to={`/products/${entry.productId}`} className="link">
                    <strong>{entry.productName}</strong>
                  </Link>
                </td>
                <td><strong>{entry.quantity}</strong> units</td>
                <td>{entry.reorderLevel} units</td>
                <td><StatusBadge status={entry.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="empty-state">No inventory records found for this warehouse.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
