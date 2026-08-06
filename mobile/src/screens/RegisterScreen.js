import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { studentAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { colors, WEST_AFRICA_COUNTRIES } from '../theme/colors';
import CountryPickerModal from '../components/CountryPickerModal';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    byuId: '',
    email: '',
    phone: '',
    password: '',
    countryCode: 'GH',
    whatsappNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const { setDirectUser } = useAuth();

  const selectedCountry = WEST_AFRICA_COUNTRIES[form.countryCode] || WEST_AFRICA_COUNTRIES.GH;

  const handleRegister = async () => {
    if (!form.name || !form.byuId || !form.email || !form.phone || !form.password) {
      Alert.alert('Missing Fields', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.register({
        ...form,
        preferredCurrency: selectedCountry.currency,
      });

      if (res.success) {
        Alert.alert('Registration Successful 🎉', 'Welcome to ConnectPay!');
        if (res.student) {
          await setDirectUser(res.student);
        }
      } else {
        Alert.alert('Registration Failed', res.message || 'Error creating account.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.textMain} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account ✨</Text>
        <Text style={styles.subtitle}>ConnectPay for West Africa BYU Students</Text>

        <View style={styles.form}>
          {/* Country Selector */}
          <TouchableOpacity
            style={styles.countryBtn}
            onPress={() => setCountryModalVisible(true)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.countryName}>{selectedCountry.name}</Text>
              <Text style={styles.countrySub}>Currency: {selectedCountry.currency}</Text>
            </View>
            <Feather name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kwame Mensah"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(txt) => setForm({ ...form, name: txt })}
            />
          </View>

          {/* BYU ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>BYU Student ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123456789"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={form.byuId}
              onChangeText={(txt) => setForm({ ...form, byuId: txt })}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pathway Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="name@byupathway.org"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(txt) => setForm({ ...form, email: txt })}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number ({selectedCountry.dialCode}) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 240000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(txt) => setForm({ ...form, phone: txt })}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                placeholder="Create password..."
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(txt) => setForm({ ...form, password: txt })}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account →</Text>
            )}
          </TouchableOpacity>
        </View>

        <CountryPickerModal
          visible={countryModalVisible}
          onClose={() => setCountryModalVisible(false)}
          selectedCountry={form.countryCode}
          onSelect={(code) => setForm({ ...form, countryCode: code })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 28,
  },
  form: {
    gap: 16,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.accentIndigo,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  countryFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  countryName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMain,
  },
  countrySub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMain,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    color: colors.textMain,
    fontSize: 15,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingRight: 14,
  },
  submitBtn: {
    backgroundColor: colors.accentIndigo,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
