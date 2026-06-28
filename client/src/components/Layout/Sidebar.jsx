import { useState } from 'react';
import {
  Zap, Cpu, UserCheck, Bot, CheckCircle, Clock, XCircle, Minus,
} from 'lucide-react';
import { useToast } from '../Toast/ToastProvider';
import { generateLLM, submitFeedback } from '../../api/dxtrace';
import styles from './Sidebar.module.css';

const MODULE_ICONS = {
  confidenceScorer:    <Cpu size={13} />,
  contradictionEngine: <Zap size={13} />,
  followupTracker:     <Clock size={13} />,
  riskSignalEngine:    <Zap size={13} />,
  verifierAgent:       <CheckCircle size={13} />,
  missingDataDetector: <Minus size={13} />,
};

function ModuleRow({ name, active }) {
  return (
    <div className={styles.moduleRow}>
      <span className={styles.moduleName}>
        {MODULE_ICONS[name] || <Cpu size={13} />}
        {name}
      </span>
      {active ? (
        <span className={`${styles.badge} ${styles.badgeGreen}`}>
          <CheckCircle size={10} /> Aktif
        </span>
      ) : (
        <span className={`${styles.badge} ${styles.badgeGray}`}>
          <Clock size={10} /> Bekliyor
        </span>
      )}
    </div>
  );
}

export default function Sidebar({ onAnalyze, loading, moduleStatus, analysisData, selectedCase, onCaseChange }) {
  const { addToast } = useToast();
  const [prevContent, setPrevContent] = useState('AI ürettiği klinik özet metni');
  const [finalContent, setFinalContent] = useState('Doktorun onayladığı metin');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmData, setLlmData] = useState(null);

  const handleFeedback = async (action) => {
    setFeedbackLoading(true);
    try {
      const result = await submitFeedback({
        componentId: 'cas_gi_01_output',
        action,
        doctorId: 'doc_889',
        previousContent: prevContent,
        finalContent,
      });
      const actionLabel = { APPROVE: 'Onaylandı', EDIT: 'Düzenleme kaydedildi', REJECT: 'Reddedildi' }[action];
      addToast({
        type: action === 'APPROVE' ? 'success' : action === 'EDIT' ? 'warning' : 'error',
        title: actionLabel,
        message: `Log ID: ${result.logId}`,
        duration: 5000,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Hata', message: err.response?.data?.error || 'Geri bildirim gönderilemedi.' });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleLLM = async () => {
    setLlmLoading(true);
    setLlmData(null);
    try {
      const data = await generateLLM();
      setLlmData(data);
      addToast({
        type: data.passed ? 'success' : 'warning',
        title: data.passed ? 'Özet Doğrulandı' : 'Özet Reddedildi',
        message: data.passed
          ? 'Verifier Agent geçti — halüsinasyon tespit edilmedi.'
          : `${data.violations?.length || 0} ihlal tespit edildi.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'LLM Hatası', message: err.message });
    } finally {
      setLlmLoading(false);
    }
  };

  const modules = [
    'confidenceScorer', 'contradictionEngine', 'followupTracker',
    'riskSignalEngine', 'verifierAgent', 'missingDataDetector',
  ];

  return (
    <aside className={styles.sidebar}>
      {/* Analiz Kartı */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <Zap size={14} />
          Vaka Analizi
        </div>
        <div style={{ marginBottom: '10px' }}>
          <select 
            value={selectedCase} 
            onChange={(e) => onCaseChange(e.target.value)}
            className={styles.select}
            disabled={loading}
          >
            <option value="case_001">Vaka 001 - GI / Epigastrik Ağrı</option>
            <option value="case_002">Vaka 002 - Kardiyoloji (Mock)</option>
            <option value="case_003">Vaka 003 - Göğüs (Mock)</option>
          </select>
        </div>
        <p className={styles.hint}>
          Seçili vaka üzerinden tüm klinik motorlar çalıştırılır.
        </p>
        <button
          className={`${styles.btnPrimary} ${loading ? styles.loading : ''}`}
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading ? (
            <><span className={styles.spinner} /> Analiz ediliyor...</>
          ) : (
            <><Zap size={15} /> {analysisData ? 'Tekrar Analiz Et' : 'Vakayı Analiz Et'}</>
          )}
        </button>
      </div>

      {/* Modül Durumları */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <Cpu size={14} />
          Aktif Modüller
        </div>
        <div className={styles.moduleList}>
          {modules.map(m => (
            <ModuleRow key={m} name={m} active={moduleStatus[m]} />
          ))}
        </div>
      </div>

      {/* Doktor Geri Bildirimi */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <UserCheck size={14} />
          Doktor Geri Bildirimi
        </div>
        <label className={styles.label}>AI çıktısı</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={prevContent}
          onChange={e => setPrevContent(e.target.value)}
        />
        <label className={styles.label}>Doktor düzenlemesi</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={finalContent}
          onChange={e => setFinalContent(e.target.value)}
        />
        <div className={styles.feedbackActions}>
          <button
            className={`${styles.btnFeedback} ${styles.approve}`}
            onClick={() => handleFeedback('APPROVE')}
            disabled={feedbackLoading}
          >
            <CheckCircle size={13} /> Onayla
          </button>
          <button
            className={`${styles.btnFeedback} ${styles.edit}`}
            onClick={() => handleFeedback('EDIT')}
            disabled={feedbackLoading}
          >
            ✏ Düzenle
          </button>
          <button
            className={`${styles.btnFeedback} ${styles.reject}`}
            onClick={() => handleFeedback('REJECT')}
            disabled={feedbackLoading}
          >
            <XCircle size={13} /> Reddet
          </button>
        </div>
      </div>

      {/* LLM */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <Bot size={14} />
          LLM Özet Üret
        </div>
        <p className={styles.hint}>Verifier Agent ile halüsinasyon korumalı</p>
        <button
          className={`${styles.btnPrimary} ${styles.purple} ${llmLoading ? styles.loading : ''}`}
          onClick={handleLLM}
          disabled={llmLoading}
        >
          {llmLoading ? (
            <><span className={styles.spinner} /> Üretiliyor...</>
          ) : (
            <><Bot size={15} /> {llmData ? 'Tekrar Üret' : 'Özet Üret'}</>
          )}
        </button>
        {llmData && (
          <div className={`${styles.llmResult} ${llmData.passed ? styles.llmPassed : styles.llmFailed}`}>
            <div className={styles.llmStatus}>
              {llmData.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {llmData.passed ? 'Doğrulandı' : 'Reddedildi'}
              {llmData.violations?.length > 0 && (
                <span className={styles.violationBadge}>{llmData.violations.length} ihlal</span>
              )}
            </div>
            {llmData.clinicalSummary && (
              <p className={styles.llmText}>{llmData.clinicalSummary}</p>
            )}
            {!llmData.passed && (
              <p className={styles.llmTextMuted}>Çıktı halüsinasyon nedeniyle reddedildi.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
