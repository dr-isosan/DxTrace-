import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { analyzeCase } from '../api/dxtrace';
import { colors, spacing, radius } from '../theme/tokens';
import { cleanReferenceLinks } from '../utils/formatters';
import { StatusBadge } from '../components/Badge';
import { EvidenceCard, ConflictCard, FollowupCard, TimelineCard } from '../components/ClinicalCards';
import SkeletonDashboard from '../components/SkeletonLoader';

// ─── CAS Signal Alert ───────────────────────────────────────────
function CasAlert({ signals }) {
  if (!signals?.length) return null;
  const s = signals[0];
  return (
    <View style={styles.casBox}>
      <View style={styles.casHeader}>
        <Text style={styles.casIcon}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.casId}>{s.signalId || 'Erken Uyarı'}</Text>
          <Text style={styles.casSubtitle}>Erken Klinik Dikkat Sinyali</Text>
        </View>
        <View style={styles.casActiveBadge}>
          <Text style={styles.casActiveTxt}>AKTİF</Text>
        </View>
      </View>
      {s.metCriteria?.length > 0 && (
        <View style={styles.criteriaWrap}>
          {s.metCriteria.map((c, i) => (
            <View key={i} style={styles.criterion}>
              <Text style={styles.criterionTxt}>{c}</Text>
            </View>
          ))}
        </View>
      )}
      {s.message && <Text style={styles.casMsg}>{s.message}</Text>}
      {s.disclaimer && <Text style={styles.casDisclaimer}>⚕ {s.disclaimer}</Text>}
    </View>
  );
}

// ─── Tabbed Panel ───────────────────────────────────────────────
const TABS = ['Kanıtlar', 'Çelişkiler', 'Takip', 'Eksik', 'Zaman'];

