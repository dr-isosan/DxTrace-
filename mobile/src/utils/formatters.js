export const CATEGORY_LABELS = {
  laboratory:     'Laboratuvar',
  lab:            'Laboratuvar',
  symptom:        'Semptom',
  radiology:      'Radyoloji',
  risk_factor:    'Risk Faktörü',
  family_history: 'Aile Öyküsü',
};

export const SEVERITY_LABELS = {
  HIGH: 'Yüksek', high: 'Yüksek',
  MEDIUM: 'Orta', medium: 'Orta',
  LOW: 'Düşük', low: 'Düşük',
};

export const STATUS_LABELS = {
  OPEN: 'Açık', CLOSED: 'Kapalı',
  MISSING: 'Eksik', STALE: 'Bayat',
  VERIFIED: 'Doğrulandı', REJECTED_BY_VERIFIER: 'Reddedildi',
  APPROVED: 'Onaylandı', EDIT: 'Düzenlendi', REJECT: 'Reddedildi',
};

export function formatClinicalKey(key) {
  if (!key) return 'Bilinmiyor';
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatValue(value, unit) {
  if (value === null || value === undefined) return 'Veri yok';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return 'Veri yok'; }
  }
  const str = String(value).trim();
  if (!str) return 'Veri yok';
  return unit ? `${str} ${unit}` : str;
}

export function cleanReferenceLinks(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\[([a-z0-9_]+)\]/gi, '').replace(/\s{2,}/g, ' ').trim();
}

export function scoreColor(score) {
  const s = Number(score) || 0;
  if (s >= 65) return '#10b981';
  if (s >= 35) return '#f59e0b';
  return '#ef4444';
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Tarih yok';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}
