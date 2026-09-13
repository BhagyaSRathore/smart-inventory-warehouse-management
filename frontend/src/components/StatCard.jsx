import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './StatCard.css';

export default function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary', period }) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} />;
    if (trend === 'down') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <div>
          <div className="stat-card-title">{title}</div>
          <div className="stat-card-value">{value}</div>
        </div>
        <div className="stat-card-icon">
          {Icon && <Icon size={24} />}
        </div>
      </div>
      {(trend || period) && (
        <div className="stat-card-footer">
          {trend && trendValue && (
            <span className={`stat-card-trend ${trend}`}>
              {getTrendIcon()}
              {trendValue}
            </span>
          )}
          {period && (
            <span className="stat-card-period">{period}</span>
          )}
        </div>
      )}
    </div>
  );
}
