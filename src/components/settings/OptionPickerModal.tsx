import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

interface OptionPickerModalProps {
  visible: boolean;
  title: string;
  options: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
  /** false ise seçimde kapanmaz (ör. ses önizleme için). Varsayılan true. */
  closeOnSelect?: boolean;
}

export default function OptionPickerModal({
  visible,
  title,
  options,
  selectedIndex,
  onSelect,
  onClose,
  closeOnSelect = true,
}: OptionPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView bounces={false}>
            {options.map((option, index) => {
              const selected = index === selectedIndex;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(index);
                    if (closeOnSelect) onClose();
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface MinutesPickerModalProps {
  visible: boolean;
  title: string;
  options: readonly number[];
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  onClose: () => void;
}

export function MinutesPickerModal({
  visible,
  title,
  options,
  selectedMinutes,
  onSelect,
  onClose,
}: MinutesPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView bounces={false}>
            {options.map((minutes) => {
              const selected = minutes === selectedMinutes;
              return (
                <Pressable
                  key={minutes}
                  onPress={() => {
                    onSelect(minutes);
                    onClose();
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {minutes} Dakika
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '55%',
    backgroundColor: colors.drawer,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionSelected: {
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  optionText: {
    fontSize: 15,
    color: colors.creamMuted,
  },
  optionTextSelected: {
    color: colors.gold,
    fontWeight: '700',
  },
});
