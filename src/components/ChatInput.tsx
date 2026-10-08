import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '../context/SubscriptionContext';
import { colors } from '../theme/colors';

const MAX_MESSAGE_LENGTH = 100;

interface ChatInputProps {
  onSend: (text: string) => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const { quota } = useSubscription();
  const canSend = text.trim().length > 0 && !disabled;
  const remaining = MAX_MESSAGE_LENGTH - text.length;
  // Android: softwareKeyboardLayoutMode=resize — alt boşluk klavye açıkken gerekmez.
  const paddingBottom =
    Platform.OS === 'android'
      ? 8
      : quota?.premium
        ? Math.max(insets.bottom, 8)
        : 8;

  const handleSend = async () => {
    if (!canSend) return;
    const message = text;
    setText('');
    const result = await onSend(message);
    if (result === false) {
      setText(message);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom }]}>
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={disabled ? 'Yanıt bekleniyor...' : 'Mesaj'}
            placeholderTextColor={colors.creamMuted}
            editable={!disabled}
            maxLength={MAX_MESSAGE_LENGTH}
            returnKeyType="send"
            submitBehavior="submit"
            blurOnSubmit
            onSubmitEditing={() => {
              void handleSend();
            }}
            enablesReturnKeyAutomatically
          />
          <Text style={[styles.counter, remaining <= 10 && styles.counterWarning]}>
            {text.length}/{MAX_MESSAGE_LENGTH}
          </Text>
        </View>
        <Pressable
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={() => {
            void handleSend();
          }}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Gönder"
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? colors.bar : colors.creamMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.barBorder,
    backgroundColor: colors.bar,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.inputField,
    position: 'relative',
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 52,
    fontSize: 16,
    color: colors.cream,
  },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    fontSize: 11,
    color: colors.creamMuted,
  },
  counterWarning: {
    color: colors.warning,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.send,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.sendMuted,
  },
});
