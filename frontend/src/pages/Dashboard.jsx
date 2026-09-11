import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { getDashboardStats, getProducts, getRestockRecommendations } from '../services/api';

export default function Dashboard() {
  const stats = getDashboardStats();
  const products = getProducts();
  const restock = getRestockRecommendations();
  
  // Top selling products (demo data)
  const topProducts = products.slice(0, 5);
  
  // Critical restock items
  const criticalRestock = restock.filter(r => r.priority === 'critical');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time inventory overview and insights</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="primary"
        />
        <StatCard
          title="Total Stock Units"
          value={stats.totalStock.toLocaleString()}
          icon="📊"
          color="success"
        />
        <StatCard
          title="Low Stock Products"
          value={stats.lowStockProducts}
          icon="⚠️"
          color="warning"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockProducts}
          icon="🚨"
          color="danger"
        />
        <StatCard
          title="Pending Purchases"
          value={stats.pendingPurchases}
          icon="🛒"
          trend="up"
          trendValue="+2 from yesterday"
        />
        <StatCard
          title="Sales Today"
          value={`₹${stats.salesToday.toLocaleString()}`}
          icon="💰"
          trend="up"
          trendValue="+12.5% from yesterday"
          color="success"
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Sales Trend</h3>
          </div>
          <div className="chart-container">
            Chart: Sales over last 30 days
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏭 Inventory by Warehouse</h3>
          </div>
          <div className="chart-container">
            Chart: Stock distribution across warehouses
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔥 Top Selling Products</h3>
            <Link to="/products" className="link">View all</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <Link to={`/products/${product.id}`} className="link">
                      {product.name}
                    </Link>
                  </td>
                  <td>{product.currentStock}</td>
                  <td>₹{product.sellingPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🤖 AI Inventory Insights</h3>
          </div>
          <ul className="insights-list">
            <li className="insight-item">
              📊 {stats.lowStockProducts + stats.outOfStockProducts} products may reach reorder level within the next 7 days.
            </li>
            <li className="insight-item">
              🏭 Warehouse B (Delhi NCR) has the highest inventory value at ₹2.4M.
            </li>
            <li className="insight-item">
              📈 USB-C Cable 2m has unusually high demand this week (+45%).
            </li>
            <li className="insight-item">
              🚨 {criticalRestock.length} products require immediate restocking to avoid stockouts.
            </li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📊 Stock Status Distribution</h3>
        </div>
        <div className="chart-container">
          Chart: Pie chart showing In Stock, Low Stock, Out of Stock distribution
        </div>
      </div>
    </div>
  );
}
