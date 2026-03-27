import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, NotificationPreferences } from '../types';
import { api } from '../services/api';
import {
  requestNotificationPermission,
  areNotificationsEnabled,
} from '../services/notifications';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationPrefs'>;

interface PrefItem {
  key: keyof NotificationPreferences;
  icon: string;
  label: string;
  description: string;
}

const PREF_ITEMS: PrefItem[] = [
  {
    key: 'eventReminders',
    icon: 'alarm-outline',
    label: 'Event Reminders',
    description: 'Get notified 24 hours and 2 hours before events you have tickets for',
  },
  {
    key: 'friendActivity',
    icon: 'people-outline',
    label: 'Friend Activity',
    description: 'Know when friends are attending events near you',
  },
  {
    key: 'newEventsFollowedDjs',
    icon: 'headset-outline',
    label: 'New Events from DJs',
    description: 'Get notified when DJs you follow announce new events',
  },
  {
    key: 'promotions',
    icon: 'pricetag-outline',
    label: 'Promotions & Offers',
    description: 'Early access, discounts, and special offers',
  },
];

const DEFAULT_PREFS: NotificationPreferences = {
  eventReminders: true,
  friendActivity: true,
  newEventsFollowedDjs: true,
  promotions: false,
};

export function NotificationPrefsScreen({ navigation }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [systemEnabled, setSystemEnabled] = useState(false);

  useEffect(() => {
    Promise.all([
      api.notificationPrefs.get().catch(() => DEFAULT_PREFS),
      areNotificationsEnabled(),
    ]).then(([serverPrefs, enabled]) => {
      setPrefs(serverPrefs);
      setSystemEnabled(enabled);
      setLoading(false);
    });
  }, []);

  const handleToggle = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      // If enabling any pref, ensure system notifications are on
      if (value && !systemEnabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Notifications Disabled',
            'Please enable notifications in your device Settings first.',
          );
          return;
        }
        setSystemEnabled(true);
      }

      const prev = prefs[key];
      setPrefs((p) => ({ ...p, [key]: value }));
      setSaving(key);

      try {
        const updated = await api.notificationPrefs.update({ [key]: value });
        setPrefs(updated);
      } catch {
        // Revert on failure
        setPrefs((p) => ({ ...p, [key]: prev }));
        Alert.alert('Error', 'Could not update preference. Please try again.');
      } finally {
        setSaving(null);
      }
    },
    [prefs, systemEnabled],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {!systemEnabled && (
        <GlassCard style={styles.warningCard}>
          <View style={styles.warningRow}>
            <Ionicons name="warning-outline" size={20} color={Colors.warning} />
            <Text style={styles.warningText}>
              System notifications are off. Enable them in Settings to receive alerts.
            </Text>
          </View>
        </GlassCard>
      )}

      <GlassCard style={styles.prefsCard}>
        {PREF_ITEMS.map((item, index) => (
          <View
            key={item.key}
            style={[
              styles.prefRow,
              index < PREF_ITEMS.length - 1 && styles.prefRowBorder,
            ]}
          >
            <View style={styles.prefIcon}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={prefs[item.key] ? Colors.primary : Colors.textMuted}
              />
            </View>
            <View style={styles.prefInfo}>
              <Text style={styles.prefLabel}>{item.label}</Text>
              <Text style={styles.prefDescription}>{item.description}</Text>
            </View>
            <View style={styles.prefToggle}>
              {saving === item.key ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Switch
                  value={prefs[item.key]}
                  onValueChange={(val) => handleToggle(item.key, val)}
                  trackColor={{ false: Colors.surfaceLight, true: Colors.primaryDark }}
                  thumbColor={prefs[item.key] ? Colors.primary : Colors.textMuted}
                />
              )}
            </View>
          </View>
        ))}
      </GlassCard>

      <Text style={styles.footnote}>
        Notification preferences are synced to your account and apply across all your devices.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  warningCard: {
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    color: Colors.warning,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  prefsCard: {
    marginBottom: Spacing.md,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  prefRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefInfo: {
    flex: 1,
  },
  prefLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  prefDescription: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
    lineHeight: 16,
  },
  prefToggle: {
    width: 52,
    alignItems: 'flex-end',
  },
  footnote: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 16,
  },
});
