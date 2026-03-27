import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

export type DateFilter = 'all' | 'tonight' | 'weekend' | 'week';

interface Props {
  active: DateFilter;
  onChange: (filter: DateFilter) => void;
}

const filters: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All Events' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'weekend', label: 'This Weekend' },
  { key: 'week', label: 'This Week' },
];

export function DateFilterChips({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.chip, active === f.key && styles.chipActive]}
          onPress={() => onChange(f.key)}
        >
          <Text style={[styles.chipText, active === f.key && styles.chipTextActive]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export function filterByDate(events: any[], filter: DateFilter): any[] {
  if (filter === 'all') return events;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (filter) {
    case 'tonight': {
      return events.filter((e) => {
        const d = new Date(e.date);
        return d >= today && d < tomorrow;
      });
    }
    case 'weekend': {
      const dayOfWeek = today.getDay();
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + (6 - dayOfWeek));
      const monday = new Date(saturday);
      monday.setDate(saturday.getDate() + 2);
      // If today is already Sat or Sun, include today
      const start = dayOfWeek === 6 || dayOfWeek === 0 ? today : saturday;
      return events.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d < monday;
      });
    }
    case 'week': {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return events.filter((e) => {
        const d = new Date(e.date);
        return d >= today && d < nextWeek;
      });
    }
    default:
      return events;
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.text,
  },
});
