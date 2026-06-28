import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';
import { CategoryBadge } from './Badge';
import { formatClinicalKey, formatValue, scoreColor } from '../utils/formatters';

function ScoreBar({ score }) {
  const color = scoreColor(score);
  return (
    <View style={styles.scoreBarBg}>
      <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
    </View>
  );
}

const BORDER_COLORS = {
  laboratory: colors.info, lab: colors.info,
  symptom: colors.warning, radiology: colors.purple,
  risk_factor: colors.neutral, family_history: colors.purple,
};

export function EvidenceCard({ ev }) {
  const score = Number(ev.confidenceScore) || 0;
  const borderColor = BORDER_COLORS[ev.category] || colors.border;

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.key}>{formatClinicalKey(ev.clinicalKey)}</Text>
          <Text style={styles.val}>{formatValue(ev.value, ev.unit)}</Text>
          <View style={styles.badges}>
            <CategoryBadge category={ev.category} />
            {ev.sourceId && (
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText}>📄 {ev.sourceId}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.scoreNum, { color: scoreColor(score) }]}>{score}</Text>
      </View>
      <ScoreBar score={score} />
    </View>
  );
}

export function ConflictCard({ c }) {
  const isHigh = c.severity === 'HIGH' || c.severity === 'high';
  return (
    <View style={[styles.card, { borderLeftColor: isHigh ? colors.critical : colors.warning }]}>
      <View style={[styles.row, { marginBottom: 6 }]}>
        <Text style={[styles.severityIcon, { color: isHigh ? colors.critical : colors.warning }]}>
          {isHigh ? '⚠️' : '⚡'}
        </Text>
        <Text style={[styles.conflictId, { color: colors.textFaint }]}>{c.conflictId || '—'}</Text>
      </View>
      <Text style={styles.desc}>{c.description?.replace(/\[([a-z0-9_]+)\]/gi, '') || 'Açıklama yok'}</Text>
    </View>
  );
}

export function FollowupCard({ f }) {
  const isOpen = f.status === 'OPEN';
  return (
    <View style={styles.followupCard}>
      <Text style={[styles.followupIcon, { color: isOpen ? colors.critical : colors.success }]}>
        {isOpen ? '🔴' : '✅'}
      </Text>
      <View style={styles.followupBody}>
        <Text style={styles.followupLabel}>{f.label || 'Takip görevi'}</Text>
        <Text style={styles.followupMsg}>{f.message || 'Açıklama yok'}</Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: isOpen ? colors.critical : colors.success }]} />
    </View>
  );
}

export function TimelineCard({ t, isLast }) {
  const dotColor = {
    blue: colors.info, yellow: colors.warning, red: colors.critical,
    green: colors.success, gray: colors.neutral,
  }[t.color] || colors.neutral;

  return (
    <View style={styles.tlItem}>
      <View style={styles.tlDotCol}>
        <View style={[styles.tlDot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={styles.tlLine} />}
      </View>
      <View style={styles.tlContent}>
        <View style={styles.tlMeta}>
          <Text style={styles.tlDate}>{t.date || '—'}</Text>
          {t.sourceId && <Text style={styles.tlSource}>{t.sourceId}</Text>}
        </View>
        <Text style={styles.tlKey}>{formatClinicalKey(t.clinicalKey)}</Text>
        <Text style={styles.tlVal}>{formatValue(t.value, t.unit)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  left: { flex: 1 },
  key: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  val: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  sourceBadge: {
    backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)',
  },
  sourceText: { fontSize: 10, color: colors.accent },
  scoreNum: { fontSize: 15, fontWeight: '700', minWidth: 28, textAlign: 'right' },
  scoreBarBg: { height: 3, backgroundColor: colors.border, borderRadius: radius.full, marginTop: 6, overflow: 'hidden' },
  scoreBarFill: { height: 3, borderRadius: radius.full },

  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  severityIcon: { fontSize: 14 },
  conflictId: { fontSize: 11, fontFamily: 'monospace', marginLeft: 'auto' },

  followupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface1, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  followupIcon: { fontSize: 15 },
  followupBody: { flex: 1 },
  followupLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  followupMsg: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: radius.full },

  tlItem: { flexDirection: 'row', gap: 10 },
  tlDotCol: { alignItems: 'center', width: 16 },
  tlDot: { width: 9, height: 9, borderRadius: radius.full, marginTop: 4 },
  tlLine: { width: 1, flex: 1, backgroundColor: colors.border, marginVertical: 3 },
  tlContent: { flex: 1, paddingBottom: 10 },
  tlMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  tlDate: { fontSize: 11, color: colors.textMuted },
  tlSource: { fontSize: 10, color: colors.textFaint, backgroundColor: colors.surface1, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.sm },
  tlKey: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary },
  tlVal: { fontSize: 12, color: colors.textSecondary },
});
