import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Pressable as GHPressable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeBottomNav, { HOME_BOTTOM_NAV_CONTENT_PAD } from '../components/HomeBottomNav';
import TesbihProgressRing from '../components/TesbihProgressRing';
import { useHomeTabNavigation } from '../hooks/useHomeTabNavigation';
import { colors } from '../theme/colors';

type PresetTarget = 33 | 99 | 100 | 'infinite';

const PRESETS: { id: PresetTarget; label: string }[] = [
  { id: 33, label: '33' },
  { id: 99, label: '99' },
  { id: 100, label: '100' },
  { id: 'infinite', label: '∞' },
];

const RING_SIZE = 248;
const RING_STROKE = 12;
const BUTTON_SIZE = 200;

export default function TesbihScreen() {
  const insets = useSafeAreaInsets();
  const handleTabPress = useHomeTabNavigation();
  const customInputRef = useRef<TextInput>(null);

  const [count, setCount] = useState(0);
  const [lapCount, setLapCount] = useState(0);
  const [preset, setPreset] = useState<PresetTarget>(33);
  const [customInput, setCustomInput] = useState('50');
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  const [useCustomTarget, setUseCustomTarget] = useState(false);

  const target = useCustomTarget && customTarget ? customTarget : preset === 'infinite' ? null : preset;

  const progress = target ? count / target : 0;

  const dismissKeyboard = useCallback(() => {
    customInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const handleIncrement = useCallback(() => {
    dismissKeyboard();
    if (target !== null) {
      if (count + 1 >= target) {
        setCount(0);
        setLapCount((laps) => laps + 1);
      } else {
        setCount(count + 1);
      }
      return;
    }
    setCount((prev) => prev + 1);
  }, [count, dismissKeyboard, target]);

  const handleUndo = useCallback(() => {
    if (target !== null) {
      if (count > 0) {
        setCount(count - 1);
      } else if (lapCount > 0) {
        setLapCount(lapCount - 1);
        setCount(target - 1);
      }
      return;
    }
    setCount((prev) => Math.max(prev - 1, 0));
  }, [count, lapCount, target]);

  const handleReset = useCallback(() => {
    setCount(0);
    setLapCount(0);
  }, []);

  const handlePresetSelect = (value: PresetTarget) => {
    dismissKeyboard();
    setUseCustomTarget(false);
    setPreset(value);
    setCount(0);
    setLapCount(0);
  };

  const handleApplyCustom = () => {
    dismissKeyboard();
    const parsed = Number.parseInt(customInput, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }
    setCustomTarget(parsed);
    setUseCustomTarget(true);
    setCount(0);
    setLapCount(0);
  };

  const toggleCustomLock = () => {
    dismissKeyboard();
    if (useCustomTarget) {
      setUseCustomTarget(false);
      return;
    }
    handleApplyCustom();
  };

  const targetLabel = target ?? '∞';

  const remainingText =
    target === null
      ? 'Sınırsız sayım'
      : `${Math.max(target - count, 0)} zikir kaldı`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Tesbih</Text>
      </View>

      <View
        style={[
          styles.content,
          {
            paddingBottom: HOME_BOTTOM_NAV_CONTENT_PAD,
          },
        ]}
      >
        <View style={styles.presetRow}>
          {PRESETS.map((item) => {
            const isActive = !useCustomTarget && preset === item.id;
            return (
              <Pressable
                key={item.label}
                style={[styles.presetChip, isActive && styles.presetChipActive]}
                onPress={() => handlePresetSelect(item.id)}
              >
                <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.customRow}>
          <Pressable style={styles.lockButton} onPress={toggleCustomLock}>
            <Ionicons
              name={useCustomTarget ? 'lock-closed' : 'lock-open-outline'}
              size={18}
              color={useCustomTarget ? colors.gold : colors.creamMuted}
            />
          </Pressable>
          <TextInput
            ref={customInputRef}
            style={styles.customInput}
            value={customInput}
            onChangeText={setCustomInput}
            keyboardType="number-pad"
            placeholder="Özel"
            placeholderTextColor={colors.creamMuted}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={handleApplyCustom}
          />
          <Pressable style={styles.applyButton} onPress={handleApplyCustom}>
            <Text style={styles.applyText}>Ayarla</Text>
          </Pressable>
        </View>

        <View style={styles.counterSection}>
          {lapCount > 0 ? (
            <Text style={styles.lapText}>{lapCount}</Text>
          ) : null}

          <View style={styles.ringContainer}>
            <TesbihProgressRing
              size={RING_SIZE}
              strokeWidth={RING_STROKE}
              progress={progress}
            />
            <GHPressable
              style={styles.counterButton}
              onPress={handleIncrement}
              accessibilityLabel="Zikir say"
            >
              <Text style={styles.countText}>{count}</Text>
              <Text style={styles.targetText}>/ {targetLabel}</Text>
            </GHPressable>
          </View>

          <Text style={styles.remainingText}>{remainingText}</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={handleUndo}>
            <Ionicons name="arrow-undo-outline" size={20} color={colors.cream} />
            <Text style={styles.actionText}>Geri Al</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={20} color={colors.cream} />
            <Text style={styles.actionText}>Sıfırla</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomNavWrap}>
        <HomeBottomNav activeTab="tesbih" onTabPress={handleTabPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.cream,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.inputField,
    borderWidth: 1,
    borderColor: colors.barBorder,
  },
  presetChipActive: {
    backgroundColor: colors.goldMuted,
    borderColor: colors.gold,
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.creamMuted,
  },
  presetTextActive: {
    color: colors.cream,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  lockButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputField,
    borderWidth: 1,
    borderColor: colors.barBorder,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.inputField,
    borderWidth: 1,
    borderColor: colors.barBorder,
    color: colors.cream,
    fontSize: 15,
  },
  applyButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputField,
    borderWidth: 1,
    borderColor: colors.barBorder,
  },
  applyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
  },
  counterSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lapText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 12,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.inputField,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.barBorder,
  },
  countText: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.cream,
    lineHeight: 62,
  },
  targetText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.creamMuted,
    marginTop: 2,
  },
  remainingText: {
    marginTop: 20,
    fontSize: 15,
    color: colors.textMutedOnLight,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.inputField,
    borderWidth: 1,
    borderColor: colors.barBorder,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.cream,
  },
  bottomNavWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
