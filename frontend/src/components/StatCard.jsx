import './StatCard.css';

export default function StatCard({ title, value, icon, trend, trendValue, color = 'primary' }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-body">
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value}</h3>
          {trend && trendValue && (
            <p className={`stat-trend ${trend}`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              {trendValue}
            </p>
          )}
        </div>
        <div className="stat-icon">
          <span>{icon}</span>
        </div>
      </div>
    </div>
  );
}
