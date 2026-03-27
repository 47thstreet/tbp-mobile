import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Venue, RootStackParamList } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function VenuesScreen({ navigation }: Props) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVenues = useCallback(async () => {
    try {
      const data = await api.venues.list();
      setVenues(Array.isArray(data) ? data : []);
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  if (loading) return <LoadingScreen />;

  const renderVenue = ({ item }: { item: Venue }) => {
    const eventCount = item.upcomingEvents?.length ?? 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('VenueDetail', { venueId: item.id })}
      >
        <GlassCard noPadding style={styles.venueCard}>
          {item.coverImage || item.photo ? (
            <Image source={{ uri: item.coverImage || item.photo }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.placeholderImage]}>
              <Ionicons name="business" size={40} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.venueName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.address}, {item.city}
              </Text>
            </View>
            {item.capacity && (
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Capacity: {item.capacity.toLocaleString()}</Text>
              </View>
            )}
            {eventCount > 0 && (
              <View style={styles.eventCountBadge}>
                <Ionicons name="calendar" size={12} color={Colors.primaryLight} />
                <Text style={styles.eventCountText}>
                  {eventCount} upcoming {eventCount === 1 ? 'event' : 'events'}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Venues</Text>
      </View>

      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        renderItem={renderVenue}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchVenues();
            }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No venues listed yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  venueCard: { marginBottom: Spacing.md, overflow: 'hidden' },
  coverImage: { width: '100%', height: 160 },
  placeholderImage: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { padding: Spacing.md },
  venueName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: 6 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: { color: Colors.textSecondary, fontSize: FontSize.md, flex: 1 },
  eventCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  eventCountText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: Spacing.md,
  },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.lg },
});
