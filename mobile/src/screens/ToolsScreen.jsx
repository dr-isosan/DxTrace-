import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { submitFeedback, generateLLM } from '../api/dxtrace';
import { colors, spacing, radius } from '../theme/tokens';
import { cleanReferenceLinks } from '../utils/formatters';

export default function ToolsScreen() {
  const [prevContent, setPrevContent] = useState('AI ürettiği klinik özet metni');
  const [finalContent, setFinalContent] = useState('Doktorun onayladığı metin');
  const [fbLoading, setFbLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmResult, setLlmResult] = useState(null);

  const handleFeedback = async (action) => {
    setFbLoading(true);
    try {
      const result = await submitFeedback({
        componentId: 'cas_gi_01_output',
        action,
        doctorId: 'doc_889',
        previousContent: prevContent,
        finalContent,
      });
      const labels = { APPROVE: 'Onaylandı ✓', EDIT: 'Düzenleme kaydedildi', REJECT: 'Reddedildi' };
      Toast.show({
        type: action === 'APPROVE' ? 'success' : action === 'EDIT' ? 'info' : 'error',
        text1: labels[action],
        text2: `Log ID: ${result.logId}`,
        visibilityTime: 4000,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.message });
    } finally {
      setFbLoading(false);
    }
  };

  const handleLLM = async () => {
    setLlmLoading(true);
    setLlmResult(null);
    try {
      const data = await generateLLM();
      setLlmResult(data);
      Toast.show({
        type: data.passed ? 'success' : 'error',
        text1: data.passed ? 'Özet Doğrulandı' : 'Özet Reddedildi',
        text2: data.passed ? 'Halüsinasyon tespit edilmedi.' : `${data.violations?.length || 0} ihlal`,
        visibilityTime: 4000,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'LLM Hatası', text2: err.message });
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Feedback */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👨‍⚕️ Doktor Geri Bildirimi</Text>

        <Text style={styles.label}>AI Çıktısı</Text>
        <TextInput
          style={styles.input}
          value={prevContent}
          onChangeText={setPrevContent}
          multiline numberOfLines={3}
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Doktor Düzenlemesi</Text>
        <TextInput
          style={styles.input}
          value={finalContent}
          onChangeText={setFinalContent}
          multiline numberOfLines={3}
          placeholderTextColor={colors.textFaint}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.fbBtn, styles.approveBtn]}
            onPress={() => handleFeedback('APPROVE')}
            disabled={fbLoading}
          >
            <Text style={[styles.fbTxt, { color: colors.success }]}>✓ Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fbBtn, styles.editBtn]}
            onPress={() => handleFeedback('EDIT')}
            disabled={fbLoading}
          >
            <Text style={[styles.fbTxt, { color: colors.warning }]}>✏ Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fbBtn, styles.rejectBtn]}
            onPress={() => handleFeedback('REJECT')}
            disabled={fbLoading}
          >
            <Text style={[styles.fbTxt, { color: colors.critical }]}>✗ Reddet</Text>
          </TouchableOpacity>
        </View>
        {fbLoading && <ActivityIndicator size="small" color={colors.info} style={{ marginTop: 8 }} />}
      </View>

      {/* LLM */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 LLM Özet Üret</Text>
        <Text style={styles.hint}>Verifier Agent ile halüsinasyon korumalı</Text>

        <TouchableOpacity
          style={[styles.llmBtn, llmLoading && styles.llmBtnDisabled]}
          onPress={handleLLM}
          disabled={llmLoading}
        >
          {llmLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.llmBtnTxt}>{llmResult ? '↺ Tekrar Üret' : '🤖 Özet Üret'}</Text>
          }
        </TouchableOpacity>

        {llmResult && (
          <View style={[styles.llmResult, llmResult.passed ? styles.llmPassed : styles.llmFailed]}>
            <Text style={[styles.llmStatus, { color: llmResult.passed ? colors.success : colors.critical }]}>
              {llmResult.passed ? '✓ Doğrulandı' : '✗ Reddedildi'}
              {llmResult.violations?.length > 0 ? `  (${llmResult.violations.length} ihlal)` : ''}
            </Text>
            {llmResult.clinicalSummary
              ? <Text style={styles.llmText}>{cleanReferenceLinks(llmResult.clinicalSummary)}</Text>
              : <Text style={styles.llmMuted}>Çıktı halüsinasyon nedeniyle reddedildi.</Text>
            }
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface2, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 },

  label: { fontSize: 12, color: colors.textMuted, fontWeight: '500', marginBottom: 5 },
  input: {
    backgroundColor: colors.surface1, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, color: colors.textPrimary,
    padding: spacing.md, fontSize: 13, marginBottom: 12,
    textAlignVertical: 'top',
  },
  hint: { fontSize: 12.5, color: colors.textMuted, marginBottom: 12 },

  actionRow: { flexDirection: 'row', gap: 8 },
  fbBtn: { flex: 1, padding: 10, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  approveBtn: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  editBtn: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
  rejectBtn: { backgroundColor: colors.criticalBg, borderColor: colors.criticalBorder },
  fbTxt: { fontSize: 12.5, fontWeight: '700' },

  llmBtn: {
    backgroundColor: colors.purple, borderRadius: radius.md,
    padding: 13, alignItems: 'center',
    shadowColor: colors.purple, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  llmBtnDisabled: { opacity: 0.65 },
  llmBtnTxt: { color: '#fff', fontSize: 14.5, fontWeight: '700' },

  llmResult: { marginTop: 12, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  llmPassed: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  llmFailed: { backgroundColor: colors.criticalBg, borderColor: colors.criticalBorder },
  llmStatus: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  llmText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  llmMuted: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
});
