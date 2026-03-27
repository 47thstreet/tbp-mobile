import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { Event, RootStackParamList } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { EventCard } from '../components/EventCard';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

type TimeFilter = 'all' | 'tonight' | 'weekend';
type RadiusKm = 5 | 10 | 25 | 50;
type ViewMode = 'list' | 'map';

const RADIUS_OPTIONS: { value: RadiusKm; label: string }[] = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
];

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'weekend', label: 'Weekend' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isTonight(dateStr: string): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dateStr);
  return d >= today && d < tomorrow;
}

function isThisWeekend(dateStr: string): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (6 - dayOfWeek));
  const monday = new Date(saturday);
  monday.setDate(saturday.getDate() + 2);
  const start = dayOfWeek === 6 || dayOfWeek === 0 ? today : saturday;
  const d = new Date(dateStr);
  return d >= start && d < monday;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

interface NearbyEvent extends Event {
  distance: number;
}

export function NearbyEventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [filtered, setFiltered] = useState<NearbyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [radius, setRadius] = useState<RadiusKm>(25);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      setLoading(false);
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLocation(loc);
    return loc;
  }, []);

  const fetchEvents = useCallback(
    async (loc: Location.LocationObject | null) => {
      try {
        const data = await api.events.list();
        const allEvents = Array.isArray(data) ? data : [];

        if (!loc) {
          setEvents(allEvents.map((e) => ({ ...e, distance: Infinity })));
          return;
        }

        const withDistance: NearbyEvent[] = allEvents
          .filter((e) => e.latitude != null && e.longitude != null)
          .map((e) => ({
            ...e,
            distance: haversineDistance(
              loc.coords.latitude,
              loc.coords.longitude,
              e.latitude!,
              e.longitude!,
            ),
          }))
          .sort((a, b) => a.distance - b.distance);

        setEvents(withDistance);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const loc = await requestLocation();
      await fetchEvents(loc);
    })();
  }, [requestLocation, fetchEvents]);

  useEffect(() => {
    let result = events.filter((e) => e.distance <= radius);

    if (timeFilter === 'tonight') {
      result = result.filter((e) => isTonight(e.date));
    } else if (timeFilter === 'weekend') {
      result = result.filter((e) => isThisWeekend(e.date));
    }

    setFiltered(result);
  }, [events, timeFilter, radius]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const loc = await requestLocation();
    await fetchEvents(loc ?? location);
  }, [requestLocation, fetchEvents, location]);

  const fitMapToEvents = useCallback(() => {
    if (!mapRef.current || filtered.length === 0) return;
    const coords = filtered
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({ latitude: e.latitude!, longitude: e.longitude! }));
    if (location) {
      coords.push({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
    if (coords.length > 0) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
        animated: true,
      });
    }
  }, [filtered, location]);

  useEffect(() => {
    if (viewMode === 'map') {
      setTimeout(fitMapToEvents, 300);
    }
  }, [viewMode, fitMapToEvents]);

  if (loading) return <LoadingScreen />;

  if (permissionDenied) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.permTitle}>Location Access Needed</Text>
          <Text style={styles.permDescription}>
            Enable location access in your device Settings to discover events near you.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setPermissionDenied(false);
              setLoading(true);
              const loc = await requestLocation();
              if (loc) await fetchEvents(loc);
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mapRegion: Region | undefined =
    location
      ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: radius * 0.02,
          longitudeDelta: radius * 0.02,
        }
      : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover Near Me</Text>
          {location && (
            <Text style={styles.subtitle}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} within {radius} km
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <Ionicons
            name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
            size={22}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Filter row */}
      <View style={styles.filterRow}>
        <View style={styles.timeFilters}>
          {TIME_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, timeFilter === f.key && styles.chipActive]}
              onPress={() => setTimeFilter(f.key)}
            >
              <Text style={[styles.chipText, timeFilter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.radiusButton}
          onPress={() => setShowRadiusPicker(!showRadiusPicker)}
        >
          <Ionicons name="resize-outline" size={16} color={Colors.primary} />
          <Text style={styles.radiusButtonText}>{radius} km</Text>
        </TouchableOpacity>
      </View>

      {/* Radius picker dropdown */}
      {showRadiusPicker && (
        <GlassCard style={styles.radiusPicker}>
          <Text style={styles.radiusPickerTitle}>Distance Radius</Text>
          <View style={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.radiusOption,
                  radius === opt.value && styles.radiusOptionActive,
                ]}
                onPress={() => {
                  setRadius(opt.value);
                  setShowRadiusPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    radius === opt.value && styles.radiusOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>
      )}

      {viewMode === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <View style={styles.distanceBadgeRow}>
                <View style={styles.distanceBadge}>
                  <Ionicons name="navigate-outline" size={12} color={Colors.primary} />
                  <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
                </View>
              </View>
              <EventCard
                event={item}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No events found nearby</Text>
              <Text style={styles.emptySubtext}>
                Try increasing the distance radius or changing the time filter
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.mapContainer}>
          {mapRegion && (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={mapRegion}
              showsUserLocation
              showsMyLocationButton
              userInterfaceStyle="dark"
            >
              {filtered
                .filter((e) => e.latitude != null && e.longitude != null)
                .map((event) => (
                  <Marker
                    key={event.id}
                    coordinate={{
                      latitude: event.latitude!,
                      longitude: event.longitude!,
                    }}
                    title={event.title}
                    description={`${event.venue} - ${formatDistance(event.distance)}`}
                    onCalloutPress={() =>
                      navigation.navigate('EventDetail', { eventId: event.id })
                    }
                    pinColor={Colors.primary}
                  />
                ))}
            </MapView>
          )}

          {/* Bottom event cards overlay on map */}
          {filtered.length > 0 && (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mapCardList}
              contentContainerStyle={styles.mapCardListContent}
              snapToInterval={SCREEN_WIDTH - Spacing.lg * 2 + Spacing.md}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.mapCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                >
                  <GlassCard>
                    <Text style={styles.mapCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.mapCardRow}>
                      <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.mapCardVenue} numberOfLines={1}>
                        {item.venue}
                      </Text>
                    </View>
                    <View style={styles.mapCardRow}>
                      <Ionicons name="navigate-outline" size={12} color={Colors.primary} />
                      <Text style={styles.mapCardDistance}>
                        {formatDistance(item.distance)}
                      </Text>
                      <Text style={styles.mapCardTime}>{item.time}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: Spacing.xl,
  },
  permTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  timeFilters: {
    flexDirection: 'row',
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
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  radiusButtonText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  radiusPicker: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  radiusPickerTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  radiusOptionActive: {
    backgroundColor: Colors.primaryDark,
  },
  radiusOptionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  radiusOptionTextActive: {
    color: Colors.text,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  separator: {
    height: Spacing.md,
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  distanceText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapCardList: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
  },
  mapCardListContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  mapCard: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
  },
  mapCardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  mapCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mapCardVenue: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },
  mapCardDistance: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  mapCardTime: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginLeft: Spacing.sm,
  },
});
