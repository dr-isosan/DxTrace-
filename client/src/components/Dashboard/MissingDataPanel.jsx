import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { StatusBadge } from '../Badge/Badge';
import styles from './MissingDataPanel.module.css';

function MissingItem({ m }) {
  const isMissing = m.status === 'MISSING';
  const isStale = m.status === 'STALE';
  return (
    <div className={styles.item}>
      {isMissing
        ? <AlertTriangle size={14} className={styles.iconMissing} />
        : isStale
        ? <Clock size={14} className={styles.iconStale} />
        : <CheckCircle size={14} className={styles.iconOk} />
      }
      <span className={styles.label}>{m.label || 'Bilinmiyor'}</span>
      <StatusBadge status={m.status} />
    </div>
  );
}

export default function MissingDataPanel({ missingData }) {
  if (!missingData || missingData.length === 0) {
    return (
      <div className={styles.empty}>
        <CheckCircle size={28} className={styles.emptyIcon} />
        <p>Eksik veri yok</p>
        <span>Tüm klinik parametreler mevcut</span>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {missingData.map((m, i) => (
        <MissingItem key={m.dataKey || i} m={m} />
      ))}
    </div>
  );
}
