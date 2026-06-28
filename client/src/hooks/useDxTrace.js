import { useState, useCallback } from 'react';
import { analyzeCase } from '../api/dxtrace';

export function useDxTrace() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [moduleStatus, setModuleStatus] = useState({
    confidenceScorer: false,
    contradictionEngine: false,
    followupTracker: false,
    riskSignalEngine: false,
    verifierAgent: false,
    missingDataDetector: false,
  });

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
    setModuleStatus({
      confidenceScorer: false, contradictionEngine: false,
      followupTracker: false, riskSignalEngine: false,
      verifierAgent: false, missingDataDetector: false,
    });
  }, []);

  const analyze = useCallback(async (caseId = 'case_001') => {
    setLoading(true);
    clearData();
    try {
      const result = await analyzeCase(caseId);
      setData(result);
      setModuleStatus({
        confidenceScorer:    (result.evidence?.length || 0) > 0,
        contradictionEngine: result.conflicts != null,
        followupTracker:     result.followups != null,
        riskSignalEngine:    result.earlySignals != null,
        verifierAgent:       result.llmStatus != null,
        missingDataDetector: result.missingData != null,
      });
      return result;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Bağlantı hatası';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, error, moduleStatus, analyze, clearData };
}
