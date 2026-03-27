import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { RootStackParamList, DJ, Track } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { LoadingScreen } from '../components/LoadingScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'DJDetail'>;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function DJDetailScreen({ route, navigation }: Props) {
  const { djId } = route.params;
  const { user, isAuthenticated } = useAuth();
  const [dj, setDJ] = useState<DJ | null>(null);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Audio player state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Booking modal state
  const [bookingVisible, setBookingVisible] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    eventDate: '',
    eventName: '',
    venue: '',
    message: '',
    contactEmail: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    loadDJ();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [djId]);

  const loadDJ = async () => {
    try {
      const [djData, trackData] = await Promise.all([
        api.djs.detail(djId),
        api.djs.tracks(djId).catch(() => [] as Track[]),
      ]);
      setDJ(djData);
      setFollowed(djData.followed ?? false);
      setFollowerCount(djData.followerCount ?? 0);
      setTracks(trackData);
    } catch {
      Alert.alert('Error', 'Could not load DJ profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to follow DJs.');
      return;
    }
    setFollowLoading(true);
    try {
      const result = followed
        ? await api.djs.unfollow(djId)
        : await api.djs.follow(djId);
      setFollowed(result.followed);
      setFollowerCount(result.followerCount);
    } catch {
      Alert.alert('Error', 'Could not update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const playTrack = async (track: Track) => {
    try {
      // Stop current track
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingTrackId === track.id) {
        setPlayingTrackId(null);
        setPlaybackPosition(0);
        return;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis / 1000);
            setPlaybackDuration(status.durationMillis ? status.durationMillis / 1000 : track.duration);
            if (status.didJustFinish) {
              setPlayingTrackId(null);
              setPlaybackPosition(0);
            }
          }
        }
      );
      soundRef.current = sound;
      setPlayingTrackId(track.id);
    } catch {
      Alert.alert('Playback Error', 'Could not play this track');
    }
  };

  const handleBookingSubmit = async () => {
    if (!bookingForm.eventName.trim() || !bookingForm.eventDate.trim() || !bookingForm.contactEmail.trim()) {
      Alert.alert('Error', 'Please fill in the required fields');
      return;
    }
    setBookingSubmitting(true);
    try {
      await api.booking.request({
        djId,
        eventDate: bookingForm.eventDate.trim(),
        eventName: bookingForm.eventName.trim(),
        venue: bookingForm.venue.trim(),
        message: bookingForm.message.trim(),
        contactEmail: bookingForm.contactEmail.trim(),
      });
      setBookingVisible(false);
      setBookingForm({ eventDate: '', eventName: '', venue: '', message: '', contactEmail: '' });
      Alert.alert('Booking Sent', 'Your booking request has been submitted. The DJ will be in touch.');
    } catch {
      Alert.alert('Error', 'Could not submit booking request');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading || !dj) return <LoadingScreen />;

  const socialButtons = [
    { key: 'instagram', icon: 'logo-instagram' as const, url: dj.socialLinks?.instagram },
    { key: 'soundcloud', icon: 'musical-note' as const, url: dj.socialLinks?.soundcloud },
    { key: 'spotify', icon: 'play-circle' as const, url: dj.socialLinks?.spotify },
  ].filter((s) => s.url);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {dj.photo ? (
          <Image source={{ uri: dj.photo }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.placeholderHero]}>
            <Ionicons name="person" size={80} color={Colors.textMuted} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{dj.name}</Text>
              <Text style={styles.followers}>
                {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.followButton, followed && styles.followedButton]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Ionicons
                    name={followed ? 'heart' : 'heart-outline'}
                    size={18}
                    color={followed ? Colors.error : Colors.text}
                  />
                  <Text style={styles.followText}>{followed ? 'Following' : 'Follow'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {dj.genres?.length > 0 && (
            <View style={styles.genresRow}>
              {dj.genres.map((genre) => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionRow}>
            {socialButtons.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.socialButton}
                onPress={() => Linking.openURL(s.url!)}
              >
                <Ionicons name={s.icon} size={22} color={Colors.primary} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => {
                if (!isAuthenticated) {
                  Alert.alert('Sign In Required', 'Please sign in to book DJs.');
                  return;
                }
                setBookingForm((f) => ({ ...f, contactEmail: user?.email ?? '' }));
                setBookingVisible(true);
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.text} />
              <Text style={styles.bookText}>Book DJ</Text>
            </TouchableOpacity>
          </View>

          {dj.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bio</Text>
              <Text style={styles.bio}>{dj.bio}</Text>
            </View>
          )}

          {tracks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tracks</Text>
              {tracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                const progress = isPlaying && playbackDuration > 0
                  ? playbackPosition / playbackDuration
                  : 0;
                return (
                  <TouchableOpacity
                    key={track.id}
                    onPress={() => playTrack(track)}
                    activeOpacity={0.8}
                  >
                    <GlassCard style={styles.trackCard}>
                      <View style={styles.trackRow}>
                        <View style={styles.playIcon}>
                          <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={20}
                            color={Colors.primary}
                          />
                        </View>
                        <View style={styles.trackInfo}>
                          <Text
                            style={[styles.trackTitle, isPlaying && styles.trackTitleActive]}
                            numberOfLines={1}
                          >
                            {track.title}
                          </Text>
                          <Text style={styles.trackArtist} numberOfLines={1}>
                            {track.artist}
                          </Text>
                        </View>
                        <Text style={styles.trackDuration}>
                          {isPlaying ? formatDuration(Math.floor(playbackPosition)) : formatDuration(track.duration)}
                        </Text>
                      </View>
                      {isPlaying && (
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {dj.upcomingEvents?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {dj.upcomingEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                >
                  <GlassCard style={styles.eventCard}>
                    <Text style={styles.eventName}>{event.title}</Text>
                    <Text style={styles.eventMeta}>
                      {event.date} at {event.venue}
                    </Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Booking Request Modal */}
      <Modal visible={bookingVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book {dj.name}</Text>
              <TouchableOpacity onPress={() => setBookingVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Event Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.eventName}
                  onChangeText={(v) => setBookingForm((f) => ({ ...f, eventName: v }))}
                  placeholder="e.g. Friday Night Live"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Event Date *</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.eventDate}
                  onChangeText={(v) => setBookingForm((f) => ({ ...f, eventDate: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Venue</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.venue}
                  onChangeText={(v) => setBookingForm((f) => ({ ...f, venue: v }))}
                  placeholder="Venue name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={bookingForm.contactEmail}
                  onChangeText={(v) => setBookingForm((f) => ({ ...f, contactEmail: v }))}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Message</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  value={bookingForm.message}
                  onChangeText={(v) => setBookingForm((f) => ({ ...f, message: v }))}
                  placeholder="Tell the DJ about your event..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, bookingSubmitting && styles.submitDisabled]}
                onPress={handleBookingSubmit}
                disabled={bookingSubmitting}
              >
                <Text style={styles.submitText}>
                  {bookingSubmitting ? 'Submitting...' : 'Send Booking Request'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  hero: { width: '100%', height: 320 },
  placeholderHero: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: Spacing.lg, marginTop: -Spacing.lg },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  name: { color: Colors.text, fontSize: FontSize.hero, fontWeight: '800' },
  followers: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  followedButton: { backgroundColor: Colors.surfaceLight },
  followText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
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
  genreText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
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
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginLeft: 'auto',
  },
  bookText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  bio: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22 },
  // Track player
  trackCard: { marginBottom: Spacing.sm },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  playIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  trackTitleActive: { color: Colors.primary },
  trackArtist: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  trackDuration: { color: Colors.textSecondary, fontSize: FontSize.sm },
  progressBarBg: {
    height: 3,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  // Events
  eventCard: { marginBottom: Spacing.sm },
  eventName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  eventMeta: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  // Booking modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '700' },
  formGroup: { marginBottom: Spacing.md },
  formLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  formInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTextarea: { height: 100 },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
});
