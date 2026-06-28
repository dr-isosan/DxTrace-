import { Microscope, FlaskConical } from 'lucide-react';
import { CategoryBadge, SourceBadge } from '../Badge/Badge';
import { formatClinicalKey, formatValue, scoreColor } from '../../utils/formatters';
import styles from './EvidencePanel.module.css';

function EvidenceItem({ ev }) {
  const score = Number(ev.confidenceScore) || 0;
  const color = scoreColor(score);

  return (
    <div className={`${styles.item} ${styles[ev.category] || ''}`}>
      <div className={styles.row}>
        <div className={styles.left}>
          <div className={styles.key}>
            {formatClinicalKey(ev.clinicalKey)}
            <SourceBadge sourceId={ev.sourceId} />
          </div>
          <div className={styles.val}>
            {formatValue(ev.value, ev.unit)}
            <CategoryBadge category={ev.category} />
          </div>
        </div>
        <div className={styles.scoreNum} style={{ color }}>
          {score}
        </div>
      </div>
      <div className={styles.scoreBar}>
        <div
          className={styles.scoreFill}
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function EvidencePanel({ evidence }) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className={styles.empty}>
        <FlaskConical size={28} />
        <p>Kanıt bulunamadı</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <div className={styles.sectionHeader}>
        <Microscope size={13} />
        {evidence.length} kanıt — Güven Skorları
      </div>
      {evidence.map(ev => (
        <EvidenceItem key={ev.evidenceId || ev.clinicalKey} ev={ev} />
      ))}
    </div>
  );
}
