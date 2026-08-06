import React, { useState } from 'react';
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
import { colors, WEST_AFRICA_COUNTRIES } from '../theme/colors';

const RequestCardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [amountUSD, setAmountUSD] = useState('250');
  const [paymentMethod, setPaymentMethod] = useState('momo-hubtel'); // 'momo-hubtel', 'momo-mtn', 'paystack'
  const [loading, setLoading] = useState(false);

  const studentCountry = WEST_AFRICA_COUNTRIES[user?.countryCode] || WEST_AFRICA_COUNTRIES.GH;
  const exchangeRates = { GHS: 15.8, NGN: 1550, XOF: 610, XAF: 610, SLL: 22.5, LRD: 195, GMD: 68 };
  const rate = exchangeRates[studentCountry.currency] || 15.8;

  const numAmount = parseFloat(amountUSD) || 0;
  const calculatedLocalAmount = (numAmount * rate).toFixed(2);

  const handleRequest = async () => {
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid card amount in USD.');
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.requestCard({
        studentId: user._id || user.id,
        amount: numAmount,
        paymentMethod,
        currency: studentCountry.currency,
      });

      if (res.success) {
        Alert.alert(
          'Request Submitted 🎉',
          `Your Request Token: ${res.data?.requestToken}\n\nPlease proceed to complete payment.`,
          [
            {
              text: 'Track Status',
              onPress: () => navigation.navigate('CardStatus', { requestToken: res.data?.requestToken }),
            },
          ]
        );
      } else {
        Alert.alert('Request Error', res.message || 'Failed to submit card request.');
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
            <Text style={styles.convLabel}>Estimated Total ({studentCountry.currency}):</Text>
            <Text style={styles.convValue}>
              {studentCountry.flag} {studentCountry.currency} {calculatedLocalAmount}
            </Text>
          </View>
          <Text style={styles.rateText}>
            Current Rate: 1 USD = {rate} {studentCountry.currency}
          </Text>
        </View>
      </View>

      {/* Payment Method Selector */}
      <Text style={styles.sectionHeader}>Select Payment Method</Text>

      <TouchableOpacity
        style={[styles.methodCard, paymentMethod === 'momo-hubtel' && styles.methodCardActive]}
        onPress={() => setPaymentMethod('momo-hubtel')}
      >
        <View style={styles.methodIconBg}>
          <Feather name="smartphone" size={22} color={colors.accentGreen} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>Mobile Money Direct (Hubtel / MTN / Telecel)</Text>
          <Text style={styles.methodSub}>Instant prompt on your phone across West Africa</Text>
        </View>
        <View style={[styles.radioCircle, paymentMethod === 'momo-hubtel' && styles.radioActive]} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, paymentMethod === 'paystack' && styles.methodCardActive]}
        onPress={() => setPaymentMethod('paystack')}
      >
        <View style={styles.methodIconBg}>
          <Feather name="credit-card" size={22} color={colors.accentIndigo} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>Paystack Multi-Currency Checkout</Text>
          <Text style={styles.methodSub}>Card, MoMo, Bank Transfer in GHS, NGN, XOF</Text>
        </View>
        <View style={[styles.radioCircle, paymentMethod === 'paystack' && styles.radioActive]} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleRequest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>
            Confirm &amp; Pay {studentCountry.flag} {studentCountry.currency} {calculatedLocalAmount} →
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
