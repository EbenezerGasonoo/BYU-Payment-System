import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { studentAPI } from '../api/api';
import { colors } from '../theme/colors';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: request code, 2: verify & reset
  const [emailOrByuId, setEmailOrByuId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!emailOrByuId.trim()) {
      Alert.alert('Required', 'Please enter your Email or BYU Student ID.');
      return;
    }
    setLoading(true);
    try {
      const res = await studentAPI.forgotPassword(emailOrByuId.trim());
      if (res.success) {
        Alert.alert('Reset Code Sent 📩', res.message || 'Check your email for the 6-digit OTP code.');
        setStep(2);
      } else {
        Alert.alert('Error', res.message || 'Account not found.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim()) {
      Alert.alert('Required', 'Please enter the 6-digit OTP code and new password.');
      return;
    }
    setLoading(true);
    try {
      const res = await studentAPI.resetPassword({
        emailOrByuId: emailOrByuId.trim(),
        code: code.trim(),
        newPassword: newPassword.trim(),
      });
      if (res.success) {
        Alert.alert('Success 🎉', 'Your password has been reset successfully.', [
          { text: 'Log In Now', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Reset Failed', res.message || 'Invalid OTP code.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color={colors.textMain} />
      </TouchableOpacity>

      <Text style={styles.title}>Reset Password 🔑</Text>
      <Text style={styles.subtitle}>
        {step === 1
          ? 'Enter your BYU Student ID or registered email to receive a 6-digit OTP code.'
          : 'Enter the 6-digit OTP code sent to your email and your new password.'}
      </Text>

      {step === 1 ? (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>BYU Student ID or Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123456789 or name@byupathway.org"
              placeholderTextColor={colors.textMuted}
              value={emailOrByuId}
              onChangeText={setEmailOrByuId}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRequestCode}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Reset OTP →</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>6-Digit OTP Code</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 4, fontWeight: 'bold', fontSize: 18 }]}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password..."
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Reset Password →</Text>}
          </TouchableOpacity>
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
    lineHeight: 20,
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
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
    height: 52,
    color: colors.textMain,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: colors.accentIndigo,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
