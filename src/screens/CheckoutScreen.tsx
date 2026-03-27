import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { createCheckoutSession, confirmPayment } from '../services/checkout';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { GlassCard } from '../components/GlassCard';
import { analytics } from '../services/analytics';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

type CheckoutState = 'loading' | 'ready' | 'processing' | 'error';

export function CheckoutScreen({ route, navigation }: Props) {
  const { eventId, ticketTypeId, ticketTypeName, price } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [state, setState] = useState<CheckoutState>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    initializeCheckout();
  }, []);

  const initializeCheckout = async () => {
    setState('loading');
    setErrorMessage('');

    try {
      const session = await createCheckoutSession(eventId, ticketTypeId);
      setSessionId(session.sessionId);

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: session.clientSecret,
        merchantDisplayName: 'TB Productions',
        style: 'alwaysDark',
        returnURL: 'tbp://checkout-complete',
      });

      if (error) {
        throw new Error(error.message);
      }

      setState('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not initialize checkout';
      setErrorMessage(message);
      setState('error');
    }
  };

  const handlePayment = async () => {
    if (!sessionId) return;

    setState('processing');
    setErrorMessage('');

    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          setState('ready');
          return;
        }
        throw new Error(error.message);
      }

      const result = await confirmPayment(sessionId);

      if (result.success && result.ticketId) {
        analytics.trackFirstTicketPurchase(eventId, ticketTypeName, price);
        navigation.replace('TicketConfirmation', {
          ticketId: result.ticketId,
          eventTitle: '',
          ticketTypeName,
        });
      } else {
        throw new Error(result.error || 'Payment confirmation failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';

      if (message.includes('expired') || message.includes('session')) {
        setErrorMessage('Your checkout session has expired. Please try again.');
      } else if (message.includes('declined') || message.includes('card')) {
        setErrorMessage('Your card was declined. Please try a different payment method.');
      } else if (message.includes('network') || message.includes('fetch')) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage(message);
      }

      setState('error');
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Preparing checkout...</Text>
          </View>
        );

      case 'ready':
        return (
          <View style={styles.readyContainer}>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Ticket</Text>
              <Text style={styles.summaryValue}>{ticketTypeName}</Text>
              <View style={styles.divider} />
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.priceText}>
                {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
              </Text>
            </GlassCard>

            <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
              <Ionicons name="card" size={20} color={Colors.text} />
              <Text style={styles.payButtonText}>
                {price === 0 ? 'Confirm Free Ticket' : `Pay $${price.toFixed(2)}`}
              </Text>
            </TouchableOpacity>

            <Text style={styles.secureText}>
              <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
              {' '}Secured by Stripe
            </Text>
          </View>
        );

      case 'processing':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Processing payment...</Text>
            <Text style={styles.subText}>Please do not close the app</Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centered}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
            </View>
            <Text style={styles.errorTitle}>Checkout Error</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initializeCheckout}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginTop: Spacing.md,
  },
  subText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  readyContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  summaryCard: {
    gap: Spacing.sm,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  priceText: {
    color: Colors.primary,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },
  payButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  payButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  secureText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  errorIcon: {
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  errorMessage: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: Spacing.sm,
  },
  backText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
