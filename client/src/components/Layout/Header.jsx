import { Activity } from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ apiOnline }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <span>🔬</span>
          </div>
          <div>
            <div className={styles.logoText}>DxTrace</div>
            <div className={styles.tagline}>Kanıta Kilitli Klinik Karar Destek</div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={`${styles.statusPill} ${apiOnline ? styles.online : styles.offline}`}>
            <span className={styles.dot} />
            {apiOnline ? 'API Aktif' : 'API Bağlanamıyor'}
          </div>
          <div className={styles.version}>
            <Activity size={12} />
            v1.0.0
          </div>
        </div>
      </div>
    </header>
  );
}
