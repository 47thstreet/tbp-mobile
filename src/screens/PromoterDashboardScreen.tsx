import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SvgQRCode from 'react-native-qrcode-svg';
import { PromoterStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

export function PromoterDashboardScreen() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<PromoterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'promoter') {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await api.promoter.stats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleShare = async () => {
    if (!stats) return;
    try {
      await Share.share({
        message: `Get tickets through my link: ${stats.promoLink}`,
        url: stats.promoLink,
      });
    } catch {
      // User cancelled
    }
  };

  if (!isAuthenticated || user?.role !== 'promoter') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.empty}>
          <Ionicons name="megaphone-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Promoter Dashboard</Text>
          <Text style={styles.emptySubtext}>
            {!isAuthenticated
              ? 'Log in with a promoter account to access your dashboard'
              : 'Your account does not have promoter access'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStats();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.title}>Promoter Dashboard</Text>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="ticket" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{stats?.totalSales ?? 0}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="cash" size={24} color={Colors.success} />
            <Text style={styles.statValue}>
              ${(stats?.totalRevenue ?? 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="wallet" size={24} color={Colors.accent} />
            <Text style={styles.statValue}>
              ${(stats?.commission ?? 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Commission</Text>
          </GlassCard>
        </View>

        {stats?.promoLink && (
          <GlassCard style={styles.promoSection}>
            <Text style={styles.sectionTitle}>Your Promo Link</Text>
            <View style={styles.qrContainer}>
              <View style={styles.qrBg}>
                <SvgQRCode
                  value={stats.promoLink}
                  size={180}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
            </View>
            <Text style={styles.promoCode}>{stats.promoCode}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={Colors.text} />
              <Text style={styles.shareText}>Share Link</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {stats?.eventBreakdown?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Breakdown</Text>
            {stats.eventBreakdown.map((event) => (
              <GlassCard key={event.eventId} style={styles.eventRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{event.eventTitle}</Text>
                </View>
                <View style={styles.eventStats}>
                  <Text style={styles.eventSales}>{event.sales} sold</Text>
                  <Text style={styles.eventRevenue}>
                    ${event.revenue.toFixed(0)}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  promoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    marginVertical: Spacing.md,
  },
  qrBg: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  promoCode: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  shareText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  eventName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  eventStats: {
    alignItems: 'flex-end',
  },
  eventSales: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  eventRevenue: {
    color: Colors.success,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  emptyText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
});
