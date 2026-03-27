import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function GlassCard({ children, style, noPadding }: GlassCardProps) {
  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});
