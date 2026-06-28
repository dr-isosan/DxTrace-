import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../Badge/Badge';
import styles from './FollowupPanel.module.css';

function statusIcon(status) {
  if (status === 'OPEN') return <AlertCircle size={14} className={styles.iconOpen} />;
  if (status === 'CLOSED') return <CheckCircle size={14} className={styles.iconClosed} />;
  return <Clock size={14} className={styles.iconPending} />;
}

function FollowupItem({ f }) {
  return (
    <div className={styles.item}>
      <div className={styles.iconCol}>
        {statusIcon(f.status)}
      </div>
      <div className={styles.body}>
        <div className={styles.label}>{f.label || 'Takip görevi'}</div>
        <div className={styles.message}>{f.message || 'Açıklama yok'}</div>
      </div>
      <StatusBadge status={f.status} />
    </div>
  );
}

export default function FollowupPanel({ followups }) {
  if (!followups || followups.length === 0) {
    return (
      <div className={styles.empty}>
        <CheckCircle size={28} className={styles.emptyIcon} />
        <p>Açık döngü yok</p>
        <span>Tüm takip görevleri tamamlandı</span>
      </div>
    );
  }

  const open = followups.filter(f => f.status === 'OPEN').length;

  return (
    <div className={styles.list}>
      <div className={styles.sectionHeader}>
        <RefreshCw size={13} />
        {followups.length} görev
        {open > 0 && <span className={styles.openCount}>{open} açık</span>}
      </div>
      {followups.map((f, i) => (
        <FollowupItem key={f.followupId || i} f={f} />
      ))}
    </div>
  );
}
