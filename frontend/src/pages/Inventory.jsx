import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInventory, getProducts, getRacks, getWarehouses } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [racks, setRacks] = useState([]);
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const [inventoryResponse, productResponse, warehouseResponse, rackResponse] = await Promise.all([
          getInventory(),
          getProducts(),
          getWarehouses(),
          getRacks(),
        ]);

        setInventory(inventoryResponse || []);
        setProducts(productResponse || []);
        setWarehouses(warehouseResponse || []);
        setRacks(rackResponse || []);
        setError('');
      } catch (requestError) {
        setError(requestError.message || 'Unable to load inventory.');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const productMap = useMemo(() => Object.fromEntries(products.map((product) => [product.id, product])), [products]);
  const warehouseMap = useMemo(() => Object.fromEntries(warehouses.map((warehouse) => [warehouse.id, warehouse.name])), [warehouses]);
  const rackMap = useMemo(() => Object.fromEntries(racks.map((rack) => [rack.id, rack.name])), [racks]);

  const enrichedInventory = useMemo(() => inventory.map((entry) => {
    const product = productMap[entry.productId];
    const status = Number(entry.quantity || 0) === 0 ? 'out_of_stock' : Number(product?.reorderLevel || 0) >= Number(entry.quantity || 0) ? 'low_stock' : 'in_stock';
    return {
      ...entry,
      productName: product?.name || `Product #${entry.productId}`,
      warehouseName: warehouseMap[entry.warehouseId] || 'Unknown warehouse',
      rackName: rackMap[entry.rackId] || 'Unassigned',
      status,
    };
  }), [inventory, productMap, warehouseMap, rackMap]);

  const filteredInventory = enrichedInventory.filter((entry) => {
    const matchesWarehouse = warehouseFilter === 'All' || Number(entry.warehouseId) === Number(warehouseFilter);
    const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;
    return matchesWarehouse && matchesStatus;
  });

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading inventory…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load inventory.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Track stock across all locations</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Inventory List</h3>
        </div>

        <div className="filters">
          <select className="filter-select" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="All">All Warehouses</option>
            {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Rack</th>
              <th>Quantity</th>
              <th>Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length ? filteredInventory.map((entry) => (
              <tr key={entry.id}>
                <td><Link to={`/products/${entry.productId}`} className="link"><strong>{entry.productName}</strong></Link></td>
                <td><Link to={`/warehouses/${entry.warehouseId}`} className="link">{entry.warehouseName}</Link></td>
                <td>{entry.rackName}</td>
                <td><strong>{entry.quantity}</strong> units</td>
                <td>{productMap[entry.productId]?.reorderLevel || 0} units</td>
                <td><StatusBadge status={entry.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan="6" className="empty-state">No inventory records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}