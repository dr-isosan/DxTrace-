/**
 * SkeletonLoader.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Vaka değişiminde veya analiz sırasında gösterilen shimmer yükleme iskeletleri.
 * Gerçek içeriğin tam yerleşim planını taklit eder → ekran donmaz, profesyonel hissiyat.
 */
import styles from './SkeletonLoader.module.css';

/** Tek bir shimmer çubuğu */
function SkeletonBar({ width = '100%', height = '14px', style = {} }) {
  return (
    <div
      className={styles.skBar}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/** Tek bir shimmer kutu */
function SkeletonBlock({ height = '80px', style = {} }) {
  return (
    <div
      className={styles.skBlock}
      style={{ height, ...style }}
      aria-hidden="true"
    />
  );
}

/** Klinik Özet kartının iskeleti */
function ClinicalSummarySkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <SkeletonBar width="140px" height="12px" />
        <SkeletonBar width="70px" height="18px" style={{ borderRadius: '999px' }} />
      </div>
      <SkeletonBar width="100%" height="13px" style={{ marginTop: '14px' }} />
      <SkeletonBar width="90%" height="13px" style={{ marginTop: '8px' }} />
      <SkeletonBar width="75%" height="13px" style={{ marginTop: '8px' }} />
      <div className={styles.refs}>
        <SkeletonBar width="50px" height="22px" style={{ borderRadius: '999px' }} />
        <SkeletonBar width="50px" height="22px" style={{ borderRadius: '999px' }} />
        <SkeletonBar width="50px" height="22px" style={{ borderRadius: '999px' }} />
      </div>
    </div>
  );
}

/** Tab panelinin iskeleti */
function TabbedPanelSkeleton() {
  return (
    <div className={styles.card} style={{ marginTop: '0' }}>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        {[120, 100, 90, 80, 90].map((w, i) => (
          <SkeletonBar key={i} width={`${w}px`} height="32px" style={{ borderRadius: '8px' }} />
        ))}
      </div>
      {/* İçerik satırları */}
      <div className={styles.pane}>
        {[100, 85, 95, 70, 80].map((w, i) => (
          <div key={i} className={styles.evidenceRow}>
            <div className={styles.evidenceLeft}>
              <SkeletonBar width="60px" height="10px" />
              <SkeletonBar width={`${w}%`} height="12px" style={{ marginTop: '6px' }} />
            </div>
            <SkeletonBar width="48px" height="28px" style={{ borderRadius: '8px', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dashboard ana içerik alanının tam iskeleti */
export default function SkeletonDashboard() {
  return (
    <div className={styles.wrapper} role="status" aria-label="Yükleniyor...">
      <ClinicalSummarySkeleton />
      <TabbedPanelSkeleton />
    </div>
  );
}
