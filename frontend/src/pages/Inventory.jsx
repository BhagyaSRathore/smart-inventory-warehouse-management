import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getInventory, getWarehouses } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Inventory() {
  const [warehouseFilter, setWarehouse] = useState('All');
  const [statusFilter, setStatus] = useState('All');

  const inventory = getInventory();
  const warehouses = getWarehouses();

  const filteredInventory = inventory.filter(inv => {
    const matchesWarehouse = warehouseFilter === 'All' || inv.warehouseId === warehouseFilter;
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesWarehouse && matchesStatus;
  });

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
          <select
            className="filter-select"
            value={warehouseFilter}
            onChange={(e) => setWarehouse(e.target.value)}
          >
            <option value="All">All Warehouses</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
          >
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
              <th>Available</th>
              <th>Reserved</th>
              <th>Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(inv => (
              <tr key={inv.id}>
                <td>
                  <Link to={`/products/${inv.productId}`} className="link">
                    <strong>{inv.productName}</strong>
                  </Link>
                </td>
                <td>
                  <Link to={`/warehouses/${inv.warehouseId}`} className="link">
                    {inv.warehouseName}
                  </Link>
                </td>
                <td>{inv.rackNumber}</td>
                <td><strong>{inv.quantityAvailable}</strong> units</td>
                <td>{inv.quantityReserved} units</td>
                <td>{inv.reorderLevel} units</td>
                <td><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
