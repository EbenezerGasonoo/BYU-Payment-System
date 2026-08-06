import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const faqs = [
  {
    q: 'How does ConnectPay virtual card work for BYU Pathway?',
    a: 'ConnectPay issues a Visa Virtual Card funded in USD. You can use this card directly on the BYU Pathway portal to pay your tuition and course fees.',
  },
  {
    q: 'Which payment methods are supported in West Africa?',
    a: 'We support Mobile Money (MTN MoMo, Telecel, AirtelTigo), Paystack, Direct Debit, and bank transfers across Ghana, Nigeria, Senegal, Ivory Coast, Cameroon, Togo, Benin, Sierra Leone, Liberia, and Gambia.',
  },
  {
    q: 'How long does card generation take?',
    a: 'Cards are generated almost instantly once payment verification is completed. Usually between 2 to 10 minutes.',
  },
  {
    q: 'Can I use this card for other websites?',
    a: 'The virtual cards are optimized for BYU Pathway portal and academic fee payments.',
  },
  {
    q: 'What should I do if my card fails or expires?',
    a: 'Each assigned card stays active for 5 hours to allow you to complete your tuition payment safely. If it expires, you can generate a replacement or contact support.',
  },
];

const FAQScreen = ({ navigation }) => {
  const [openIdx, setOpenIdx] = useState(null);

  const toggleIdx = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color={colors.textMain} />
      </TouchableOpacity>

      <Text style={styles.title}>Frequently Asked Questions ❓</Text>
      <Text style={styles.subtitle}>Everything you need to know about BYU Pathway Virtual Cards.</Text>

      <View style={styles.faqList}>
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.faqCard, isOpen && styles.faqCardOpen]}
              onPress={() => toggleIdx(idx)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Feather
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.accentPurple}
                />
              </View>
              {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
            </TouchableOpacity>
          );
        })}
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
    marginBottom: 24,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  faqCardOpen: {
    borderColor: colors.accentIndigo,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textMain,
    lineHeight: 20,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
});

export default FAQScreen;
