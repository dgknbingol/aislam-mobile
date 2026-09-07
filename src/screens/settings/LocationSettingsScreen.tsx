import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SettingsHeader from '../../components/settings/SettingsHeader';
import { TURKISH_CITIES, type TurkishCity } from '../../constants/turkishCities';
import { useLocationContext } from '../../context/LocationContext';
import { colors } from '../../theme/colors';

export default function LocationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    locationLabel,
    latitude,
    longitude,
    selectManualCity,
    refreshCurrentLocation,
    isUpdatingLocation,
  } = useLocationContext();
  const [query, setQuery] = useState('');

  const filteredCities = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    if (!normalized) return TURKISH_CITIES;
    return TURKISH_CITIES.filter((city) =>
      city.name.toLocaleLowerCase('tr-TR').includes(normalized),
    );
  }, [query]);

  const isSelected = (city: TurkishCity) =>
    latitude != null &&
    longitude != null &&
    Math.abs(latitude - city.latitude) < 0.02 &&
    Math.abs(longitude - city.longitude) < 0.02;

  const renderCity = ({ item }: { item: TurkishCity }) => {
    const selected = isSelected(item);
    return (
      <Pressable
        onPress={() => void selectManualCity(item)}
        style={[styles.cityRow, selected && styles.cityRowSelected]}
      >
        <Text style={[styles.cityName, selected && styles.cityNameSelected]}>{item.name}</Text>
        {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.gold} /> : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <SettingsHeader title="Konum Ayarları" />

      <View style={styles.content}>
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
          renderItem={renderCity}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.textOnLight,
    marginBottom: 14,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.inputField,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textOnLight,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.1)',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.08)',
  },
  cityRowSelected: {
    borderColor: colors.gold,
    backgroundColor: '#FFFDF6',
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnLight,
  },
  cityNameSelected: {
    color: colors.bar,
  },
});
