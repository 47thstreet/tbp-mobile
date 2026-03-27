import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SvgQRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';
import { RootStackParamList } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FullScreenTicket'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH - 80, 300);

export function FullScreenTicketScreen({ route, navigation }: Props) {
  const { ticket } = route.params;

  useEffect(() => {
    let originalBrightness: number | undefined;

    async function boostBrightness() {
      try {
        if (Platform.OS !== 'web') {
          const { status } = await Brightness.requestPermissionsAsync();
          if (status === 'granted') {
            originalBrightness = await Brightness.getBrightnessAsync();
            await Brightness.setBrightnessAsync(1);
          }
        }
      } catch {
        // Brightness control not available
      }
    }

    boostBrightness();

    return () => {
      if (originalBrightness !== undefined) {
        Brightness.setBrightnessAsync(originalBrightness).catch(() => {});
      }
    };
  }, []);

  const statusColor = () => {
    switch (ticket.status) {
      case 'valid': return Colors.success;
      case 'used': return Colors.textMuted;
      case 'expired': return Colors.warning;
      case 'cancelled': return Colors.error;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={28} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.ticketInfo}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {ticket.eventTitle}
        </Text>
        <Text style={styles.ticketType}>{ticket.ticketType}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{ticket.eventDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{ticket.eventVenue}</Text>
        </View>
      </View>

      <View style={styles.qrSection}>
        <View style={styles.qrBg}>
          <SvgQRCode
            value={ticket.qrCode}
            size={QR_SIZE}
            backgroundColor="#FFFFFF"
            color="#000000"
          />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor()}20` }]}>
          <Text style={[styles.statusText, { color: statusColor() }]}>
            {ticket.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.hint}>Show this QR code at the entrance</Text>
      <Text style={styles.subHint}>Screen brightness has been maximized</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ticketInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  eventTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  ticketType: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  qrSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  qrBg: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hint: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.xl,
  },
  subHint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
});
