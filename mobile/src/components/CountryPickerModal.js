import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors, WEST_AFRICA_COUNTRIES } from '../theme/colors';
import { Feather } from '@expo/vector-icons';

const CountryPickerModal = ({ visible, onClose, onSelect, selectedCountry }) => {
  const countries = Object.entries(WEST_AFRICA_COUNTRIES).map(([code, data]) => ({
    code,
    ...data,
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🌍 Select Country</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={countries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const isSelected = selectedCountry === item.code;
              return (
                <TouchableOpacity
                  style={[styles.countryItem, isSelected && styles.selectedItem]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.info}>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countrySub}>{item.currency} • {item.dialCode}</Text>
                  </View>
                  {isSelected && <Feather name="check" size={20} color={colors.accentGreen} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  selectedItem: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: colors.accentIndigo,
  },
  flag: {
    fontSize: 26,
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  countryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMain,
  },
  countrySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default CountryPickerModal;
