import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OptionPickerModal, {
  MinutesPickerModal,
} from '../../components/settings/OptionPickerModal';
import { PRAYER_BANNERS, type PrayerBannerId } from '../../components/prayer-banners/shared';
import {
  clampMelodyIndex,
  NOTIFICATION_MELODIES,
} from '../../constants/notificationSounds';
import { TURKISH_CITIES, type TurkishCity } from '../../constants/turkishCities';
import { useLocationContext } from '../../context/LocationContext';
import type { RootStackParamList } from '../../navigation/types';
import { markOnboardingComplete } from '../../services/onboardingStorage';
import {
  BEFORE_MINUTES_OPTIONS,
  createDefaultPrayerNotificationSettings,
  saveAllPrayerNotificationSettings,
} from '../../services/notificationSettingsStorage';
import {
  previewNotificationSound,
  stopNotificationSoundPreview,
} from '../../services/notificationSoundPreview';
import { ensureNotificationPermissions } from '../../services/prayerNotificationScheduler';
import type { AllPrayerNotificationSettings } from '../../types/notificationSettings';
import { colors } from '../../theme/colors';

type Step = 'location' | 'notifications';
type SoundPickerTarget = 'atTime' | 'before';

type PrayerToggleState = Record<
  PrayerBannerId,
  { atTime: boolean; before: boolean }
>;

const ACCENT = '#1FA8A0';
/** NOTIFICATION_SOUND_OPTIONS: 1 = Ezan, 0 = telefon varsayılanı */
const DEFAULT_AT_TIME_MELODY_INDEX = 1;
const DEFAULT_BEFORE_MELODY_INDEX = 0;
const DEFAULT_BEFORE_MINUTES = 15;

