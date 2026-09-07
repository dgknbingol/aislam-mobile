import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import QiblaCompass from '../components/qibla/QiblaCompass';
import { useLocationContext } from '../context/LocationContext';
import { useCompassHeading } from '../hooks/useCompassHeading';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  formatQiblaDirection,
} from '../utils/qibla';

export default function QiblaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { latitude, longitude, isLoadingLocation, permissionDenied } = useLocationContext();
  const { heading, isAvailable, usesTrueNorth } = useCompassHeading(
    true,
    latitude,
    longitude,
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const hasLocation = latitude != null && longitude != null;
  const qiblaBearing = hasLocation ? calculateQiblaBearing(latitude, longitude) : 0;
  const distanceKm = hasLocation ? calculateDistanceToKaaba(latitude, longitude) : null;
  const relativeQibla =
    heading != null ? (qiblaBearing - heading + 360) % 360 : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={goBack} style={styles.backButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Kıble Pusulası</Text>
          <Text style={styles.headerSubtitle}>Kabe yönünü gösterir</Text>
        </View>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.content}>
        {isLoadingLocation ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.bar} />
            <Text style={styles.hintText}>Konum alınıyor...</Text>
          </View>
        ) : !hasLocation ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Konum bilgisi alınamadı.</Text>
          </View>
        ) : (
          <>
            <QiblaCompass qiblaBearing={qiblaBearing} deviceHeading={heading} />

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kıble açısı</Text>
                <Text style={styles.infoValue}>{formatQiblaDirection(qiblaBearing)}</Text>
              </View>
              {distanceKm != null ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Kabe mesafesi</Text>
                  <Text style={styles.infoValue}>
                    {distanceKm >= 100
                      ? `${Math.round(distanceKm).toLocaleString('tr-TR')} km`
                      : `${distanceKm.toFixed(1)} km`}
                  </Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pusula</Text>
                <Text style={styles.infoValue}>
                  {heading != null
                    ? `${Math.round(heading)}°${usesTrueNorth ? '' : ' (düzeltildi)'}`
                    : 'Hazırlanıyor...'}
                </Text>
              </View>
              {relativeQibla != null ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Kıbleye dönüş</Text>
                  <Text style={styles.infoValue}>
                    {relativeQibla <= 180
                      ? `${Math.round(relativeQibla)}° sağa`
                      : `${Math.round(360 - relativeQibla)}° sola`}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.instruction}>
              Telefonu yatay tutun ve yavaşça döndürün. Kadran döner; 🕋 işareti üstteki
              sabit ok ile aynı hizada olana kadar dönün — o yön kıbledir.
            </Text>

            {permissionDenied ? (
              <Text style={styles.warning}>
                Konum izni kapalı; ezan vakitleri için kayıtlı veya varsayılan konum kullanılıyor.
              </Text>
            ) : null}

            {!isAvailable ? (
              <Text style={styles.warning}>
                Bu cihazda pusula sensörü bulunamadı. Kıble açısı yine de gösteriliyor.
              </Text>
            ) : null}
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 14,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 44,
    height: 44,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.cream,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hintText: {
    fontSize: 15,
    color: colors.textMutedOnLight,
  },
  errorText: {
    fontSize: 15,
    color: colors.warning,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFDF6',
    borderRadius: 16,
    padding: 16,
    marginTop: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.08)',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMutedOnLight,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  instruction: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMutedOnLight,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  warning: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: colors.warning,
    textAlign: 'center',
  },
});
