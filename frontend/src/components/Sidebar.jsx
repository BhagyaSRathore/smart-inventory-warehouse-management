import { NavLink } from 'react-router-dom';
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
  BellRing
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            📦
          </div>
          <div className="sidebar-logo-text">
            <h2>SmartInventory</h2>
            <p>Pro Edition</p>
          </div>
        </NavLink>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><LayoutDashboard size={20} /></span>
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><Package size={20} /></span>
            <span>Products</span>
          </NavLink>
          
          <NavLink to="/inventory" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><ClipboardList size={20} /></span>
            <span>Inventory</span>
          </NavLink>
          
          <NavLink to="/warehouses" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><Warehouse size={20} /></span>
            <span>Warehouses</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Operations</div>
          <NavLink to="/suppliers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><Users size={20} /></span>
            <span>Suppliers</span>
          </NavLink>
          
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><ShoppingCart size={20} /></span>
            <span>Orders</span>
          </NavLink>
          
          <NavLink to="/stock-movements" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><ArrowRightLeft size={20} /></span>
            <span>Stock Movements</span>
          </NavLink>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">AI & Analytics</div>
          <NavLink to="/ai-assistant" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><Bot size={20} /></span>
            <span>AI Assistant</span>
          </NavLink>
          
          <NavLink to="/predictions" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><TrendingUp size={20} /></span>
            <span>Demand Predictions</span>
          </NavLink>
          
          <NavLink to="/restock" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon"><BellRing size={20} /></span>
            <span>Restock Alerts</span>
          </NavLink>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-menu">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Admin User</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
        <div className="demo-badge">
          <span>🎯</span>
          <span>Demo Mode</span>
        </div>
      </div>
    </aside>
  );
}
