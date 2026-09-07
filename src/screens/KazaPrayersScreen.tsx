import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import {
  KAZA_PRAYER_LABELS,
  KAZA_PRAYER_ORDER,
  getKazaNamazTotal,
  loadKazaPrayerRecord,
  saveKazaPrayerRecord,
  type KazaPrayerCounts,
  type KazaPrayerId,
} from '../services/kazaPrayerStorage';
import { colors } from '../theme/colors';

const PRAYER_ICONS: Record<KazaPrayerId, keyof typeof Ionicons.glyphMap> = {
  sabah: 'sunny-outline',
  ogle: 'sunny',
  ikindi: 'partly-sunny-outline',
  aksam: 'moon-outline',
  yatsi: 'moon',
  vitir: 'star-outline',
  oruc: 'restaurant-outline',
};

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return 'Henüz kayıt yok';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Henüz kayıt yok';
  return date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function KazaPrayersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [counts, setCounts] = useState<KazaPrayerCounts | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bulkPrayerId, setBulkPrayerId] = useState<KazaPrayerId | null>(null);
  const [bulkValue, setBulkValue] = useState('');

  const persistCounts = useCallback(async (nextCounts: KazaPrayerCounts) => {
    const nextUpdatedAt = new Date().toISOString();
    setCounts(nextCounts);
    setUpdatedAt(nextUpdatedAt);
    await saveKazaPrayerRecord({ counts: nextCounts, updatedAt: nextUpdatedAt });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const record = await loadKazaPrayerRecord();
      if (cancelled) return;
      setCounts(record.counts);
      setUpdatedAt(record.updatedAt);
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const adjustCount = useCallback(
    async (id: KazaPrayerId, delta: number) => {
      if (!counts) return;
      const next = {
        ...counts,
        [id]: Math.max(0, counts[id] + delta),
      };
      await persistCounts(next);
    },
    [counts, persistCounts],
  );

  const openBulkEntry = useCallback(
    (id: KazaPrayerId) => {
      setBulkPrayerId(id);
      setBulkValue(String(counts?.[id] ?? 0));
    },
    [counts],
  );

  const closeBulkEntry = useCallback(() => {
    setBulkPrayerId(null);
    setBulkValue('');
  }, []);

  const saveBulkEntry = useCallback(async () => {
    if (!counts || !bulkPrayerId) return;
    const parsed = Number.parseInt(bulkValue, 10);
    const safeValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const next = { ...counts, [bulkPrayerId]: safeValue };
    await persistCounts(next);
    closeBulkEntry();
  }, [bulkPrayerId, bulkValue, closeBulkEntry, counts, persistCounts]);

  const namazTotal = counts ? getKazaNamazTotal(counts) : 0;
  const orucTotal = counts?.oruc ?? 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Kazalar</Text>
          <Text style={styles.headerSubtitle}>
            {isLoading
              ? 'Yükleniyor...'
              : `Namaz kazası: ${namazTotal} · Oruç: ${orucTotal}`}
          </Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      {isLoading || !counts ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.bar} />
        </View>
      ) : (
        <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.card}>
            {KAZA_PRAYER_ORDER.map((id, index) => (
              <View
                key={id}
                style={[styles.row, index < KAZA_PRAYER_ORDER.length - 1 && styles.rowBorder]}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={PRAYER_ICONS[id]} size={18} color={colors.gold} />
                  </View>
                  <Text style={styles.rowLabel}>{KAZA_PRAYER_LABELS[id]}</Text>
                </View>

                <Pressable style={styles.countButton} onPress={() => openBulkEntry(id)}>
                  <Text style={styles.countValue}>{counts[id]}</Text>
                </Pressable>

                <View style={styles.stepper}>
                  <Pressable
                    style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
                    onPress={() => void adjustCount(id, -1)}
                    accessibilityLabel={`${KAZA_PRAYER_LABELS[id]} azalt`}
                  >
                    <Text style={styles.stepButtonText}>−</Text>
                  </Pressable>
                  <View style={styles.stepDivider} />
                  <Pressable
                    style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
                    onPress={() => void adjustCount(id, 1)}
                    accessibilityLabel={`${KAZA_PRAYER_LABELS[id]} artır`}
                  >
                    <Text style={styles.stepButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.hint}>
            Toplu kaza girişi için rakamların üzerine dokunun.
          </Text>
          <Text style={styles.updatedAt}>Son kayıt: {formatUpdatedAt(updatedAt)}</Text>
          <Text style={styles.disclaimer}>
            Bu ekran kişisel takip içindir; kaza hesabı için bir din görevlisine danışmanız önerilir.
          </Text>
        </View>
      )}

      <Modal visible={bulkPrayerId != null} transparent animationType="fade" onRequestClose={closeBulkEntry}>
        <Pressable style={styles.modalBackdrop} onPress={closeBulkEntry}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {bulkPrayerId ? KAZA_PRAYER_LABELS[bulkPrayerId] : ''} kaza sayısı
            </Text>
            <TextInput
              value={bulkValue}
              onChangeText={setBulkValue}
              keyboardType="number-pad"
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor="rgba(2, 23, 52, 0.42)"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={closeBulkEntry}>
                <Text style={styles.modalSecondaryText}>İptal</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={() => void saveBulkEntry()}>
                <Text style={styles.modalPrimaryText}>Kaydet</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.cream,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(245, 240, 230, 0.12)',
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
  },
  countButton: {
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.cream,
  },
  countValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textOnLight,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.25)',
    overflow: 'hidden',
  },
  stepButton: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 240, 230, 0.08)',
  },
  stepButtonPressed: {
    opacity: 0.8,
  },
  stepButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.cream,
    lineHeight: 22,
  },
  stepDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: 'rgba(245, 240, 230, 0.2)',
  },
  hint: {
    marginTop: 14,
    fontSize: 13,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
  updatedAt: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMutedOnLight,
    textAlign: 'center',
    opacity: 0.85,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 23, 52, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnLight,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMutedOnLight,
  },
  modalPrimary: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.bar,
  },
});
