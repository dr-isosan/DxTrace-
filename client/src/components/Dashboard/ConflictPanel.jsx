import { AlertCircle, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { SeverityBadge } from '../Badge/Badge';
import { cleanReferenceLinks } from '../../utils/formatters';
import styles from './ConflictPanel.module.css';

function ConflictItem({ c }) {
  const isHigh = c.severity === 'high' || c.severity === 'HIGH';
  return (
    <div className={`${styles.item} ${isHigh ? styles.high : styles.medium}`}>
      <div className={styles.row}>
        <div className={styles.iconWrap}>
          {isHigh
            ? <AlertCircle size={15} className={styles.iconHigh} />
            : <AlertTriangle size={15} className={styles.iconMed} />
          }
        </div>
        <SeverityBadge severity={c.severity} />
        <span className={styles.id}>{c.conflictId || '—'}</span>
      </div>
      <p className={styles.desc}>
        {cleanReferenceLinks(c.description) || 'Açıklama yok'}
      </p>
    </div>
  );
}

export default function ConflictPanel({ conflicts }) {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div className={styles.empty}>
        <CheckCircle size={28} className={styles.emptyIcon} />
        <p>Çelişki tespit edilmedi</p>
        <span>Tüm kanıtlar tutarlı görünüyor</span>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <div className={styles.sectionHeader}>
        <Zap size={13} />
        {conflicts.length} çelişki tespit edildi
      </div>
      {conflicts.map((c, i) => <ConflictItem key={c.conflictId || i} c={c} />)}
    </div>
  );
}
