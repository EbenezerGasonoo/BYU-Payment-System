import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../api/api';
import { colors } from '../theme/colors';
import { FALLBACK_RATES, FEE_PERCENT, formatMoney, getStudentCountry } from '../utils/money';
import { openCheckout } from '../utils/checkout';

const RequestCardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [amountUSD, setAmountUSD] = useState('250');
  const [loading, setLoading] = useState(false);

  const studentCountry = getStudentCountry(user?.countryCode);
  const paysWithPaystack = studentCountry.currency === 'NGN';
  const [rate, setRate] = useState(FALLBACK_RATES[studentCountry.currency]);

  // Same rate source the server prices requests with
  useEffect(() => {
    setRate(FALLBACK_RATES[studentCountry.currency]);
    studentAPI.getRates()
      .then((data) => {
        if (data?.rates?.[studentCountry.currency]) setRate(data.rates[studentCountry.currency]);
      })
      .catch(() => {});
  }, [studentCountry.currency]);

  const numAmount = parseFloat(amountUSD) || 0;
  const calculatedLocalAmount = formatMoney(numAmount * rate * (1 + FEE_PERCENT / 100), studentCountry.currency);

  const handleRequest = async () => {
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid card amount in USD.');
      return;
    }

    setLoading(true);
    try {
      // The server prices the request in the student's currency
      const res = await studentAPI.requestCard({ amount: numAmount, paymentMethod: 'pending' });
      if (!res.success) {
        Alert.alert('Request Error', res.message || 'Failed to submit card request.');
        return;
      }

      const request = res.data;
      navigation.navigate('CardStatus', { requestToken: request.requestToken });
      try {
        await openCheckout(request, user);
        Alert.alert(
          'Finish paying',
          `Pay ${formatMoney(request.amountLocal ?? request.totalPaidGHS, request.currency)} on the ${paysWithPaystack ? 'Paystack' : 'Hubtel'} page, then come back here. We confirm it automatically.`
        );
      } catch (err) {
        Alert.alert('Payment not started', err.response?.data?.message || err.message || 'Open Card Status to try again.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Request USD Virtual Card 💳</Text>
      <Text style={styles.subtitle}>
        Issue a Visa Virtual Card to pay your BYU Pathway tuition &amp; course fees online.
      </Text>

      {/* Amount Input */}
      <View style={styles.cardBox}>
        <Text style={styles.boxLabel}>Card Amount (USD)</Text>
        <View style={styles.amountInputRow}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amountUSD}
            onChangeText={setAmountUSD}
            keyboardType="numeric"
            placeholder="250"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.usdText}>USD</Text>
        </View>

        {/* Preset Pill Buttons */}
        <View style={styles.presetsRow}>
          {['100', '150', '250', '500'].map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.presetPill, amountUSD === val && styles.presetPillActive]}
              onPress={() => setAmountUSD(val)}
            >
              <Text style={[styles.presetText, amountUSD === val && styles.presetTextActive]}>
                ${val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Currency Conversion Estimate Box */}
        <View style={styles.conversionBox}>
          <View style={styles.conversionRow}>
            <Text style={styles.convLabel}>Estimated Total incl. {FEE_PERCENT}% fee:</Text>
            <Text style={styles.convValue}>
              {studentCountry.flag} {calculatedLocalAmount}
            </Text>
          </View>
          <Text style={styles.rateText}>
            Current Rate: 1 USD = {Number(rate).toFixed(2)} {studentCountry.currency}. The exact total is fixed when you submit.
          </Text>
        </View>
      </View>

      {/* Payment method follows the student's country */}
      <Text style={styles.sectionHeader}>How you pay</Text>

      <View style={[styles.methodCard, styles.methodCardActive]}>
        <View style={styles.methodIconBg}>
          <Feather name={paysWithPaystack ? 'credit-card' : 'smartphone'} size={22} color={paysWithPaystack ? colors.accentIndigo : colors.accentGreen} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>
            {paysWithPaystack ? 'Paystack checkout (Nigeria)' : 'Mobile Money through Hubtel (Ghana)'}
          </Text>
          <Text style={styles.methodSub}>
            {paysWithPaystack
              ? 'Pay in naira by card, bank transfer or USSD.'
              : 'MTN MoMo, Telecel Cash or AT Money. Approve the prompt on your phone.'}
          </Text>
        </View>
      </View>
      <Text style={styles.rateText}>Wrong country? Change it in Settings before requesting.</Text>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleRequest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>
            Continue to {paysWithPaystack ? 'Paystack' : 'Hubtel'} →
          </Text>
        )}
      </TouchableOpacity>
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
  cardBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 24,
  },
  boxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.accentPurple,
    height: 56,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accentPurple,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  usdText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  presetPill: {
    flex: 1,
    backgroundColor: colors.inputBg,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  presetPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: colors.accentIndigo,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  presetTextActive: {
    color: colors.accentPurple,
    fontWeight: 'bold',
  },
  conversionBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  convValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accentGreen,
  },
  rateText: {
    fontSize: 11,
    color: colors.textSub,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  methodCardActive: {
    borderColor: colors.accentIndigo,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  methodIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  methodSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  radioActive: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigo,
  },
  submitBtn: {
    backgroundColor: colors.accentIndigo,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: colors.accentIndigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RequestCardScreen;
