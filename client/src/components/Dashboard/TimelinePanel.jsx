import { Calendar } from 'lucide-react';
import { SourceBadge } from '../Badge/Badge';
import { formatClinicalKey, formatValue, formatDate } from '../../utils/formatters';
import styles from './TimelinePanel.module.css';

const DOT_COLOR_MAP = {
  blue:   'var(--color-info)',
  yellow: 'var(--color-warning)',
  red:    'var(--color-critical)',
  green:  'var(--color-success)',
  purple: 'var(--color-purple)',
  gray:   'var(--color-neutral)',
};

function TimelineItem({ t }) {
  const dotColor = DOT_COLOR_MAP[t.color] || DOT_COLOR_MAP.gray;

  return (
    <div className={styles.item}>
      <div className={styles.dotCol}>
        <div className={styles.dot} style={{ background: dotColor }} />
        <div className={styles.line} />
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.date}>{formatDate(t.date)}</span>
          {t.sourceId && <SourceBadge sourceId={t.sourceId} className={styles.source} />}
        </div>
        <div className={styles.event}>
          <span className={styles.clinicalKey}>{formatClinicalKey(t.clinicalKey)}</span>
          <span className={styles.value}>{formatValue(t.value, t.unit)}</span>
        </div>
      </div>
    </div>
  );
}

export default function TimelinePanel({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className={styles.empty}>
        <Calendar size={24} />
        <p>Zaman çizelgesi boş</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {timeline.map((t, i) => (
        <TimelineItem key={t.evidenceId || i} t={t} />
      ))}
    </div>
  );
}
