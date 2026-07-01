import { useEffect, useState, useCallback } from 'react';
import { Hospital, Cpu, FlaskConical, ShieldCheck, Zap } from 'lucide-react';
import { useDxTrace } from '../hooks/useDxTrace';
import { useToast } from '../components/Toast/ToastProvider';
import { getHealth } from '../api/dxtrace';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import ClinicalSummary from '../components/Dashboard/ClinicalSummary';
import CasSignalCard from '../components/Dashboard/CasSignalCard';
import TabbedPanel from '../components/Dashboard/TabbedPanel';
import SkeletonDashboard from '../components/Dashboard/SkeletonLoader';
import styles from './Dashboard.module.css';

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Hospital size={40} />
      </div>
      <h2 className={styles.emptyTitle}>DxTrace Dashboard</h2>
      <p className={styles.emptyDesc}>
        Sol panelden <strong>"Vakayı Analiz Et"</strong> butonuna basarak<br />
        tüm klinik motorları çalıştırın.
      </p>
      <div className={styles.featureBadges}>
        <span className={styles.fb}><Cpu size={12} /> Confidence Scorer</span>
        <span className={styles.fb}><Zap size={12} /> Contradiction Engine</span>
        <span className={styles.fb}><FlaskConical size={12} /> Followup Tracker</span>
        <span className={styles.fb}><ShieldCheck size={12} /> Risk Signal Engine</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { loading, data, moduleStatus, analyze, clearData } = useDxTrace();
  const { addToast } = useToast();
  const [apiOnline, setApiOnline] = useState(false);
  const [selectedCase, setSelectedCase] = useState('case_001');
  // Vaka geçişi sırasında kısa bir skeleton penceresi açar
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    getHealth()
      .then(() => setApiOnline(true))
      .catch(() => {
        setApiOnline(false);
        addToast({
          type: 'error',
          title: 'API Bağlantısı Yok',
          message: 'Backend sunucusu çalışmıyor olabilir. npm run dev çalıştırın.',
          duration: 8000,
        });
      });
  }, []);

  const handleCaseChange = useCallback((newCaseId) => {
    setSwitching(true);
    setSelectedCase(newCaseId);
    clearData();
    // Geçiş animasyonu için kısa gecikme — çok hızlı geçişi engeller
    setTimeout(() => setSwitching(false), 800);
  }, [clearData]);

  const handleAnalyze = async (caseId) => {
    const targetCase = caseId || selectedCase;
    try {
      await analyze(targetCase);
      addToast({
        type: 'success',
        title: 'Analiz Tamamlandı',
        message: 'Tüm klinik motorlar başarıyla çalıştırıldı.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Analiz Hatası',
        message: err.message,
        duration: 6000,
      });
    }
  };

  return (
    <div className={styles.root}>
      <Header apiOnline={apiOnline} />
      <div className={styles.container}>
        <div className={styles.layout}>
          <Sidebar
            onAnalyze={() => handleAnalyze(selectedCase)}
            loading={loading}
            moduleStatus={moduleStatus}
            analysisData={data}
            selectedCase={selectedCase}
            onCaseChange={handleCaseChange}
          />

          <main className={styles.main}>
            {(loading || switching) ? (
              <SkeletonDashboard />
            ) : !data ? (
              <EmptyState />
            ) : (
              <div className={styles.results}>
                <ClinicalSummary
                  summary={data.clinicalSummary}
                  llmStatus={data.llmStatus}
                />
                {data.earlySignals?.length > 0 && (
                  <CasSignalCard signals={data.earlySignals} />
                )}
                <TabbedPanel data={data} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
