import { CheckCircle, ShieldCheck } from 'lucide-react';
import { cleanReferenceLinks, extractReferences } from '../../utils/formatters';
import { SourceBadge } from '../Badge/Badge';
import styles from './ClinicalSummary.module.css';

export default function ClinicalSummary({ summary, llmStatus }) {
  if (!summary) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}><ShieldCheck size={15} /> Klinik Özet</div>
        </div>
        <p className={styles.empty}>Henüz özet oluşturulmadı.</p>
      </div>
    );
  }

  const cleaned = cleanReferenceLinks(summary);
  const refs = Array.from(new Set(extractReferences(summary)));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <ShieldCheck size={15} />
          Klinik Özet
        </div>
        {llmStatus === 'VERIFIED' ? (
          <span className={styles.verifiedBadge}>
            <CheckCircle size={11} /> Doğrulandı
          </span>
        ) : llmStatus ? (
          <span className={styles.rejectedBadge}>Reddedildi</span>
        ) : null}
      </div>
      <p className={styles.text}>{cleaned || 'Veri yok'}</p>
      {refs.length > 0 && (
        <div className={styles.refs}>
          <span className={styles.refsLabel}>Kaynaklar:</span>
          {refs.map(r => <SourceBadge key={r} sourceId={r} />)}
        </div>
      )}
    </div>
  );
}
