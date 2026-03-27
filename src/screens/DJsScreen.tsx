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
import { DJ, RootStackParamList } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function DJsScreen({ navigation }: Props) {
  const [djs, setDJs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDJs = useCallback(async () => {
    try {
      const data = await api.djs.list();
      setDJs(Array.isArray(data) ? data : []);
    } catch {
      setDJs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDJs();
  }, [fetchDJs]);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>DJs</Text>
      </View>

      <FlatList
        data={djs}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardWrapper}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DJDetail', { djId: item.id })}
          >
            <GlassCard noPadding style={styles.djCard}>
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Ionicons name="person" size={32} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.djName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.genres?.length > 0 && (
                  <Text style={styles.genres} numberOfLines={1}>
                    {item.genres.join(' / ')}
                  </Text>
                )}
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDJs();
            }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="headset-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No DJs listed yet</Text>
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
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardWrapper: {
    flex: 1,
  },
  djCard: {
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  photoPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: Spacing.sm,
  },
  djName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  genres: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
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
