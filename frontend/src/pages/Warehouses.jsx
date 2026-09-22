import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInventory, getProducts, getWarehouses } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadWarehouses = async () => {
      try {
        setLoading(true);
        const [warehouseResponse, inventoryResponse, productResponse] = await Promise.all([
          getWarehouses(),
          getInventory(),
          getProducts(),
        ]);

        if (!active) return;

        setWarehouses(warehouseResponse || []);
        setInventory(inventoryResponse || []);
        setProducts(productResponse || []);
        setError('');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Unable to load warehouses.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadWarehouses();

    return () => {
      active = false;
    };
  }, []);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );

  const warehouseSummaries = useMemo(
    () => warehouses.map((warehouse) => {
      const warehouseInventory = inventory.filter(
        (entry) => Number(entry.warehouseId) === Number(warehouse.id),
      );

      const totalUnits = warehouseInventory.reduce(
        (sum, entry) => sum + Number(entry.quantity || 0),
        0,
      );

      const uniqueProducts = new Set(warehouseInventory.map((entry) => entry.productId)).size;

      const lowStockItems = warehouseInventory.filter((entry) => {
        const product = productMap[entry.productId];
        return product && Number(entry.quantity || 0) <= Number(product.reorderLevel || 0);
      }).length;

      return {
        ...warehouse,
        totalUnits,
        uniqueProducts,
        lowStockItems,
        status: lowStockItems > 0 ? 'low_stock' : 'in_stock',
      };
    }),
    [warehouses, inventory, productMap],
  );

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading warehouses…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load warehouses.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Warehouses</h1>
        <p className="page-subtitle">Track warehouse inventory and stock alerts</p>
      </div>

      <div className="grid grid-3">
        {warehouseSummaries.map((warehouse) => (
          <Link
            key={warehouse.id}
            to={`/warehouses/${warehouse.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{warehouse.name}</h3>
                  <StatusBadge status={warehouse.status} />
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>📍 {warehouse.location || 'Location not set'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Current Stock</p>
                  <p style={{ fontWeight: '600', margin: 0 }}>{warehouse.totalUnits.toLocaleString()} units</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Products</p>
                  <p style={{ fontWeight: '600', margin: 0 }}>{warehouse.uniqueProducts}</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Low Stock</p>
                  <p style={{ fontWeight: '600', margin: 0, color: warehouse.lowStockItems > 0 ? '#f59e0b' : '#10b981' }}>
                    {warehouse.lowStockItems}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', margin: '0 0 4px 0' }}>Items</p>
                  <p style={{ fontWeight: '600', margin: 0 }}>{warehouseSummaries.filter((entry) => Number(entry.id) === Number(warehouse.id))[0]?.totalUnits ? 'Live data' : 'No stock'}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
