import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  PackageX, 
  ShoppingCart, 
  CheckCircle, 
  Info, 
  AlertCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, deleteNotification } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, inventory, order, system

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      setNotifications(response || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message || 'Unable to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message || 'Unable to mark notifications as read.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await deleteNotification(id);
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete notification.');
    }
  };

  // Get notification icon and color based on type and severity
  const getNotificationStyle = (notification) => {
    const type = notification.type?.toUpperCase() || 'SYSTEM';
    const severity = notification.severity?.toLowerCase() || 'info';

    // Inventory notifications
    if (type.includes('INVENTORY')) {
      if (severity === 'error' || notification.title?.toLowerCase().includes('out of stock')) {
        return {
          icon: PackageX,
          bgColor: '#fef2f2',
          borderColor: '#dc2626',
          iconColor: '#dc2626',
          label: 'Out of Stock',
          labelColor: '#991b1b',
        };
      }
      if (severity === 'warning' || notification.title?.toLowerCase().includes('low stock')) {
        return {
          icon: AlertTriangle,
          bgColor: '#fef2f2',
          borderColor: '#dc2626',
          iconColor: '#dc2626',
          label: 'Low Stock Alert',
          labelColor: '#991b1b',
        };
      }
      return {
        icon: Info,
        bgColor: '#eff6ff',
        borderColor: '#3b82f6',
        iconColor: '#3b82f6',
        label: 'Inventory Update',
        labelColor: '#1e40af',
      };
    }

    // Order notifications
    if (type.includes('ORDER')) {
      if (severity === 'success' || notification.title?.toLowerCase().includes('approved') || notification.title?.toLowerCase().includes('completed')) {
        return {
          icon: CheckCircle,
          bgColor: '#f0fdf4',
          borderColor: '#16a34a',
          iconColor: '#16a34a',
          label: 'Order Completed',
          labelColor: '#166534',
        };
      }
      if (notification.title?.toLowerCase().includes('pending') || notification.title?.toLowerCase().includes('created')) {
        return {
          icon: ShoppingCart,
          bgColor: '#f0f9ff',
          borderColor: '#0284c7',
          iconColor: '#0284c7',
          label: 'New Order',
          labelColor: '#075985',
        };
      }
      return {
        icon: ShoppingCart,
        bgColor: '#f0f9ff',
        borderColor: '#0284c7',
        iconColor: '#0284c7',
        label: 'Order Update',
        labelColor: '#075985',
      };
    }

    // System notifications
    if (severity === 'error') {
      return {
        icon: AlertCircle,
        bgColor: '#fef2f2',
        borderColor: '#dc2626',
        iconColor: '#dc2626',
        label: 'System Error',
        labelColor: '#991b1b',
      };
    }

    return {
      icon: Info,
      bgColor: '#f9fafb',
      borderColor: '#6b7280',
      iconColor: '#6b7280',
      label: 'System Notification',
      labelColor: '#374151',
    };
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'inventory' && !notif.type?.toUpperCase().includes('INVENTORY')) return false;
    if (filter === 'order' && !notif.type?.toUpperCase().includes('ORDER')) return false;
    if (filter === 'system' && !notif.type?.toUpperCase().includes('SYSTEM')) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading notifications…</div></div></div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-primary" type="button" onClick={handleMarkAllRead}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0',
        }}>
          {[
            { value: 'all', label: 'All', count: notifications.length },
            { value: 'unread', label: 'Unread', count: unreadCount },
            { value: 'inventory', label: '📦 Inventory', count: notifications.filter(n => n.type?.includes('INVENTORY')).length },
            { value: 'order', label: '🛒 Orders', count: notifications.filter(n => n.type?.includes('ORDER')).length },
            { value: 'system', label: '⚙️ System', count: notifications.filter(n => n.type?.includes('SYSTEM')).length },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: filter === tab.value ? '600' : '500',
                color: filter === tab.value ? '#3b82f6' : '#6b7280',
                borderBottom: filter === tab.value ? '3px solid #3b82f6' : '3px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s',
              }}
            >
              {tab.label} {tab.count > 0 && (
                <span style={{
                  marginLeft: '6px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: filter === tab.value ? '#dbeafe' : '#f3f4f6',
                  color: filter === tab.value ? '#1e40af' : '#6b7280',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: '#fef2f2',
          color: '#b91c1c',
          fontSize: '14px',
          border: '1px solid #fecaca',
        }}>
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotifications.length ? filteredNotifications.map((notification) => {
          const style = getNotificationStyle(notification);
          const Icon = style.icon;

          return (
            <div
              key={notification.id}
              style={{
                background: notification.read ? '#ffffff' : style.bgColor,
                border: `2px solid ${notification.read ? '#e5e7eb' : style.borderColor}`,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: notification.read ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s',
                position: 'relative',
                opacity: notification.read ? 0.75 : 1,
              }}
            >
              {/* Unread Indicator Dot */}
              {!notification.read && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: style.iconColor,
                  boxShadow: `0 0 0 3px ${style.bgColor}`,
                }}></div>
              )}

              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Icon */}
                <div style={{
                  minWidth: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: style.bgColor,
                  border: `2px solid ${style.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: style.iconColor,
                }}>
                  <Icon size={24} />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: style.bgColor,
                      color: style.labelColor,
                      border: `1px solid ${style.borderColor}`,
                    }}>
                      {style.label}
                    </span>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: '#9ca3af',
                      fontSize: '13px',
                    }}>
                      <Clock size={14} />
                      <span>{formatTimeAgo(notification.createdAt)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                  }}>
                    {notification.title || 'Notification'}
                  </h4>

                  {/* Message */}
                  <p style={{
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                  }}>
                    {notification.message || 'No additional details provided.'}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        style={{
                          padding: '6px 14px',
                          fontSize: '13px',
                          fontWeight: '500',
                          borderRadius: '6px',
                          border: `1px solid ${style.borderColor}`,
                          background: '#ffffff',
                          color: style.iconColor,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = style.bgColor;
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#ffffff';
                        }}
                      >
                        ✓ Mark as read
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => handleDelete(notification.id)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: '#ffffff',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#fef2f2';
                        e.target.style.color = '#dc2626';
                        e.target.style.borderColor = '#fecaca';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#ffffff';
                        e.target.style.color = '#6b7280';
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="card">
            <div className="empty-state">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div className="empty-state-title">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </div>
              <div className="empty-state-description">
                {filter === 'all' 
                  ? 'You\'ll see updates about inventory, orders, and system events here.' 
                  : `Try selecting a different filter to see other notifications.`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
