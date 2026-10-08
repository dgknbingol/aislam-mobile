import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocationContext } from '../context/LocationContext';
import type { RootStackParamList } from '../navigation/types';
import { fetchNearbyMosques, type NearbyMosque } from '../services/nearbyMosquesApi';
import { colors } from '../theme/colors';
import { formatDistanceKm } from '../utils/geo';
import { openDirectionsTo } from '../utils/openDirections';

/**
 * MapView (react-native-maps) Android'de Google Maps API key olmadan native crash verir.
 * Harita yerine liste + yol tarifi (Google Maps / Apple Maps uygulaması) kullanıyoruz.
 */
export default function NearbyMosquesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    latitude,
    longitude,
    locationLabel,
    isLoadingLocation,
    permissionDenied,
    refreshCurrentLocation,
    isUpdatingLocation,
  } = useLocationContext();

  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [isLoadingMosques, setIsLoadingMosques] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLocation = latitude != null && longitude != null;

  const loadMosques = useCallback(async () => {
    if (!hasLocation || latitude == null || longitude == null) return;

    setIsLoadingMosques(true);
    setError(null);

    try {
      const results = await fetchNearbyMosques(latitude, longitude);
      setMosques(results);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Yakın camiler yüklenemedi.';
      setError(message);
      setMosques([]);
    } finally {
      setIsLoadingMosques(false);
    }
  }, [hasLocation, latitude, longitude]);

  useEffect(() => {
    if (hasLocation) {
      void loadMosques();
    }
  }, [hasLocation, loadMosques]);

  const handleDirections = useCallback((mosque: NearbyMosque) => {
    openDirectionsTo(mosque.latitude, mosque.longitude, mosque.name);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Yakın Camiler</Text>
          <Text style={styles.headerSubtitle}>
            {locationLabel ? `${locationLabel} çevresi` : 'Konumunuza en yakın camiler'}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            void refreshCurrentLocation().then(() => loadMosques());
          }}
          style={styles.refreshButton}
          accessibilityLabel="Konumu yenile"
          disabled={isUpdatingLocation || isLoadingMosques}
        >
          {isUpdatingLocation || isLoadingMosques ? (
            <ActivityIndicator size="small" color={colors.cream} />
          ) : (
            <Ionicons name="locate-outline" size={22} color={colors.cream} />
          )}
        </Pressable>
      </View>

      {isLoadingLocation ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.bar} />
          <Text style={styles.hintText}>Konum alınıyor...</Text>
        </View>
      ) : !hasLocation ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={42} color={colors.gold} />
          <Text style={styles.errorText}>
            {permissionDenied
              ? 'Konum izni kapalı. Ayarlardan izin verin veya uygulama ayarlarından şehir seçin.'
              : 'Konum bilgisi alınamadı.'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={() => void refreshCurrentLocation()}
          >
            <Text style={styles.retryButtonText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listSection}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
              <Pressable onPress={() => void loadMosques()}>
                <Text style={styles.errorBannerAction}>Yenile</Text>
              </Pressable>
            </View>
          ) : null}

          {isLoadingMosques && mosques.length === 0 ? (
            <View style={styles.centeredFlex}>
              <ActivityIndicator size="large" color={colors.bar} />
              <Text style={styles.hintText}>Camiler aranıyor...</Text>
            </View>
          ) : (
            <FlatList
              data={mosques}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 16),
                paddingTop: 4,
              }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={styles.listTitle}>
                  {mosques.length > 0
                    ? `${mosques.length} cami bulundu`
                    : 'Yakında cami bulunamadı'}
                </Text>
              }
              renderItem={({ item, index }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.listItem,
                    index === 0 && styles.listItemNearest,
                    pressed && styles.listItemPressed,
                  ]}
                  onPress={() => handleDirections(item)}
                >
                  <View style={styles.listItemIcon}>
                    <Ionicons name="business-outline" size={18} color={colors.gold} />
                  </View>
                  <View style={styles.listItemText}>
                    <Text style={styles.listItemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.listItemDistance}>
                      {formatDistanceKm(item.distanceKm)}
                      {index === 0 ? ' · En yakın' : ''}
                    </Text>
                  </View>
                  <View style={styles.listDirections}>
                    <Ionicons name="navigate-outline" size={20} color={colors.bar} />
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
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
    paddingHorizontal: 28,
    gap: 12,
  },
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hintText: {
    fontSize: 14,
    color: colors.textMutedOnLight,
  },
  errorText: {
    fontSize: 14,
    color: colors.textOnLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.bar,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: colors.cream,
    fontWeight: '700',
    fontSize: 14,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMutedOnLight,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 155, 122, 0.18)',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textOnLight,
  },
  errorBannerAction: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.bar,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  listItemNearest: {
    borderColor: colors.gold,
    backgroundColor: '#FFFDF6',
  },
  listItemPressed: {
    opacity: 0.9,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  listItemText: {
    flex: 1,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  listItemDistance: {
    fontSize: 12,
    color: colors.textMutedOnLight,
    marginTop: 2,
  },
  listDirections: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
