import './StatusBadge.css';

export default function StatusBadge({ status, text }) {
  const getBadgeClass = () => {
    switch(status) {
      case 'in_stock': case 'active': case 'completed': return 'badge-success';
      case 'low_stock': case 'pending': case 'confirmed': return 'badge-warning';
      case 'out_of_stock': case 'inactive': case 'cancelled': return 'badge-danger';
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const displayText = text || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`status-badge ${getBadgeClass()}`}>
      {displayText}
    </span>
  );
}
