import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Warehouse,
  Users,
  ShoppingCart,
  ArrowRightLeft,
  Bot,
  TrendingUp,
  BellRing,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name || user?.username || user?.email || 'Administrator';
  const initials = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-logo">
          <div className="sidebar-logo-icon">📦</div>
          <div className="sidebar-logo-text">
            <h2>SmartInventory</h2>
            <p>Operations</p>
          </div>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><LayoutDashboard size={20} /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/products" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><Package size={20} /></span>
            <span>Products</span>
          </NavLink>

          <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><ClipboardList size={20} /></span>
            <span>Inventory</span>
          </NavLink>

          <NavLink to="/warehouses" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><Warehouse size={20} /></span>
            <span>Warehouses</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Operations</div>
          <NavLink to="/suppliers" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><Users size={20} /></span>
            <span>Suppliers</span>
          </NavLink>

          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><ShoppingCart size={20} /></span>
            <span>Orders</span>
          </NavLink>

          <NavLink to="/stock-movements" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><ArrowRightLeft size={20} /></span>
            <span>Stock Movements</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">AI & Analytics</div>
          <NavLink to="/ai-assistant" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><Bot size={20} /></span>
            <span>AI Assistant</span>
          </NavLink>

          <NavLink to="/predictions" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><TrendingUp size={20} /></span>
            <span>Demand Predictions</span>
          </NavLink>

          <NavLink to="/restock" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="nav-icon"><BellRing size={20} /></span>
            <span>Restock Alerts</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-menu">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user?.role || 'Administrator'}</div>
          </div>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
