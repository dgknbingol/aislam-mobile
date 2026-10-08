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

import { PRAYER_BANNERS, type PrayerBannerId } from '../../components/prayer-banners/shared';
import { TURKISH_CITIES, type TurkishCity } from '../../constants/turkishCities';
import { useLocationContext } from '../../context/LocationContext';
import type { RootStackParamList } from '../../navigation/types';
import { markOnboardingComplete } from '../../services/onboardingStorage';
import {
  createDefaultPrayerNotificationSettings,
  saveAllPrayerNotificationSettings,
} from '../../services/notificationSettingsStorage';
import { ensureNotificationPermissions } from '../../services/prayerNotificationScheduler';
import type { AllPrayerNotificationSettings } from '../../types/notificationSettings';
import { colors } from '../../theme/colors';

type Step = 'location' | 'notifications';

type PrayerToggleState = Record<
  PrayerBannerId,
  { atTime: boolean; before: boolean }
>;

const ACCENT = '#1FA8A0';

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
      const all = PRAYER_BANNERS.reduce((acc, banner) => {
        const base = createDefaultPrayerNotificationSettings();
        const t = toggles[banner.id];
        const atTimeEnabled = banner.id === 'gunes' ? false : t.atTime;
        acc[banner.id] = {
          ...base,
          atTime: { ...base.atTime, enabled: atTimeEnabled },
          before: { ...base.before, enabled: t.before },
        };
        return acc;
      }, {} as AllPrayerNotificationSettings);

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
          Hangi vakitlerde bildirim almak istediğini seç. Detaylı ses ve süre ayarlarını sonra
          Ayarlar’dan değiştirebilirsin.
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.notifContent}
        showsVerticalScrollIndicator={false}
      >
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
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
