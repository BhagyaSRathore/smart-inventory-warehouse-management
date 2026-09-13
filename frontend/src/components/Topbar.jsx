import { Search, Bell, Settings, Menu } from 'lucide-react';
import './Topbar.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-button">
          <Menu size={20} />
        </button>
        <div className="topbar-search">
          <span className="search-icon">
            <Search size={18} />
          </span>
          <input 
            type="search" 
            className="search-input" 
            placeholder="Search products, inventory, orders..." 
          />
        </div>
      </div>
      
      <div className="topbar-right">
        <button className="icon-button">
          <Bell size={20} />
          <span className="icon-button-badge"></span>
        </button>
        <button className="icon-button">
          <Settings size={20} />
        </button>
        <div className="topbar-divider"></div>
        <div className="user-profile">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Admin User</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
