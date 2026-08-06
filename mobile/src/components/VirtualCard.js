import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react me-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const VirtualCard = ({ cardData, studentName, byuId }) => {
  const [showDetails, setShowDetails] = useState(false);

  const cardNumber = cardData?.virtualCardNumber || '•••• •••• •••• ••••';
  const expiry = cardData?.cardExpiryDate || 'MM/YY';
  const cvv = cardData?.cardCVV || '•••';
  const cardholder = (cardData?.cardholderName || studentName || 'BYU STUDENT').toUpperCase();
  const status = cardData?.status || 'pending';

  const copyToClipboard = (text, label) => {
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  return (
    <LinearGradient
      colors={['#1e1b4b', '#312e81', '#4c1d95']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardContainer}
    >
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.chipContainer}>
          <View style={styles.chip} />
          <Feather name="wifi" size={18} color="#a78bfa" style={{ marginLeft: 8 }} />
        </View>
        <Text style={styles.visaLogo}>VISA</Text>
      </View>

      {/* Card Number */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => copyToClipboard(cardNumber, 'Card Number')}
        style={styles.numberRow}
      >
        <Text style={styles.cardNumber}>
          {showDetails || status === 'assigned' || status === 'paid' ? cardNumber : '•••• •••• •••• ••••'}
        </Text>
        <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
          <Feather name={showDetails ? 'eye-off' : 'eye'} size={18} color="#c4b5fd" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Card Footer Details */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.label}>CARDHOLDER</Text>
          <Text style={styles.value} numberOfLines={1}>{cardholder}</Text>
        </View>

        <View>
          <Text style={styles.label}>EXPIRES</Text>
          <Text style={styles.value}>{expiry}</Text>
        </View>

        <View>
          <Text style={styles.label}>CVV</Text>
          <Text style={styles.value}>{showDetails ? cvv : '•••'}</Text>
        </View>
      </View>

      {/* Status Overlay Pill */}
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, { backgroundColor: status === 'assigned' || status === 'paid' ? '#10b981' : '#f59e0b' }]} />
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    padding: 22,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    width: 38,
    height: 28,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d97706',
  },
  visaLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  cardNumber: {
    fontFamily: 'Platform',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2.5,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  label: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusPill: {
    position: 'absolute',
    top: 14,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default VirtualCard;
