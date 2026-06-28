import styles from './Badge.module.css';
import { CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS, formatReferenceLabel } from '../../utils/formatters';

const VARIANT_MAP = {
  success:  'success',
  error:    'error',
  critical: 'error',
  warning:  'warning',
  info:     'info',
  neutral:  'neutral',
  purple:   'purple',
  blue:     'info',
  green:    'success',
  red:      'error',
  yellow:   'warning',
  gray:     'neutral',
};

export function Badge({ children, variant = 'neutral', size = 'sm', icon, className = '' }) {
  const v = VARIANT_MAP[variant] || 'neutral';
  return (
    <span className={`${styles.badge} ${styles[v]} ${styles[size]} ${className}`}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}

export function CategoryBadge({ category }) {
  if (!category) return <Badge variant="neutral">Bilinmiyor</Badge>;
  const label = CATEGORY_LABELS[category] || category;
  const variantMap = {
    laboratory:     'info',
    lab:            'info',
    symptom:        'warning',
    radiology:      'error',
    risk_factor:    'neutral',
    family_history: 'purple',
  };
  return <Badge variant={variantMap[category] || 'neutral'}>{label}</Badge>;
}

export function SeverityBadge({ severity }) {
  if (!severity) return null;
  const label = SEVERITY_LABELS[severity] || severity;
  const v = severity === 'HIGH' || severity === 'high' ? 'error'
          : severity === 'MEDIUM' || severity === 'medium' ? 'warning'
          : 'neutral';
  return <Badge variant={v}>{label}</Badge>;
}

export function StatusBadge({ status }) {
  if (!status) return <Badge variant="neutral">Veri yok</Badge>;
  const label = STATUS_LABELS[status] || status;
  const v = ['OPEN', 'MISSING', 'REJECTED', 'REJECT', 'REJECTED_BY_VERIFIER'].includes(status) ? 'error'
          : ['CLOSED', 'VERIFIED', 'APPROVED'].includes(status) ? 'success'
          : ['STALE', 'PENDING', 'EDIT'].includes(status) ? 'warning'
          : 'neutral';
  return <Badge variant={v}>{label}</Badge>;
}

export function SourceBadge({ sourceId, onClick, className = '' }) {
  if (!sourceId) return null;
  const label = formatReferenceLabel(sourceId);
  const copyValue = typeof sourceId === 'string' ? sourceId : label;

  const handleClick = async () => {
    if (onClick) {
      onClick(sourceId);
      return;
    }
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(copyValue);
      } catch {
        // Ignore clipboard failures; the badge still remains visible and readable.
      }
    }
  };

  return (
    <button
      type="button"
      className={`${styles.badge} ${styles.source} ${className}`}
      onClick={handleClick}
      title={`Kaynağı kopyala: ${label}`}
    >
      <span className={styles.sourceIcon}>📄</span>
      <span>{label}</span>
    </button>
  );
}
