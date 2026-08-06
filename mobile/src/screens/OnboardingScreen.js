import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const OnboardingScreen = ({ navigation }) => {
  return (
    <LinearGradient colors={['#0b0c16', '#151628']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BYU PATHWAY WEST AFRICA</Text>
        </View>

        <Text style={styles.headline}>
          Virtual USD Cards for BYU Students Across West Africa 💳
        </Text>

        <Text style={styles.body}>
          Pay your BYU tuition and course fees easily using Mobile Money, Mobile Banking, and local currencies across Ghana, Nigeria, Senegal &amp; 7+ countries.
        </Text>

        <View style={styles.featureBox}>
          <Text style={styles.featureItem}>⚡ Instant Card Generation</Text>
          <Text style={styles.featureItem}>🔒 Bank-Grade Security &amp; Encryption</Text>
          <Text style={styles.featureItem}>📱 Mobile Money (MTN, Telecel, AirtelTigo, MoMo)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryBtnText}>Sign In with BYU ID →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryBtnText}>Create New Account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    marginTop: 60,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: colors.accentPurple,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: colors.accentPurple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    lineHeight: 36,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 28,
  },
  featureBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  featureItem: {
    color: colors.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginBottom: 20,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.accentIndigo,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.accentIndigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: colors.inputBg,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryBtnText: {
    color: colors.textMain,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
