import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, FeedPost } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StoryCircle({ name, avatar, isPersona }: {
  name: string;
  avatar?: string;
  isPersona?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.storyCircle}>
      <View style={[styles.storyRing, isPersona && styles.storyRingPersona]}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.storyAvatar} />
        ) : (
          <View style={[styles.storyAvatar, styles.storyAvatarPlaceholder]}>
            <Ionicons name="person" size={20} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
}

function PostCard({
  post,
  onLike,
  onEventTap,
}: {
  post: FeedPost;
  onLike: (postId: string) => void;
  onEventTap: (eventId: string) => void;
}) {
  const isPersona = !!post.author.persona;
  const personaLabel = post.author.persona === 'noctvrnal'
    ? 'NOCTVRNAL'
    : post.author.persona === 'mia-noir'
    ? 'Mia Noir'
    : null;

  return (
    <GlassCard style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.authorRow}>
          {post.author.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.authorAvatar} />
          ) : (
            <View style={[styles.authorAvatar, styles.authorAvatarPlaceholder]}>
              <Ionicons name="person" size={16} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{post.author.name}</Text>
              {post.author.verified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
              )}
            </View>
            {personaLabel && (
              <Text style={styles.personaTag}>{personaLabel}</Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
      </View>

      {post.content ? (
        <Text style={styles.postContent}>{post.content}</Text>
      ) : null}

      {post.images?.length ? (
        post.images.length === 1 ? (
          <Image
            source={{ uri: post.images[0] }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
          >
            {post.images.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )
      ) : null}

      {post.eventId && post.eventTitle ? (
        <TouchableOpacity
          style={styles.eventLink}
          onPress={() => onEventTap(post.eventId!)}
        >
          <Ionicons name="musical-notes" size={14} color={Colors.primary} />
          <Text style={styles.eventLinkText} numberOfLines={1}>
            {post.eventTitle}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      {post.type === 'activity' && (
        <View style={styles.activityBadge}>
          <Ionicons name="ticket" size={12} color={Colors.primaryLight} />
          <Text style={styles.activityText}>Friend Activity</Text>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons
            name={post.liked ? 'heart' : 'heart-outline'}
            size={22}
            color={post.liked ? Colors.error : Colors.textSecondary}
          />
          {post.likeCount > 0 && (
            <Text style={[styles.actionCount, post.liked && styles.actionCountLiked]}>
              {post.likeCount}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
          {post.commentCount > 0 && (
            <Text style={styles.actionCount}>{post.commentCount}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

export function SocialFeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    try {
      const data = await api.feed.list(isRefresh ? undefined : cursor);
      if (isRefresh) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      // Feed unavailable
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [cursor]);

  useEffect(() => {
    fetchFeed(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setCursor(undefined);
    fetchFeed(true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchFeed(false);
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await api.feed.like(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: result.liked, likeCount: result.likeCount }
            : p
        )
      );
    } catch {
      // Like failed silently
    }
  };

  const handleEventTap = (eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  };

  const stories: { name: string; avatar?: string; isPersona?: boolean }[] = [
    { name: 'NOCTVRNAL', isPersona: true },
    { name: 'Mia Noir', isPersona: true },
  ];

  const renderHeader = () => (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      >
        {stories.map((story, i) => (
          <StoryCircle
            key={i}
            name={story.name}
            avatar={story.avatar}
            isPersona={story.isPersona}
          />
        ))}
      </ScrollView>
      <View style={styles.divider} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Feed</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onEventTap={handleEventTap}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Follow events and friends to see their updates here
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Stories
  storiesContainer: {
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  storyCircle: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingPersona: {
    borderColor: Colors.primary,
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyAvatarPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  // Post Card
  postCard: {
    gap: Spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorAvatarPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  personaTag: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  timeAgo: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },

  // Post Content
  postContent: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  singleImage: {
    width: '100%',
    height: IMAGE_SIZE * 0.75,
    borderRadius: BorderRadius.md,
  },
  imageScroll: {
    marginHorizontal: -Spacing.md,
  },
  imageScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  carouselImage: {
    width: IMAGE_SIZE * 0.7,
    height: IMAGE_SIZE * 0.55,
    borderRadius: BorderRadius.md,
  },

  // Event Link
  eventLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  eventLinkText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    flexShrink: 1,
  },

  // Activity Badge
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  activityText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },

  // Actions
  postActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  actionCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  actionCountLiked: {
    color: Colors.error,
  },

  // Footer / Empty
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
