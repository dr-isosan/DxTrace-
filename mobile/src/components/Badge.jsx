import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '../utils/formatters';

const VARIANT_STYLES = {
  success: { bg: colors.successBg, border: colors.successBorder, text: colors.success },
  error:   { bg: colors.criticalBg, border: colors.criticalBorder, text: colors.critical },
  warning: { bg: colors.warningBg, border: colors.warningBorder, text: colors.warning },
  info:    { bg: colors.infoBg, border: colors.infoBorder, text: colors.info },
  neutral: { bg: colors.neutralBg, border: colors.neutralBorder, text: colors.textMuted },
  purple:  { bg: colors.purpleBg, border: colors.purpleBorder, text: colors.purple },
};

export function Badge({ children, variant = 'neutral' }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{children}</Text>
    </View>
  );
}

export function CategoryBadge({ category }) {
  const label = CATEGORY_LABELS[category] || category || 'Bilinmiyor';
  const variantMap = {
    laboratory: 'info', lab: 'info',
    symptom: 'warning', radiology: 'purple',
    risk_factor: 'neutral', family_history: 'purple',
  };
  return <Badge variant={variantMap[category] || 'neutral'}>{label}</Badge>;
}

export function SeverityBadge({ severity }) {
  if (!severity) return null;
  const label = SEVERITY_LABELS[severity] || severity;
  const v = severity === 'HIGH' || severity === 'high' ? 'error'
          : severity === 'MEDIUM' || severity === 'medium' ? 'warning' : 'neutral';
  return <Badge variant={v}>{label}</Badge>;
}

export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status || '—';
  const v = ['OPEN', 'MISSING', 'REJECTED', 'REJECT', 'REJECTED_BY_VERIFIER'].includes(status) ? 'error'
          : ['CLOSED', 'VERIFIED', 'APPROVED'].includes(status) ? 'success'
          : ['STALE', 'PENDING', 'EDIT'].includes(status) ? 'warning' : 'neutral';
  return <Badge variant={v}>{label}</Badge>;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
