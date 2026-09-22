import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getDashboard, getInventory, getProducts, getWarehouses } from '../services/api';

const defaultSummary = {
  totalProducts: 0,
  totalWarehouses: 0,
  totalStock: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  pendingOrders: 0,
  totalOrders: 0,
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(defaultSummary);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, productsResponse, inventoryResponse, warehouseResponse] = await Promise.all([
          getDashboard(),
          getProducts(),
          getInventory(),
          getWarehouses(),
        ]);

        setDashboard(dashboardResponse?.summary || defaultSummary);
        setProducts(productsResponse || []);
        setInventory(inventoryResponse || []);
        setWarehouses(warehouseResponse || []);
        setError('');
      } catch (requestError) {
        setError(requestError.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const inventoryTotals = useMemo(() => {
    return products.map((product) => {
      const total = inventory
        .filter((entry) => Number(entry.productId) === Number(product.id))
        .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);

      let status = 'in_stock';
      if (total === 0) status = 'out_of_stock';
      else if (product.reorderLevel !== undefined && total <= Number(product.reorderLevel)) status = 'low_stock';

      return {
        ...product,
        totalQuantity: total,
        status,
      };
    });
  }, [products, inventory]);

  const topProducts = inventoryTotals.slice(0, 5);
  const criticalItems = inventoryTotals.filter((product) => product.status === 'low_stock' || product.status === 'out_of_stock');

  const warehouseData = warehouses.map((warehouse) => {
    const totalStock = inventory
      .filter((entry) => Number(entry.warehouseId) === Number(warehouse.id))
      .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);

    return {
      name: warehouse.name,
      stock: totalStock,
      capacity: Math.max(totalStock + 25, 100),
    };
  });

  const stockStatusData = [
    { name: 'In Stock', value: inventoryTotals.filter((product) => product.status === 'in_stock').length, color: 'var(--success-500)' },
    { name: 'Low Stock', value: inventoryTotals.filter((product) => product.status === 'low_stock').length, color: 'var(--warning-500)' },
    { name: 'Out of Stock', value: inventoryTotals.filter((product) => product.status === 'out_of_stock').length, color: 'var(--danger-500)' },
  ];

  const chartSales = [
    { date: 'Mon', sales: 7800 },
    { date: 'Tue', sales: 9000 },
    { date: 'Wed', sales: 8700 },
    { date: 'Thu', sales: 10500 },
    { date: 'Fri', sales: 11800 },
    { date: 'Sat', sales: 12300 },
    { date: 'Sun', sales: 9800 },
  ];

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading dashboard…</div></div></div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-title">Unable to load dashboard.</div>
          <div className="empty-state-description">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Overview</h1>
          <p className="page-subtitle">Monitor stock levels, warehouse performance, and inventory intelligence</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Products" value={dashboard.totalProducts || inventoryTotals.length} icon={Package} color="primary" period="Active catalog" />
        <StatCard title="Total Stock Units" value={(dashboard.totalStock || 0).toLocaleString()} icon={TrendingUp} color="success" trend="up" trendValue="Live" period="Current inventory" />
        <StatCard title="Low Stock" value={dashboard.lowStockCount || criticalItems.filter((item) => item.status === 'low_stock').length} icon={AlertTriangle} color="warning" period="Needs attention" />
        <StatCard title="Out of Stock" value={dashboard.outOfStockCount || criticalItems.filter((item) => item.status === 'out_of_stock').length} icon={AlertCircle} color="danger" period="Requires action" />
        <StatCard title="Pending Orders" value={dashboard.pendingOrders || 0} icon={ShoppingCart} color="info" period="Open orders" />
        <StatCard title="Total Orders" value={dashboard.totalOrders || 0} icon={TrendingUp} color="success" period="All records" />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales Overview</h3>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Current week</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" style={{ fontSize: 'var(--text-xs)' }} />
              <YAxis stroke="var(--text-tertiary)" style={{ fontSize: 'var(--text-xs)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }} />
              <Legend wrapperStyle={{ fontSize: 'var(--text-sm)' }} />
              <Line type="monotone" dataKey="sales" stroke="var(--primary-600)" strokeWidth={2} name="Sales (units)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inventory by Warehouse</h3>
            <Link to="/warehouses" className="link" style={{ fontSize: 'var(--text-sm)' }}>View all</Link>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={warehouseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" stroke="var(--text-tertiary)" style={{ fontSize: 'var(--text-xs)' }} />
              <YAxis stroke="var(--text-tertiary)" style={{ fontSize: 'var(--text-xs)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }} />
              <Legend wrapperStyle={{ fontSize: 'var(--text-sm)' }} />
              <Bar dataKey="stock" fill="var(--primary-500)" name="Stock" />
              <Bar dataKey="capacity" fill="var(--gray-300)" name="Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Products</h3>
            <Link to="/products" className="link" style={{ fontSize: 'var(--text-sm)' }}>View all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length ? topProducts.map((product) => (
                <tr key={product.id}>
                  <td><Link to={`/products/${product.id}`} className="link" style={{ fontWeight: 'var(--font-semibold)' }}>{product.name}</Link></td>
                  <td>{product.totalQuantity} units</td>
                  <td>₹{Number(product.price || 0).toFixed(2)}</td>
                  <td><StatusBadge status={product.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="empty-state">No products available.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Sparkles size={20} style={{ color: 'var(--warning-600)' }} />
              <h3 className="card-title">Inventory Insights</h3>
            </div>
            <Link to="/ai-assistant" className="btn btn-sm btn-secondary">Ask AI</Link>
          </div>
          <ul className="insights-list">
            <li className="insight-item">{criticalItems.length} items currently need attention based on current inventory and reorder levels.</li>
            <li className="insight-item">{warehouses.length} active warehouses are currently being monitored for stock movement.</li>
            <li className="insight-item">{dashboard.totalProducts || inventoryTotals.length} products are represented across the live backend catalog.</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Stock Status Distribution</h3>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            {stockStatusData.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: item.color }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={stockStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value">
              {stockStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
