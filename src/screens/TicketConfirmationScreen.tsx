import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SvgQRCode from 'react-native-qrcode-svg';
import { RootStackParamList, Ticket } from '../types';
import { api } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketConfirmation'>;

export function TicketConfirmationScreen({ route, navigation }: Props) {
  const { ticketId, ticketTypeName } = route.params;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.tickets
      .detail(ticketId)
      .then(setTicket)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const goToTickets = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your ticket...</Text>
      </View>
    );
  }

  if (error || !ticket) {
    return (
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        </View>
        <Text style={styles.title}>Payment Successful</Text>
        <Text style={styles.subtitle}>
          Your ticket for {ticketTypeName} has been confirmed.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={goToTickets}>
          <Text style={styles.primaryButtonText}>View My Tickets</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
      </View>

      <Text style={styles.title}>You're In!</Text>
      <Text style={styles.subtitle}>{ticket.eventTitle}</Text>

      <GlassCard style={styles.ticketCard}>
        <View style={styles.qrContainer}>
          <View style={styles.qrBg}>
            <SvgQRCode
              value={ticket.qrCode}
              size={180}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>
        </View>

        <View style={styles.ticketDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="ticket" size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{ticket.ticketType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{ticket.eventDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{ticket.eventVenue}</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.hint}>Show this QR code at the door</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('FullScreenTicket', { ticket })}
        >
          <Ionicons name="expand" size={18} color={Colors.text} />
          <Text style={styles.primaryButtonText}>Full Screen QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={goToTickets}>
          <Text style={styles.secondaryButtonText}>Go to My Tickets</Text>
        </TouchableOpacity>
      </View>
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
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginTop: Spacing.md,
  },
  successIcon: {
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  ticketCard: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrBg: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ticketDetails: {
    width: '100%',
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
