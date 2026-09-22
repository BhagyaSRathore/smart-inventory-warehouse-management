import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading notifications…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load notifications.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">Review system alerts and workflow updates</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Inbox</h3>
          <button className="btn btn-secondary" type="button" onClick={handleMarkAllRead} disabled={!notifications.some((notification) => !notification.read)}>
            Mark all read
          </button>
        </div>

        <div className="notification-list-panel">
          {notifications.length ? notifications.map((notification) => (
            <div key={notification.id} className={`notification-panel-item ${notification.read ? 'read' : 'unread'}`}>
              <div className="notification-panel-header">
                <strong>{notification.title || notification.type || 'Notification'}</strong>
                {!notification.read && <span className="badge badge-warning">New</span>}
              </div>
              <p>{notification.message || 'No additional details provided.'}</p>
              <div className="notification-panel-footer">
                <span>{notification.type || 'System'}</span>
                <span>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Just now'}</span>
              </div>
              {!notification.read && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleMarkRead(notification.id)}>
                  Mark read
                </button>
              )}
            </div>
          )) : (
            <div className="empty-state">No notifications available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
