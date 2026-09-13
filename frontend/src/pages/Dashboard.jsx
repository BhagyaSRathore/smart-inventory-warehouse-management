import { Link } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle, 
  ShoppingCart, 
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getDashboardStats, getProducts, getRestockRecommendations, getWarehouses } from '../services/api';

export default function Dashboard() {
  const stats = getDashboardStats();
  const products = getProducts();
  const restock = getRestockRecommendations();
  const warehouses = getWarehouses();
  
  // Top selling products (demo data)
  const topProducts = products.slice(0, 5);
  
  // Critical restock items
  const criticalRestock = restock.filter(r => r.priority === 'critical');

  // Sales trend data (last 7 days)
  const salesData = [
    { date: 'Mon', sales: 12400, orders: 45 },
    { date: 'Tue', sales: 15200, orders: 52 },
    { date: 'Wed', sales: 18600, orders: 61 },
    { date: 'Thu', sales: 14800, orders: 48 },
    { date: 'Fri', sales: 22100, orders: 72 },
    { date: 'Sat', sales: 19300, orders: 65 },
    { date: 'Sun', sales: 16800, orders: 58 },
  ];

  // Warehouse data
  const warehouseData = warehouses.map(wh => ({
    name: wh.name.split(' ')[1], // Extract city name
    stock: wh.currentUtilization,
    capacity: wh.capacity
  }));

  // Stock status distribution
  const stockStatusData = [
    { name: 'In Stock', value: products.filter(p => p.status === 'in_stock').length, color: 'var(--success-500)' },
    { name: 'Low Stock', value: products.filter(p => p.status === 'low_stock').length, color: 'var(--warning-500)' },
    { name: 'Out of Stock', value: products.filter(p => p.status === 'out_of_stock').length, color: 'var(--danger-500)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Overview</h1>
          <p className="page-subtitle">Monitor stock levels, warehouse performance, and inventory intelligence</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="primary"
          period="Active catalog"
        />
        <StatCard
          title="Total Stock Units"
          value={stats.totalStock.toLocaleString()}
          icon={TrendingUp}
          color="success"
          trend="up"
          trendValue="8.4%"
          period="vs last month"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="warning"
          trend="up"
          trendValue="3 items"
          period="since yesterday"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockProducts}
          icon={AlertCircle}
          color="danger"
          period="Requires attention"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingPurchases}
          icon={ShoppingCart}
          color="info"
          trend="up"
          trendValue="2 new"
          period="today"
        />
        <StatCard
          title="Revenue Today"
          value={`₹${(stats.salesToday / 1000).toFixed(1)}K`}
          icon={DollarSign}
          color="success"
          trend="up"
          trendValue="12.5%"
          period="vs yesterday"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales Overview</h3>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-tertiary)" 
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <YAxis 
                stroke="var(--text-tertiary)" 
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: 'var(--text-sm)' }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--primary-600)" 
                strokeWidth={2}
                name="Sales (₹)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inventory by Warehouse</h3>
            <Link to="/warehouses" className="link" style={{ fontSize: 'var(--text-sm)' }}>
              View all
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={warehouseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-tertiary)" 
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <YAxis 
                stroke="var(--text-tertiary)" 
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: 'var(--text-sm)' }} />
              <Bar dataKey="stock" fill="var(--primary-500)" name="Current Stock" />
              <Bar dataKey="capacity" fill="var(--gray-300)" name="Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Row */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Selling Products</h3>
            <Link to="/products" className="link" style={{ fontSize: 'var(--text-sm)' }}>
              View all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
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
              {topProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <Link to={`/products/${product.id}`} className="link" style={{ fontWeight: 'var(--font-semibold)' }}>
                      {product.name}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{product.currentStock} units</td>
                  <td style={{ fontWeight: 'var(--font-semibold)' }}>₹{product.sellingPrice.toFixed(2)}</td>
                  <td><StatusBadge status={product.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Sparkles size={20} style={{ color: 'var(--warning-600)' }} />
              <h3 className="card-title">AI Inventory Insights</h3>
            </div>
            <Link to="/ai-assistant" className="btn btn-sm btn-secondary">
              Ask AI
            </Link>
          </div>
          <ul className="insights-list">
            <li className="insight-item">
              {stats.lowStockProducts + stats.outOfStockProducts} products may reach reorder level within the next 7 days. Immediate action recommended for {criticalRestock.length} items.
            </li>
            <li className="insight-item">
              Warehouse B (Delhi NCR) has the highest inventory value at ₹2.4M with 63% capacity utilization.
            </li>
            <li className="insight-item">
              USB-C Cable 2m shows unusually high demand this week (+45%). Consider increasing stock levels.
            </li>
            <li className="insight-item">
              {criticalRestock.length} products require immediate restocking to avoid stockouts and maintain service levels.
            </li>
          </ul>
        </div>
      </div>

      {/* Stock Status Distribution */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Stock Status Distribution</h3>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            {stockStatusData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: item.color }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={stockStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {stockStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
