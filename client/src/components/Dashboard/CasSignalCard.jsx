import { AlertTriangle, ShieldAlert } from 'lucide-react';
import styles from './CasSignalCard.module.css';

export default function CasSignalCard({ signals }) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      {signals.map((s, i) => (
        <div key={i} className={styles.box}>
          <div className={styles.header}>
            <div className={styles.icon}><ShieldAlert size={18} /></div>
            <div>
              <div className={styles.id}>{s.signalId || 'Erken Uyarı Sinyali'}</div>
              <div className={styles.subtitle}>Erken Klinik Dikkat Sinyali</div>
            </div>
            <span className={styles.alertBadge}>
              <AlertTriangle size={11} /> AKTİF
            </span>
          </div>

          {s.metCriteria && s.metCriteria.length > 0 && (
            <div className={styles.criteria}>
              <span className={styles.criteriaLabel}>Karşılanan Kriterler</span>
              <div className={styles.criteriaList}>
                {s.metCriteria.map((c, ci) => (
                  <span key={ci} className={styles.criterion}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {s.message && (
            <p className={styles.message}>{s.message}</p>
          )}

          {s.disclaimer && (
            <p className={styles.disclaimer}>⚕ {s.disclaimer}</p>
          )}
        </div>
      ))}
    </div>
  );
}
