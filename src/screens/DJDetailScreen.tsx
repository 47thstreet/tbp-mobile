import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, DJ } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'DJDetail'>;

export function DJDetailScreen({ route }: Props) {
  const { djId } = route.params;
  const [dj, setDJ] = useState<DJ | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.djs
      .detail(djId)
      .then(setDJ)
      .catch(() => Alert.alert('Error', 'Could not load DJ profile'))
      .finally(() => setLoading(false));
  }, [djId]);

  if (loading || !dj) return <LoadingScreen />;

  const socialButtons = [
    {
      key: 'instagram',
      icon: 'logo-instagram' as const,
      url: dj.socialLinks?.instagram,
    },
    {
      key: 'soundcloud',
      icon: 'musical-note' as const,
      url: dj.socialLinks?.soundcloud,
    },
    {
      key: 'spotify',
      icon: 'play-circle' as const,
      url: dj.socialLinks?.spotify,
    },
  ].filter((s) => s.url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {dj.photo ? (
        <Image source={{ uri: dj.photo }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.placeholderHero]}>
          <Ionicons name="person" size={80} color={Colors.textMuted} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name}>{dj.name}</Text>

        {dj.genres?.length > 0 && (
          <View style={styles.genresRow}>
            {dj.genres.map((genre) => (
              <View key={genre} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {socialButtons.length > 0 && (
          <View style={styles.socialRow}>
            {socialButtons.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.socialButton}
                onPress={() => Linking.openURL(s.url!)}
              >
                <Ionicons name={s.icon} size={22} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {dj.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bio}>{dj.bio}</Text>
          </View>
        )}

        {dj.upcomingEvents?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {dj.upcomingEvents.map((event) => (
              <GlassCard key={event.id} style={styles.eventCard}>
                <Text style={styles.eventName}>{event.title}</Text>
                <Text style={styles.eventMeta}>
                  {event.date} at {event.venue}
                </Text>
              </GlassCard>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  hero: {
    width: '100%',
    height: 320,
  },
  placeholderHero: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.hero,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  genreChip: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  genreText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
  bio: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  eventCard: {
    marginBottom: Spacing.sm,
  },
  eventName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  eventMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
});
