import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

function SkeletonBar({ width = '100%', height = 14, style = {} }) {
  const animValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animValue]);

  return (
    <Animated.View
      style={[
        styles.skBar,
        { width, height, opacity: animValue },
        style,
      ]}
    />
  );
}

export function ClinicalSummarySkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonBar width={140} height={12} />
        <SkeletonBar width={70} height={18} style={{ borderRadius: 999 }} />
      </View>
      <SkeletonBar width="100%" height={13} style={{ marginTop: 14 }} />
      <SkeletonBar width="90%" height={13} style={{ marginTop: 8 }} />
      <SkeletonBar width="75%" height={13} style={{ marginTop: 8 }} />
    </View>
  );
}

export function TabbedPanelSkeleton() {
  return (
    <View style={[styles.card, { marginTop: 0 }]}>
      <View style={styles.tabBar}>
        {[100, 80, 90].map((w, i) => (
          <SkeletonBar key={i} width={w} height={32} style={{ borderRadius: 8, marginRight: 8 }} />
        ))}
      </View>
      <View style={styles.pane}>
        {[100, 85, 95].map((w, i) => (
          <View key={i} style={styles.evidenceRow}>
            <View style={styles.evidenceLeft}>
              <SkeletonBar width={60} height={10} />
              <SkeletonBar width={`${w}%`} height={12} style={{ marginTop: 6 }} />
            </View>
            <SkeletonBar width={48} height={28} style={{ borderRadius: 8 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SkeletonDashboard() {
  return (
    <View style={styles.wrapper}>
      <ClinicalSummarySkeleton />
      <TabbedPanelSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  skBar: {
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 14,
  },
  pane: {
    gap: 10,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  evidenceLeft: {
    flex: 1,
    marginRight: 12,
  },
});
