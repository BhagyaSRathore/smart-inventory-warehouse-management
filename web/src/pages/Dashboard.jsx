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
    { 
      name: 'In Stock', 
      value: inventoryTotals.filter((product) => product.status === 'in_stock').length, 
      color: '#10b981',
      icon: '✓'
    },
    { 
      name: 'Low Stock', 
      value: inventoryTotals.filter((product) => product.status === 'low_stock').length, 
      color: '#dc2626',
      icon: '⚠️'
    },
    { 
      name: 'Out of Stock', 
      value: inventoryTotals.filter((product) => product.status === 'out_of_stock').length, 
      color: '#991b1b',
      icon: '✖'
    },
  ];

  const totalProducts = stockStatusData.reduce((sum, item) => sum + item.value, 0);

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
          <div>
            <h3 className="card-title">Stock Status Distribution</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Overview of inventory health across {totalProducts} products
            </p>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '400px 1fr', 
          gap: '40px', 
          alignItems: 'start',
          padding: '20px 0'
        }}>
          {/* Pie Chart */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie 
                  data={stockStatusData} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  outerRadius={110}
                  innerRadius={70}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    fontSize: '14px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value, name) => [
                    `${value} products (${((value / totalProducts) * 100).toFixed(1)}%)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stockStatusData.map((item) => {
              const percentage = totalProducts > 0 ? ((item.value / totalProducts) * 100).toFixed(1) : 0;
              
              return (
                <div 
                  key={item.name}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: `2px solid ${item.color}`,
                    backgroundColor: `${item.color}15`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Icon */}
                    <div style={{
                      minWidth: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '700', 
                        color: '#111827',
                        marginBottom: '4px'
                      }}>
                        {item.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        marginBottom: '12px'
                      }}>
                        {item.name === 'In Stock' && 'Healthy inventory levels'}
                        {item.name === 'Low Stock' && 'Needs reordering soon'}
                        {item.name === 'Out of Stock' && 'Immediate action required'}
                      </div>
                      
                      {/* Count and Percentage */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ 
                          fontSize: '28px', 
                          fontWeight: '700', 
                          color: item.color,
                          lineHeight: 1
                        }}>
                          {item.value}
                        </span>
                        <span style={{ 
                          fontSize: '15px', 
                          fontWeight: '600', 
                          color: '#6b7280' 
                        }}>
                          ({percentage}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ 
                        height: '6px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                          borderRadius: '3px',
                          transition: 'width 0.5s ease-in-out'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '10px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              marginTop: '4px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px'
              }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Total Products: </span>
                  <span style={{ fontWeight: '700', color: '#111827' }}>{totalProducts}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Overall Health: </span>
                  {stockStatusData[0].value > totalProducts * 0.7 ? (
                    <span style={{ color: '#10b981', fontWeight: '700' }}>✓ Good</span>
                  ) : stockStatusData[1].value + stockStatusData[2].value > totalProducts * 0.5 ? (
                    <span style={{ color: '#dc2626', fontWeight: '700' }}>⚠ Critical</span>
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: '700' }}>⚠ Needs Attention</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
