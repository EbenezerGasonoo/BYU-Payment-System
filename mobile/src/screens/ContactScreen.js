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
  const [subject, setSubject] = useState('card-request');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { key: 'card-request', label: '💳 Virtual Card' },
    { key: 'payment', label: '💰 Payment / MoMo' },
    { key: 'registration', label: '📝 Registration' },
    { key: 'technical', label: '⚙️ Bug / Portal' },
    { key: 'urgent', label: '🚨 Deadline Help' },
    { key: 'general', label: '❓ General' },
  ];

  const handleOpenWhatsApp = () => {
    const whatsappUrl = 'https://wa.me/233543692272?text=Hello%20ConnectPay%20Support%2C%20I%20need%20assistance%20with%20my%20BYU%20Virtual%20Card.';
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    });
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:+233543692272').catch(() => {
      Alert.alert('Error', 'Unable to make phone call.');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:iamknightrae@gmail.com?subject=BYU%20Pathway%20Support%20Request').catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your message or question.');
      return;
    }
    if (email.trim() && !email.toLowerCase().endsWith('@byupathway.edu')) {
      Alert.alert('Pathway Email', 'Please use your @byupathway.edu student email.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color={colors.textMain} />
      </TouchableOpacity>

      <Text style={styles.badge}>CONNECTPAY SUPPORT • GHANA</Text>
      <Text style={styles.title}>Contact &amp; Help Desk 💬</Text>
      <Text style={styles.subtitle}>Fast, dedicated support for your BYU Pathway virtual cards and tuition payments.</Text>

      {/* Quick Direct Actions */}
      <View style={styles.quickChannelsContainer}>
        {/* WhatsApp Banner */}
        <TouchableOpacity style={styles.channelCardWhatsApp} onPress={handleOpenWhatsApp}>
          <View style={styles.channelIconBgWhatsApp}>
            <Feather name="message-circle" size={22} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.channelTitle}>Chat on WhatsApp</Text>
            <Text style={styles.channelSub}>Instant 24/7 student support desk (+233 54 369 2272)</Text>
          </View>
          <Feather name="external-link" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Call & Email row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.miniActionCard} onPress={handlePhoneCall}>
            <Feather name="phone-call" size={18} color="#002E5D" />
            <Text style={styles.miniActionText}>Call Desk</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniActionCard} onPress={handleEmail}>
            <Feather name="mail" size={18} color="#002E5D" />
            <Text style={styles.miniActionText}>Email Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {submitted ? (
        <View style={styles.successBox}>
          <Feather name="check-circle" size={48} color={colors.accentGreen} />
          <Text style={styles.successTitle}>Ticket Logged!</Text>
          <Text style={styles.successSub}>Our Ghana support representative will follow up via your registered email shortly.</Text>
          
          <TouchableOpacity
            style={styles.whatsAppFollowBtn}
            onPress={handleOpenWhatsApp}
          >
            <Text style={styles.whatsAppFollowBtnText}>💬 Follow up on WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setSubmitted(false);
              setMessage('');
            }}
          >
            <Text style={styles.resetBtnText}>Send Another Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Submit Support Ticket</Text>

          {/* Category Chips */}
          <Text style={styles.label}>Select Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  subject === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => setSubject(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    subject === cat.key && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Student Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pathway Email (@byupathway.edu)</Text>
            <TextInput
              style={styles.input}
              placeholder="yourname@byupathway.edu"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue, transaction reference, or question..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Support Ticket →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Support Hours Card */}
      <View style={styles.hoursCard}>
        <View style={styles.hoursHeader}>
          <Feather name="clock" size={16} color="#002E5D" />
          <Text style={styles.hoursTitle}>Operating Hours (Ghana GMT)</Text>
        </View>
        <Text style={styles.hoursText}>Mon – Fri: 9:00 AM – 5:00 PM GMT</Text>
        <Text style={styles.hoursTextSub}>Weekends: Emergency &amp; automated ticket queue</Text>
      </View>

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
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002E5D',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
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
  quickChannelsContainer: {
    marginBottom: 24,
    gap: 10,
  },
  channelCardWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  channelIconBgWhatsApp: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  channelSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
  },
  miniActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002E5D',
  },
  form: {
    gap: 14,
    backgroundColor: colors.cardBg,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  categoryChipActive: {
    backgroundColor: '#002E5D',
    borderColor: '#002E5D',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMain,
  },
  categoryChipTextActive: {
    color: '#ffffff',
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
    height: 48,
    color: colors.textMain,
    fontSize: 14,
  },
  textArea: {
    height: 110,
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: '#002E5D',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  successBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 24,
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
  whatsAppFollowBtn: {
    backgroundColor: '#25d366',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  whatsAppFollowBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetBtn: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resetBtnText: {
    color: colors.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  hoursCard: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 46, 93, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 46, 93, 0.1)',
    borderRadius: 14,
    padding: 14,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hoursTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002E5D',
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMain,
  },
  hoursTextSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default ContactScreen;
