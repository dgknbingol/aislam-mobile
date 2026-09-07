import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocationContext } from '../context/LocationContext';
import type { RootStackParamList } from '../navigation/types';
import { fetchNearbyMosques, type NearbyMosque } from '../services/nearbyMosquesApi';
import { colors } from '../theme/colors';
import { formatDistanceKm } from '../utils/geo';
import { openDirectionsTo } from '../utils/openDirections';

export default function NearbyMosquesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const {
    latitude,
    longitude,
    isLoadingLocation,
    permissionDenied,
    refreshCurrentLocation,
    isUpdatingLocation,
  } = useLocationContext();

  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [isLoadingMosques, setIsLoadingMosques] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hasLocation = latitude != null && longitude != null;

  const initialRegion = useMemo(() => {
    if (!hasLocation) return undefined;
    return {
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [hasLocation, latitude, longitude]);

  const loadMosques = useCallback(async () => {
    if (!hasLocation || latitude == null || longitude == null) return;

    setIsLoadingMosques(true);
    setError(null);

    try {
      const results = await fetchNearbyMosques(latitude, longitude);
      setMosques(results);
      setSelectedId(results[0]?.id ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Yakın camiler yüklenemedi.';
      setError(message);
      setMosques([]);
      setSelectedId(null);
    } finally {
      setIsLoadingMosques(false);
    }
  }, [hasLocation, latitude, longitude]);

  useEffect(() => {
    if (hasLocation) {
      void loadMosques();
    }
  }, [hasLocation, loadMosques]);

  const focusMosque = useCallback((mosque: NearbyMosque) => {
    setSelectedId(mosque.id);
    mapRef.current?.animateToRegion(
      {
        latitude: mosque.latitude,
        longitude: mosque.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350,
    );
  }, []);

  const handleDirections = useCallback((mosque: NearbyMosque) => {
    openDirectionsTo(mosque.latitude, mosque.longitude, mosque.name);
  }, []);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const selectedMosque = mosques.find((item) => item.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={goBack} style={styles.backButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Yakın Camiler</Text>
          <Text style={styles.headerSubtitle}>Konumunuza en yakın camiler</Text>
        </View>
        <Pressable
          onPress={() => void refreshCurrentLocation()}
          style={styles.refreshButton}
          accessibilityLabel="Konumu yenile"
          disabled={isUpdatingLocation}
        >
          <Ionicons name="locate-outline" size={22} color={colors.cream} />
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
        <>
          <View style={styles.mapWrap}>
            {initialRegion ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton={false}
                toolbarEnabled={false}
              >
                {mosques.map((mosque) => (
                  <Marker
                    key={mosque.id}
                    coordinate={{
                      latitude: mosque.latitude,
                      longitude: mosque.longitude,
                    }}
                    title={mosque.name}
                    description={formatDistanceKm(mosque.distanceKm)}
                    pinColor={selectedId === mosque.id ? colors.gold : colors.bar}
                    onPress={() => focusMosque(mosque)}
                    onCalloutPress={() => handleDirections(mosque)}
                  />
                ))}
              </MapView>
            ) : null}

            {isLoadingMosques ? (
              <View style={styles.mapOverlay}>
                <ActivityIndicator size="small" color={colors.bar} />
                <Text style={styles.mapOverlayText}>Camiler aranıyor...</Text>
              </View>
            ) : null}
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
              <Pressable onPress={() => void loadMosques()}>
                <Text style={styles.errorBannerAction}>Yenile</Text>
              </Pressable>
            </View>
          ) : null}

          {selectedMosque ? (
            <View style={[styles.selectedCard, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>{selectedMosque.name}</Text>
                <Text style={styles.selectedDistance}>
                  {formatDistanceKm(selectedMosque.distanceKm)} uzaklıkta
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.directionsButton, pressed && styles.directionsButtonPressed]}
                onPress={() => handleDirections(selectedMosque)}
              >
                <Ionicons name="navigate-outline" size={18} color={colors.bar} />
                <Text style={styles.directionsButtonText}>Yol tarifi</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>
              {mosques.length > 0 ? `${mosques.length} cami bulundu` : 'Yakında cami bulunamadı'}
            </Text>
            <FlatList
              data={mosques}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={{ paddingBottom: selectedMosque ? 8 : Math.max(insets.bottom, 16) }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.listItem,
                      isSelected && styles.listItemSelected,
                      pressed && styles.listItemPressed,
                    ]}
                    onPress={() => focusMosque(item)}
                  >
                    <View style={styles.listItemIcon}>
                      <Ionicons name="business-outline" size={18} color={colors.gold} />
                    </View>
                    <View style={styles.listItemText}>
                      <Text style={styles.listItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.listItemDistance}>
                        {formatDistanceKm(item.distanceKm)}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.listDirections}
                      onPress={() => handleDirections(item)}
                      hitSlop={8}
                    >
                      <Ionicons name="navigate-outline" size={20} color={colors.bar} />
                    </Pressable>
                  </Pressable>
                );
              }}
            />
          </View>
        </>
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
  mapWrap: {
    height: 280,
    backgroundColor: colors.inputField,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 245, 221, 0.72)',
    gap: 8,
  },
  mapOverlayText: {
    fontSize: 13,
    color: colors.textOnLight,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
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
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.bar,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.cream,
  },
  selectedDistance: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  directionsButtonPressed: {
    opacity: 0.85,
  },
  directionsButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.bar,
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
  listItemSelected: {
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
