import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  AppState,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { studentAPI } from '../api/api';
import { colors } from '../theme/colors';
import StatusTimeline from '../components/StatusTimeline';
import VirtualCard from '../components/VirtualCard';
import { useAuth } from '../context/AuthContext';
import { formatRequestPaid, isAwaitingPayment, requestCurrency } from '../utils/money';
import { openCheckout } from '../utils/checkout';

const CardStatusScreen = ({ route }) => {
  const initialToken = route.params?.requestToken || '';
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (initialToken) {
      handleLookupToken(initialToken);
    }
  }, [initialToken]);

  // Ask the gateway whether an unpaid request has been paid, then reload it
  const checkPayment = useCallback(async ({ quiet = false } = {}) => {
    if (!isAwaitingPayment(requestData)) return;
    setChecking(true);
    try {
      if (requestCurrency(requestData) === 'NGN') {
        if (requestData.gatewayReference) await studentAPI.verifyPaystack(requestData.gatewayReference);
      } else if (requestData.paymentReference) {
        await studentAPI.checkPaymentStatus(requestData.paymentReference);
      }
    } catch (err) {
      if (!quiet) Alert.alert('Not confirmed yet', err.response?.data?.message || 'We have not received this payment yet.');
    }
    try {
      const res = await studentAPI.getRequest(requestData.requestToken);
      if (res.success) setRequestData(res.data);
    } catch (err) {
      console.warn('Reload request error:', err);
    } finally {
      setChecking(false);
    }
  }, [requestData]);

  // Coming back from the Paystack / Hubtel browser page: check straight away
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPayment({ quiet: true });
    });
    return () => sub.remove();
  }, [checkPayment]);

  const resumeCheckout = async () => {
    try {
      await openCheckout(requestData, user);
    } catch (err) {
      Alert.alert('Payment not started', err.response?.data?.message || err.message || 'Please try again.');
    }
  };

  const handleLookupToken = async (tok) => {
    const searchToken = tok || tokenInput;
    if (!searchToken.trim()) {
      Alert.alert('Required', 'Please enter a request token.');
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.getRequest(searchToken.trim());
      if (res.success) {
        setRequestData(res.data);
      } else {
        Alert.alert('Not Found', res.message || 'No card request found with this token.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to fetch request status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Track Card Request 🔍</Text>
      <Text style={styles.subtitle}>Enter your unique Request Token to view live processing status.</Text>

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="e.g. REQ-984201"
          placeholderTextColor={colors.textMuted}
          value={tokenInput}
          onChangeText={setTokenInput}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => handleLookupToken()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="search" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {requestData && (
        <View style={styles.resultsContainer}>
          {/* Card Component Preview */}
          <VirtualCard
            cardData={requestData}
            studentName={requestData.student?.name}
            byuId={requestData.student?.byuId}
          />

          {/* Timeline Tracker */}
          <StatusTimeline status={requestData.status} />

          {/* Request Metadata Details Box */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Request Overview</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Request Token:</Text>
              <Text style={styles.detailValue}>{requestData.requestToken}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card Amount:</Text>
              <Text style={styles.detailValue}>${requestData.amount} USD</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Paid:</Text>
              <Text style={[styles.detailValue, { color: colors.accentGreen }]}>
                {formatRequestPaid(requestData)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>{(requestData.paymentMethod || 'momo-hubtel').toUpperCase()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: colors.accentPurple, fontWeight: '800' }]}>
                {(requestData.status || 'pending').toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted:</Text>
              <Text style={styles.detailValue}>
                {new Date(requestData.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {isAwaitingPayment(requestData) && (
            <View style={styles.payActions}>
              <TouchableOpacity style={styles.payBtn} onPress={resumeCheckout}>
                <Text style={styles.payBtnText}>
                  Continue to {requestCurrency(requestData) === 'NGN' ? 'Paystack' : 'Hubtel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkBtn} onPress={() => checkPayment()} disabled={checking}>
                {checking ? (
                  <ActivityIndicator color={colors.textMain} size="small" />
                ) : (
                  <Text style={styles.checkBtnText}>I have paid · Check payment</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 46,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    color: colors.textMain,
    fontSize: 15,
    fontFamily: 'Platform',
    fontWeight: 'bold',
  },
  searchBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accentIndigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    gap: 10,
  },
  detailsCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 10,
    gap: 12,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMain,
  },
  payActions: {
    gap: 10,
    marginTop: 14,
  },
  payBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accentIndigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMain,
  },
});

export default CardStatusScreen;
