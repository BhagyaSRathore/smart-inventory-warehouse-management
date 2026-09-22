import { Bell, LogOut, Menu, Search, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from '../services/api';
import './Topbar.css';

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayName = user?.name || user?.username || user?.email || 'Administrator';
  const initials = displayName.charAt(0).toUpperCase();

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await getNotifications();
        setNotifications(response || []);
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
      const updated = await getNotifications();
      setNotifications(updated || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    const updated = await getNotifications();
    setNotifications(updated || []);
    if (notificationId) {
      navigate('/notifications');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-button" type="button">
          <Menu size={20} />
        </button>
        <div className="topbar-search">
          <span className="search-icon">
            <Search size={18} />
          </span>
          <input type="search" className="search-input" placeholder="Search products, inventory, orders..." />
        </div>
      </div>

      <div className="topbar-right">
        <div className="notification-dropdown-wrapper">
          <button className="icon-button" type="button" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && <span className="icon-button-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {menuOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <strong>Notifications</strong>
                <button type="button" className="link-button" onClick={handleMarkAllRead} disabled={loading || unreadCount === 0}>Mark all read</button>
              </div>
              <div className="notification-list">
                {notifications.length ? notifications.slice(0, 5).map((item) => (
                  <button key={item.id} type="button" className={`notification-item ${item.read ? 'read' : 'unread'}`} onClick={() => handleNotificationClick(item.id)}>
                    <div className="notification-title-row">
                      <span className="notification-type">{item.type}</span>
                      {!item.read && <span className="notification-dot" />}
                    </div>
                    <div className="notification-message">{item.title}</div>
                    <div className="notification-meta">{new Date(item.createdAt).toLocaleString()}</div>
                  </button>
                )) : (
                  <div className="notification-empty">No notifications</div>
                )}
              </div>
              <button type="button" className="notification-view-all" onClick={() => { setMenuOpen(false); navigate('/notifications'); }}>View all notifications</button>
            </div>
          )}
        </div>
        <button className="icon-button" type="button" onClick={() => navigate('/settings')} aria-label="Settings">
          <Settings size={20} />
        </button>
        <button className="icon-button" type="button" onClick={handleLogout} title="Logout" aria-label="Logout">
          <LogOut size={18} />
        </button>
        <div className="topbar-divider"></div>
        <button type="button" className="user-profile" onClick={() => navigate('/profile')}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user?.role || 'Administrator'}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
