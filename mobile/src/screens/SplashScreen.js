import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={['#0b0c16', '#101120', '#1a1b2e']} style={styles.container}>
      <View style={styles.logoPill}>
        <Text style={styles.logoIcon}>⚡</Text>
      </View>
      <Text style={styles.title}>ConnectPay</Text>
      <Text style={styles.subtitle}>West Africa Virtual Card Platform</Text>

      <View style={styles.flagStrip}>
        <Text style={styles.flag}>🇬🇭</Text>
        <Text style={styles.flag}>🇳🇬</Text>
        <Text style={styles.flag}>🇸🇳</Text>
        <Text style={styles.flag}>🇨🇮</Text>
        <Text style={styles.flag}>🇨🇲</Text>
        <Text style={styles.flag}>🇹🇬</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  logoPill: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentIndigo,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.accentPurple,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textMain,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  flagStrip: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 10,
  },
  flag: {
    fontSize: 22,
  },
});

export default SplashScreen;
