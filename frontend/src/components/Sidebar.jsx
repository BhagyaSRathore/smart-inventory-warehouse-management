import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>📦 Smart Inventory</h2>
        <p>Warehouse Management</p>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📦</span>
          <span>Products</span>
        </NavLink>
        
        <NavLink to="/inventory" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📋</span>
          <span>Inventory</span>
        </NavLink>
        
        <NavLink to="/warehouses" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏭</span>
          <span>Warehouses</span>
        </NavLink>
        
        <NavLink to="/suppliers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🤝</span>
          <span>Suppliers</span>
        </NavLink>
        
        <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🛒</span>
          <span>Orders</span>
        </NavLink>
        
        <NavLink to="/stock-movements" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🔄</span>
          <span>Stock Movements</span>
        </NavLink>
        
        <div className="nav-divider"></div>
        
        <div className="nav-section-title">AI & Analytics</div>
        
        <NavLink to="/ai-assistant" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🤖</span>
          <span>AI Assistant</span>
        </NavLink>
        
        <NavLink to="/predictions" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📈</span>
          <span>Demand Predictions</span>
        </NavLink>
        
        <NavLink to="/restock" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🔔</span>
          <span>Restock Alerts</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <div className="demo-badge">
          <span>🎯</span>
          <span>Demo Mode</span>
        </div>
      </div>
    </aside>
  );
}
