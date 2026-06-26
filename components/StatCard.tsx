import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  color?: 'purple' | 'cyan' | 'green' | 'orange';
  delay?: number;
}

export default function StatCard({
  label, value, icon, trend, trendUp, color = 'purple', delay = 0
}: StatCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[color]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.top}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{icon}</span>
        </div>
        {trend && (
          <span className={`${styles.trend} ${trendUp ? styles.up : styles.down}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
