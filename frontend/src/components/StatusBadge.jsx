import './StatusBadge.css';

export default function StatusBadge({ status, text, showDot = true }) {
  const getBadgeClass = () => {
    switch(status?.toLowerCase()) {
      case 'in_stock':
      case 'active':
      case 'completed':
      case 'low':
        return 'badge-success';
      case 'low_stock':
      case 'pending':
      case 'confirmed':
      case 'medium':
      case 'increasing':
      case 'stable':
        return 'badge-warning';
      case 'out_of_stock':
      case 'inactive':
      case 'cancelled':
      case 'critical':
      case 'high':
        return 'badge-danger';
      case 'info':
      case 'processing':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const displayText = text || status?.replace(/_/g, ' ');

  return (
    <span className={`status-badge ${getBadgeClass()}`}>
      {showDot && <span className="status-dot"></span>}
      <span>{displayText}</span>
    </span>
  );
}