function TabbedSection({ data }) {
  const [active, setActive] = useState(0);

  const counts = [
    data?.evidence?.length,
    data?.conflicts?.length,
    data?.followups?.length,
    data?.missingData?.length,
    data?.timeline?.length,
  ];

  const renderContent = () => {
    if (active === 0) {
      if (!data?.evidence?.length)
        return <Text style={styles.empty}>Kanıt bulunamadı</Text>;
      return data.evidence.map((ev, i) => <EvidenceCard key={ev.evidenceId || i} ev={ev} />);
    }
    if (active === 1) {
      if (!data?.conflicts?.length)
        return <Text style={styles.empty}>✅ Çelişki tespit edilmedi</Text>;
      return data.conflicts.map((c, i) => <ConflictCard key={c.conflictId || i} c={c} />);
    }
    if (active === 2) {
      if (!data?.followups?.length)
        return <Text style={styles.empty}>✅ Açık döngü yok</Text>;
      return data.followups.map((f, i) => <FollowupCard key={f.followupId || i} f={f} />);
    }
    if (active === 3) {
      if (!data?.missingData?.length)
        return <Text style={styles.empty}>✅ Eksik veri yok</Text>;
      return data.missingData.map((m, i) => (
        <View key={i} style={styles.missingItem}>
          <Text style={styles.missingLabel}>{m.label || 'Bilinmiyor'}</Text>
          <StatusBadge status={m.status} />
        </View>
      ));
    }
    if (active === 4) {
      if (!data?.timeline?.length)
        return <Text style={styles.empty}>Zaman çizelgesi boş</Text>;
      return data.timeline.map((t, i) => (
        <TimelineCard key={t.evidenceId || i} t={t} isLast={i === data.timeline.length - 1} />
      ));
    }
    return null;
  };

  return (
    <View style={styles.tabCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, active === i && styles.tabActive]}
            onPress={() => setActive(i)}
          >
            <Text style={[styles.tabText, active === i && styles.tabTextActive]}>{tab}</Text>
            {counts[i] > 0 && (
              <View style={[styles.tabCount, (i === 1 || i === 3) && counts[i] > 0 && styles.tabCountWarn]}>
                <Text style={styles.tabCountTxt}>{counts[i]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.pane}>{renderContent()}</View>
    </View>
  );
}

// ─── Main Dashboard Screen ──────────────────────────────────────
export default function DashboardScreen() {
  const [selectedCase, setSelectedCase] = useState('case_001');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const runAnalysis = useCallback(async (isRefresh = false, caseIdOverride = null) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const targetCase = caseIdOverride || selectedCase;
      const result = await analyzeCase(targetCase);
      setData(result);
      Toast.show({
        type: 'success',
        text1: 'Analiz Tamamlandı',
        text2: `${result.evidence?.length || 0} kanıt işlendi`,
        visibilityTime: 3500,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Bağlantı Hatası',
        text2: 'Sunucuya ulaşılamadı. IP adresini kontrol edin.',
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCase]);

  const handleCaseChange = useCallback((newCase) => {
    if (newCase === selectedCase) return;
    setSwitching(true);
    setSelectedCase(newCase);
    setData(null);
    setTimeout(() => setSwitching(false), 400);
  }, [selectedCase]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🔬</Text>
        </View>
        <View>
          <Text style={styles.logoText}>DxTrace</Text>
          <Text style={styles.tagline}>Klinik Karar Destek</Text>
        </View>
        {data && (
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineTxt}>Analiz Tamamlandı</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => runAnalysis(true)}
            tintColor={colors.info}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Case Selector */}
        <View style={styles.caseSelector}>
          <Text style={styles.sectionTitle}>VAKA SEÇİMİ</Text>
          <View style={styles.segmentedControl}>
            {[
              { id: 'case_001', label: 'Vaka 001' },
              { id: 'case_002', label: 'Vaka 002' },
              { id: 'case_003', label: 'Vaka 003' },
            ].map((c) => {
              const isActive = selectedCase === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                  onPress={() => handleCaseChange(c.id)}
                  disabled={loading}
                >
                  <Text style={[styles.segmentTxt, isActive && styles.segmentTxtActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={() => runAnalysis()}
          disabled={loading}
        >
          {loading ? (
            <><ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.analyzeTxt}>Analiz ediliyor...</Text></>
          ) : (
            <Text style={styles.analyzeTxt}>
              ⚡ {data ? 'Tekrar Analiz Et' : 'Vakayı Analiz Et'}
            </Text>
          )}
        </TouchableOpacity>

        {(loading || switching) ? (
          <View style={{ marginTop: 12 }}>
            <SkeletonDashboard />
          </View>
        ) : !data ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>🏥</Text>
            </View>
            <Text style={styles.emptyTitle}>DxTrace Dashboard</Text>
            <Text style={styles.emptyDesc}>
              Yukarıdan vakayı seçip {"\n"} "Vakayı Analiz Et" butonuna basarak{'\n'}tüm klinik motorları çalıştırın.
            </Text>
          </View>
        ) : (
          <>
            {/* Clinical Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.sectionTitle}>📋 Klinik Özet</Text>
                <StatusBadge status={data.llmStatus === 'VERIFIED' ? 'VERIFIED' : 'REJECTED'} />
              </View>
              <Text style={styles.summaryText}>
                {cleanReferenceLinks(data.clinicalSummary) || 'Özet oluşturulamadı.'}
              </Text>
            </View>

            {/* CAS Signal */}
            <CasAlert signals={data.earlySignals} />

            {/* Tabbed Panels */}
            <TabbedSection data={data} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface1, borderBottomWidth: 1,
    borderBottomColor: colors.border, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, paddingTop: spacing.lg + 4,
  },
  logoBox: {
    width: 38, height: 38, borderRadius: radius.md,
    backgroundColor: colors.infoBg, borderWidth: 1, borderColor: colors.infoBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 18 },
  logoText: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  tagline: { fontSize: 11, color: colors.textMuted },
  onlinePill: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successBg, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.successBorder,
  },
  onlineDot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.success },
  onlineTxt: { fontSize: 10.5, fontWeight: '600', color: colors.success },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 32 },

  caseSelector: { marginBottom: 4 },
  segmentedControl: {
    flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.md,
    padding: 4, borderWidth: 1, borderColor: colors.border, marginTop: 6,
  },
  segmentBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  segmentTxt: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  segmentTxtActive: { color: colors.textPrimary },

  analyzeBtn: {
    backgroundColor: colors.info, borderRadius: radius.md, padding: 14,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: colors.info, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12,
    elevation: 8,
  },
  analyzeBtnDisabled: { opacity: 0.65 },
  analyzeTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  emptyIconWrap: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  summaryCard: {
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryText: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 22, backgroundColor: colors.surface1, borderRadius: radius.md, padding: 12 },

  casBox: {
    backgroundColor: colors.criticalBg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.criticalBorder,
    borderLeftWidth: 3, padding: spacing.lg,
  },
  casHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  casIcon: { fontSize: 20 },
  casId: { fontSize: 14, fontWeight: '700', color: colors.critical },
  casSubtitle: { fontSize: 11, color: colors.textMuted },
  casActiveBadge: {
    marginLeft: 'auto', backgroundColor: colors.criticalBg,
    borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.criticalBorder,
  },
  casActiveTxt: { fontSize: 10, fontWeight: '700', color: colors.critical, letterSpacing: 0.5 },
  criteriaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  criterion: {
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  criterionTxt: { fontSize: 12, fontWeight: '600', color: colors.critical },
  casMsg: { fontSize: 13, color: colors.textPrimary, lineHeight: 20, marginBottom: 8 },
  casDisclaimer: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },

  tabCard: { backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tabBar: { backgroundColor: colors.surface1, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 5, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.info },
  tabText: { fontSize: 12.5, fontWeight: '500', color: colors.textMuted },
  tabTextActive: { color: colors.textPrimary, fontWeight: '700' },
  tabCount: { backgroundColor: colors.neutralBg, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: colors.neutralBorder },
  tabCountWarn: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
  tabCountTxt: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  pane: { padding: spacing.md },

  missingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: colors.surface1, borderRadius: radius.md, marginBottom: 4 },
  missingLabel: { fontSize: 13, color: colors.textPrimary, flex: 1 },

  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 14, paddingVertical: 24 },
});