function createInitialToggles(): PrayerToggleState {
  // Varsayılan: vaktinde açık (Güneş hariç); öncesi kapalı — kullanıcı isterse açar.
  return PRAYER_BANNERS.reduce((acc, banner) => {
    acc[banner.id] = {
      atTime: banner.id !== 'gunes',
      before: false,
    };
    return acc;
  }, {} as PrayerToggleState);
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    locationLabel,
    latitude,
    longitude,
    selectManualCity,
    refreshCurrentLocation,
    isUpdatingLocation,
  } = useLocationContext();

  const [step, setStep] = useState<Step>('location');
  const [query, setQuery] = useState('');
  const [toggles, setToggles] = useState<PrayerToggleState>(createInitialToggles);
  const [atTimeMelodyIndex, setAtTimeMelodyIndex] = useState(DEFAULT_AT_TIME_MELODY_INDEX);
  const [beforeMelodyIndex, setBeforeMelodyIndex] = useState(DEFAULT_BEFORE_MELODY_INDEX);
  const [beforeMinutes, setBeforeMinutes] = useState(DEFAULT_BEFORE_MINUTES);
  const [soundPickerTarget, setSoundPickerTarget] = useState<SoundPickerTarget | null>(null);
  const [minutesPickerOpen, setMinutesPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'notifications') {
        setStep('location');
        return true;
      }
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const filteredCities = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    if (!normalized) return TURKISH_CITIES;
    return TURKISH_CITIES.filter((city) =>
      city.name.toLocaleLowerCase('tr-TR').includes(normalized),
    );
  }, [query]);

  const hasLocation = Boolean(locationLabel || (latitude != null && longitude != null));

  const isSelected = useCallback(
    (city: TurkishCity) =>
      latitude != null &&
      longitude != null &&
      Math.abs(latitude - city.latitude) < 0.02 &&
      Math.abs(longitude - city.longitude) < 0.02,
    [latitude, longitude],
  );

  const setToggle = (id: PrayerBannerId, key: 'atTime' | 'before', value: boolean) => {
    setToggles((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const atMelody = clampMelodyIndex(atTimeMelodyIndex);
      const beforeMelody = clampMelodyIndex(beforeMelodyIndex);
      const minutesBefore = BEFORE_MINUTES_OPTIONS.includes(
        beforeMinutes as (typeof BEFORE_MINUTES_OPTIONS)[number],
      )
        ? beforeMinutes
        : DEFAULT_BEFORE_MINUTES;

      const all = PRAYER_BANNERS.reduce((acc, banner) => {
        const base = createDefaultPrayerNotificationSettings(banner.id);
        const t = toggles[banner.id];
        const atTimeEnabled = banner.id === 'gunes' ? false : t.atTime;
        acc[banner.id] = {
          ...base,
          atTime: { ...base.atTime, enabled: atTimeEnabled, melodyIndex: atMelody },
          before: {
            ...base.before,
            enabled: t.before,
            melodyIndex: beforeMelody,
            minutesBefore,
          },
        };
        return acc;
      }, {} as AllPrayerNotificationSettings);

      await stopNotificationSoundPreview();
      await saveAllPrayerNotificationSettings(all);
      await ensureNotificationPermissions();
      await markOnboardingComplete();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } finally {
      setSaving(false);
    }
  };

  if (step === 'location') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.brand}>e-İslam</Text>
          <Text style={styles.title}>Konumun</Text>
          <Text style={styles.subtitle}>Ezan vakitleri konumuna göre hesaplanır.</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.currentLabel}>Seçili konum</Text>
          <Text style={styles.currentValue}>{locationLabel ?? 'Henüz seçilmedi'}</Text>

          <Pressable
            style={styles.gpsButton}
            onPress={() => void refreshCurrentLocation()}
            disabled={isUpdatingLocation}
          >
            {isUpdatingLocation ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Ionicons name="navigate-outline" size={18} color={colors.gold} />
            )}
            <Text style={styles.gpsButtonText}>Mevcut konumu kullan</Text>
          </Pressable>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Şehir ara..."
            placeholderTextColor={colors.creamMuted}
            style={styles.searchInput}
            autoCorrect={false}
          />

          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }) => {
              const selected = isSelected(item);
              return (
                <Pressable
                  onPress={() => void selectManualCity(item)}
                  style={[styles.cityRow, selected && styles.cityRowSelected]}
                >
                  <Text style={[styles.cityName, selected && styles.cityNameSelected]}>
                    {item.name}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={[styles.primaryBtn, !hasLocation && styles.primaryBtnDisabled]}
            disabled={!hasLocation}
            onPress={() => setStep('notifications')}
          >
            <Text style={styles.primaryBtnText}>Devam</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setStep('location')}
          hitSlop={12}
          style={styles.backRow}
          disabled={saving}
        >
          <Ionicons name="chevron-back" size={22} color={colors.cream} />
          <Text style={styles.backText}>Konum</Text>
        </Pressable>
        <Text style={styles.title}>Bildirim Ayarları</Text>
        <Text style={styles.subtitle}>
          Hangi vakitlerde bildirim almak istediğini ve sesi seç. Süre ve diğer detayları sonra
          Ayarlar’dan değiştirebilirsin.
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.notifContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.soundRow}
          onPress={() => setSoundPickerTarget('atTime')}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Vaktinde bildirim sesi seç"
        >
          <View style={styles.soundRowLeft}>
            <Ionicons name="volume-medium-outline" size={20} color={colors.textOnLight} />
            <View style={styles.soundTextWrap}>
              <Text style={styles.soundLabel}>Vaktinde ses</Text>
              <Text style={styles.soundValue} numberOfLines={1}>
                {NOTIFICATION_MELODIES[clampMelodyIndex(atTimeMelodyIndex)]}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMutedOnLight} />
        </Pressable>

        <Pressable
          style={styles.soundRow}
          onPress={() => setSoundPickerTarget('before')}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Vakit öncesi bildirim sesi seç"
        >
          <View style={styles.soundRowLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.textOnLight} />
            <View style={styles.soundTextWrap}>
              <Text style={styles.soundLabel}>Vakit öncesi ses</Text>
              <Text style={styles.soundValue} numberOfLines={1}>
                {NOTIFICATION_MELODIES[clampMelodyIndex(beforeMelodyIndex)]}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMutedOnLight} />
        </Pressable>

        <Pressable
          style={styles.soundRow}
          onPress={() => setMinutesPickerOpen(true)}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Vakit öncesi süre seç"
        >
          <View style={styles.soundRowLeft}>
            <Ionicons name="time-outline" size={20} color={colors.textOnLight} />
            <View style={styles.soundTextWrap}>
              <Text style={styles.soundLabel}>Vakit öncesi süre</Text>
              <Text style={styles.soundValue} numberOfLines={1}>
                {beforeMinutes} Dakika
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMutedOnLight} />
        </Pressable>

        <View style={styles.gridHeader}>
          <Text style={[styles.gridCorner, styles.gridCornerSpacer]} />
          <Text style={styles.gridColLabel}>Vaktinde</Text>
          <Text style={styles.gridColLabel}>Vakit Öncesi</Text>
        </View>

        {PRAYER_BANNERS.map((banner) => {
          const t = toggles[banner.id];
          const showAtTime = banner.id !== 'gunes';
          return (
            <View key={banner.id} style={styles.gridRow}>
              <Text style={styles.gridRowLabel}>{banner.label}</Text>
              <View style={styles.switchCell}>
                {showAtTime ? (
                  <Switch
                    value={t.atTime}
                    onValueChange={(v) => setToggle(banner.id, 'atTime', v)}
                    trackColor={{ false: '#C5C0B4', true: ACCENT }}
                    thumbColor="#FFFFFF"
                  />
                ) : (
                  <View style={styles.switchPlaceholder} />
                )}
              </View>
              <View style={styles.switchCell}>
                <Switch
                  value={t.before}
                  onValueChange={(v) => setToggle(banner.id, 'before', v)}
                  trackColor={{ false: '#C5C0B4', true: ACCENT }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
          disabled={saving}
          onPress={() => void finish()}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Tamam</Text>
          )}
        </Pressable>
      </View>

      <OptionPickerModal
        visible={soundPickerTarget != null}
        title={
          soundPickerTarget === 'before' ? 'Vakit öncesi sesi seç' : 'Vaktinde sesi seç'
        }
        options={NOTIFICATION_MELODIES}
        selectedIndex={clampMelodyIndex(
          soundPickerTarget === 'before' ? beforeMelodyIndex : atTimeMelodyIndex,
        )}
        closeOnSelect={false}
        onSelect={(index) => {
          const next = clampMelodyIndex(index);
          if (soundPickerTarget === 'before') {
            setBeforeMelodyIndex(next);
          } else {
            setAtTimeMelodyIndex(next);
          }
          void previewNotificationSound(next);
        }}
        onClose={() => {
          void stopNotificationSoundPreview();
          setSoundPickerTarget(null);
        }}
      />

      <MinutesPickerModal
        visible={minutesPickerOpen}
        title="Vakit öncesi süre"
        options={BEFORE_MINUTES_OPTIONS}
        selectedMinutes={beforeMinutes}
        onSelect={setBeforeMinutes}
        onClose={() => setMinutesPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.bar,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.gold,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.cream,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.creamMuted,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  currentLabel: {
    fontSize: 13,
    color: colors.textMutedOnLight,
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textOnLight,
    marginBottom: 14,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bar,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  gpsButtonText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: colors.bar,
    color: colors.cream,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(2, 23, 52, 0.12)',
  },
  cityRowSelected: {
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
    borderRadius: 10,
  },
  cityName: {
    fontSize: 16,
    color: colors.textOnLight,
    fontWeight: '500',
  },
  cityNameSelected: {
    fontWeight: '700',
  },
  notifContent: {
    paddingBottom: 12,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.12)',
  },
  soundRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
  soundTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  soundLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMutedOnLight,
    marginBottom: 2,
  },
  soundValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  gridCorner: {
    flex: 1.1,
  },
  gridCornerSpacer: {
    minHeight: 1,
  },
  gridColLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMutedOnLight,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(2, 23, 52, 0.1)',
  },
  gridRowLabel: {
    flex: 1.1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  switchCell: {
    flex: 1,
    alignItems: 'center',
  },
  switchPlaceholder: {
    width: 51,
    height: 31,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(2, 23, 52, 0.1)',
    backgroundColor: colors.background,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
