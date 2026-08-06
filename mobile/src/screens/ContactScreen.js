import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const ContactScreen = ({ navigation }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleOpenWhatsApp = () => {
    const whatsappUrl = 'https://wa.me/233240000000?text=Hello%20ConnectPay%20Support%2C%20I%20need%20assistance%20with%20my%20BYU%20Virtual%20Card.';
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    });
  };

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in both subject and message.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color={colors.textMain} />
      </TouchableOpacity>

      <Text style={styles.title}>Contact &amp; Live Chat 💬</Text>
      <Text style={styles.subtitle}>Get fast support from our West Africa ConnectPay team.</Text>

      {/* WhatsApp Banner */}
      <TouchableOpacity style={styles.whatsappCard} onPress={handleOpenWhatsApp}>
        <View style={styles.waIconBg}>
          <Feather name="message-circle" size={24} color="#10b981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.waTitle}>Chat on WhatsApp</Text>
          <Text style={styles.waSub}>Instant 24/7 student support representative</Text>
        </View>
        <Feather name="external-link" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {submitted ? (
        <View style={styles.successBox}>
          <Feather name="check-circle" size={48} color={colors.accentGreen} />
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successSub}>Our support team will respond to your registered email shortly.</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setSubmitted(false);
              setSubject('');
              setMessage('');
            }}
          >
            <Text style={styles.resetBtnText}>Send Another Message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Send Support Ticket</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Card Payment Delay"
              placeholderTextColor={colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Ticket →</Text>
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
    padding: 20,
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
  whatsappCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  waIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  waSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  form: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
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
  textArea: {
    height: 120,
    paddingTop: 12,
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
  successBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textMain,
    marginTop: 14,
  },
  successSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  resetBtn: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resetBtnText: {
    color: colors.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ContactScreen;
