import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Event, RootStackParamList } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { EventCard } from '../components/EventCard';
import { LoadingScreen } from '../components/LoadingScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function HomeScreen({ navigation }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.events.list();
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setEvents(sorted);
      setFiltered(sorted);
    } catch {
      setEvents([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(events);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
      )
    );
  }, [search, events]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>TBP</Text>
        <Text style={styles.subtitle}>Nightlife & Events</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, venues..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
          />
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
            <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No upcoming events</Text>
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
    paddingBottom: Spacing.sm,
  },
  logo: {
    color: Colors.primary,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: -2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    padding: 0,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  separator: {
    height: Spacing.md,
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
});
