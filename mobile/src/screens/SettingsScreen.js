import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, WEST_AFRICA_COUNTRIES } from '../theme/colors';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const studentCountry = WEST_AFRICA_COUNTRIES[user?.countryCode] || WEST_AFRICA_COUNTRIES.GH;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of ConnectPay?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account &amp; Settings ⚙️</Text>

      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'BYU Student'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.byuPill}>
            <Text style={styles.byuText}>BYU ID: {user?.byuId}</Text>
          </View>
        </View>
      </View>

      {/* Account Info Section */}
      <Text style={styles.sectionHeader}>Regional Profile</Text>
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.flagIcon}>{studentCountry.flag}</Text>
            <View>
              <Text style={styles.itemTitle}>Country</Text>
              <Text style={styles.itemSub}>{studentCountry.name} ({studentCountry.currency})</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.itemLeft}>
            <Feather name="phone" size={20} color={colors.accentPurple} />
            <View>
              <Text style={styles.itemTitle}>Phone Number</Text>
              <Text style={styles.itemSub}>{user?.phone || 'Not provided'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Security & Preferences */}
      <Text style={styles.sectionHeader}>Security &amp; App</Text>
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <View style={styles.itemLeft}>
            <Feather name="shield" size={20} color={colors.accentGreen} />
            <Text style={styles.itemTitle}>Biometric Lock (FaceID / Fingerprint)</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: colors.cardBorder, true: colors.accentIndigo }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.itemLeft}>
            <Feather name="bell" size={20} color={colors.accentYellow} />
            <Text style={styles.itemTitle}>SMS / Push Notifications</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.cardBorder, true: colors.accentIndigo }}
          />
        </View>
      </View>

      {/* Support & Links */}
      <Text style={styles.sectionHeader}>Help &amp; Support</Text>
      <View style={styles.settingsGroup}>
        <TouchableOpacity
          style={styles.settingItemBtn}
          onPress={() => navigation.navigate('FAQ')}
        >
          <View style={styles.itemLeft}>
            <Feather name="help-circle" size={20} color={colors.accentBlue} />
            <Text style={styles.itemTitle}>Frequently Asked Questions</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItemBtn}
          onPress={() => navigation.navigate('Contact')}
        >
          <View style={styles.itemLeft}>
            <Feather name="message-square" size={20} color={colors.accentPink} />
            <Text style={styles.itemTitle}>Contact Support &amp; WhatsApp</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>ConnectPay Mobile v1.0.0 • West Africa Edition</Text>
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
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 24,
    gap: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accentIndigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  byuPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  byuText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentPurple,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 10,
  },
  settingsGroup: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBg,
  },
  settingItemBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBg,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  flagIcon: {
    fontSize: 22,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  signOutText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: colors.textSub,
    fontSize: 11,
    marginBottom: 30,
  },
});

export default SettingsScreen;
