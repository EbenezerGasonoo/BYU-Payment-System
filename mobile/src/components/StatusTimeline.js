import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const StatusTimeline = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Requested', icon: 'file-text' },
    { key: 'assigned', label: 'Issued', icon: 'credit-card' },
    { key: 'paid', label: 'Paid', icon: 'check-circle' },
  ];

  const getStepStatus = (stepKey) => {
    if (status === 'paid') return 'completed';
    if (status === 'assigned') {
      if (stepKey === 'pending' || stepKey === 'assigned') return 'completed';
      return 'upcoming';
    }
    if (status === 'pending') {
      if (stepKey === 'pending') return 'active';
      return 'upcoming';
    }
    if (status === 'expired' || status === 'declined') {
      return 'failed';
    }
    return 'upcoming';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Card Processing Lifecycle</Text>
      <View style={styles.stepsRow}>
        {steps.map((step, idx) => {
          const st = getStepStatus(step.key);
          const isCompleted = st === 'completed';
          const isActive = st === 'active';

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.iconCircle,
                    isCompleted && styles.iconCompleted,
                    isActive && styles.iconActive,
                  ]}
                >
                  <Feather
                    name={step.icon}
                    size={16}
                    color={isCompleted || isActive ? '#fff' : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isCompleted || isActive) && styles.labelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.lineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginVertical: 10,
  },
  title: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCompleted: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  iconActive: {
    backgroundColor: colors.accentIndigo,
    borderColor: colors.accentPurple,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.textMain,
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  lineCompleted: {
    backgroundColor: colors.accentGreen,
  },
});

export default StatusTimeline;
