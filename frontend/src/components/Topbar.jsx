import './Topbar.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <input 
          type="search" 
          className="search-input" 
          placeholder="Search products, inventory..." 
        />
      </div>
      <div className="topbar-right">
        <button className="icon-button">
          <span>🔔</span>
        </button>
        <div className="user-profile">
          <div className="user-avatar">A</div>
          <span className="user-name">Admin User</span>
        </div>
      </div>
    </header>
  );
}
