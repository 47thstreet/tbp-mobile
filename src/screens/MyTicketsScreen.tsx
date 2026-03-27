import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SvgQRCode from 'react-native-qrcode-svg';
import { Ticket } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

export function MyTicketsScreen() {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) {
      setTickets([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await api.tickets.mine();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const statusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'valid': return Colors.success;
      case 'used': return Colors.textMuted;
      case 'expired': return Colors.warning;
      case 'cancelled': return Colors.error;
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.empty}>
          <Ionicons name="ticket-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Log in to see your tickets</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              setExpandedId(expandedId === item.id ? null : item.id)
            }
          >
            <GlassCard style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {item.eventTitle}
                  </Text>
                  <Text style={styles.ticketType}>{item.ticketType}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${statusColor(item.status)}20` },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: statusColor(item.status) }]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketMeta}>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.eventDate}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.eventVenue}</Text>
                </View>
              </View>

              {expandedId === item.id && item.qrCode && (
                <View style={styles.qrContainer}>
                  <View style={styles.qrBg}>
                    <SvgQRCode
                      value={item.qrCode}
                      size={200}
                      backgroundColor="#FFFFFF"
                      color="#000000"
                    />
                  </View>
                  <Text style={styles.qrHint}>Show this at the door</Text>
                </View>
              )}

              <View style={styles.expandHint}>
                <Ionicons
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textMuted}
                />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTickets();
            }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No tickets yet</Text>
            <Text style={styles.emptySubtext}>
              Purchase tickets from an event to see them here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  separator: {
    height: Spacing.md,
  },
  ticketCard: {},
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  eventTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  ticketType: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  ticketMeta: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  qrBg: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  qrHint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
});
