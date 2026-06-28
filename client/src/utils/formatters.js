/* Category label mapping */
export const CATEGORY_LABELS = {
  laboratory: "Laboratuvar",
  lab: "Laboratuvar",
  symptom: "Semptom",
  radiology: "Radyoloji",
  risk_factor: "Risk Faktörü",
  family_history: "Aile Öyküsü",
};

/* Severity label mapping */
export const SEVERITY_LABELS = {
  HIGH: "Yüksek",
  MEDIUM: "Orta",
  LOW: "Düşük",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
  CRITICAL: "Kritik",
};

/* Status label mapping */
export const STATUS_LABELS = {
  OPEN: "Açık",
  CLOSED: "Kapalı",
  PENDING: "Bekliyor",
  MISSING: "Eksik",
  STALE: "Bayat",
  VERIFIED: "Doğrulandı",
  REJECTED: "Reddedildi",
  APPROVED: "Onaylandı",
  EDIT: "Düzenlendi",
  REJECT: "Reddedildi",
};

/**
 * Removes raw document reference links like [doc_A], [lab_001], etc.
 * and formats them as inline readable tokens.
 * @param {string} text
 * @returns {string}
 */
export function cleanReferenceLinks(text) {
  if (!text || typeof text !== "string") return "";
  // Remove bracket-style references [doc_A], [lab_001], [rad_001]
  return text
    .replace(/\[([a-z0-9_]+)\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract all doc references from a text
 * @param {string} text
 * @returns {string[]}
 */
export function extractReferences(text) {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(/\[([a-z0-9_]+)\]/gi) || [];
  return matches.map((m) => m.slice(1, -1));
}

/**
 * Format clinical key: snake_case → Title Case
 * @param {string} key
 * @returns {string}
 */
export function formatClinicalKey(key) {
  if (!key || typeof key !== "string") return "Bilinmiyor";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format reference ids like doc_A or lab_001 into readable labels.
 * @param {*} ref
 * @returns {string}
 */
export function formatReferenceLabel(ref) {
  if (ref === null || ref === undefined) return "Kaynak yok";
  if (typeof ref === "string") {
    const cleaned = ref.replace(/\[|\]/g, "").trim();
    if (!cleaned) return "Kaynak yok";
    return cleaned
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (typeof ref === "object") {
    if (typeof ref.label === "string" && ref.label.trim())
      return ref.label.trim();
    if (typeof ref.name === "string" && ref.name.trim()) return ref.name.trim();
    if (typeof ref.id === "string" && ref.id.trim())
      return formatReferenceLabel(ref.id);
  }
  return formatValue(ref);
}

/**
 * Format a value safely — handles objects and undefined
 * @param {*} value
 * @param {string} unit
 * @returns {string}
 */
export function formatValue(value, unit) {
  if (value === null || value === undefined) return "Veri yok";
  if (Array.isArray(value)) {
    if (value.length === 0) return "Veri yok";
    return value.map((item) => formatValue(item)).join(", ");
  }
  if (typeof value === "object") {
    if (typeof value.label === "string" && value.label.trim())
      return value.label.trim();
    if (typeof value.name === "string" && value.name.trim())
      return value.name.trim();
    if (typeof value.value !== "undefined")
      return formatValue(value.value, unit);
    try {
      return JSON.stringify(value);
    } catch {
      return "Veri yok";
    }
  }
  const str = String(value).trim();
  if (!str) return "Veri yok";
  return unit ? `${str} ${unit}` : str;
}

/**
 * Returns score color token based on numeric score
 */
export function scoreColor(score) {
  const s = Number(score) || 0;
  if (s >= 65) return "var(--color-success)";
  if (s >= 35) return "var(--color-warning)";
  return "var(--color-critical)";
}

/**
 * Format a date string more readably
 */
export function formatDate(dateStr) {
  if (!dateStr) return "Tarih yok";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
