import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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

import { QURAN_JUZ_COUNT, QURAN_PAGE_COUNT } from '../../constants/quranBounds';
import { getSurahNameTr } from '../../constants/surahNamesTr';
import { resolveJuzLocation, resolvePageLocation } from '../../services/quranApi';
import { colors } from '../../theme/colors';
import type { SurahMeta } from '../../types/quran';
import PickerColumn, { type PickerItem } from './PickerColumn';

export type NavigateTab = 'page' | 'juz' | 'surah';

export interface QuranNavigateTarget {
  surahNumber: number;
  ayahNumber: number;
}

interface QuranNavigateSheetProps {
  visible: boolean;
  surahs: SurahMeta[];
  initialSurah?: number;
  initialAyah?: number;
  onClose: () => void;
  onNavigate: (target: QuranNavigateTarget) => void;
}

const TABS: { id: NavigateTab; label: string }[] = [
  { id: 'page', label: 'Sayfa' },
  { id: 'juz', label: 'Cüz' },
  { id: 'surah', label: 'Sure' },
];

function normalizeQuery(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

export default function QuranNavigateSheet({
  visible,
  surahs,
  initialSurah = 1,
  initialAyah = 1,
  onClose,
  onNavigate,
}: QuranNavigateSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NavigateTab>('surah');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState(initialSurah);
  const [selectedAyah, setSelectedAyah] = useState(initialAyah);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setActiveTab('surah');
    setSearchQuery('');
    setSelectedSurah(initialSurah);
    setSelectedAyah(initialAyah);
    setError(null);
  }, [visible, initialSurah, initialAyah]);

  const selectedSurahMeta = surahs.find((s) => s.number === selectedSurah);
  const maxAyah = selectedSurahMeta?.numberOfAyahs ?? 1;

  useEffect(() => {
    if (selectedAyah > maxAyah) {
      setSelectedAyah(maxAyah);
    }
  }, [maxAyah, selectedAyah]);

  const filteredSurahItems = useMemo((): PickerItem[] => {
    const query = normalizeQuery(searchQuery);
    return surahs
      .filter((surah) => {
        if (!query) return true;
        const name = getSurahNameTr(surah.number).toLocaleLowerCase('tr-TR');
        return name.includes(query) || String(surah.number).includes(query);
      })
      .map((surah) => ({
        id: `surah-${surah.number}`,
        label: `${surah.number}. ${getSurahNameTr(surah.number)}`,
        value: surah.number,
      }));
  }, [searchQuery, surahs]);

  const ayahItems = useMemo((): PickerItem[] => {
    return Array.from({ length: maxAyah }, (_, index) => {
      const ayah = index + 1;
      return {
        id: `ayah-${selectedSurah}-${ayah}`,
        label: String(ayah),
        value: ayah,
      };
    });
  }, [maxAyah, selectedSurah]);

  const pageItems = useMemo((): PickerItem[] => {
    const query = normalizeQuery(searchQuery);
    const items: PickerItem[] = [];
    for (let page = 1; page <= QURAN_PAGE_COUNT; page += 1) {
      if (query && !String(page).includes(query)) continue;
      items.push({ id: `page-${page}`, label: String(page), value: page });
    }
    return items;
  }, [searchQuery]);

  const juzItems = useMemo((): PickerItem[] => {
    const query = normalizeQuery(searchQuery);
    const items: PickerItem[] = [];
    for (let juz = 1; juz <= QURAN_JUZ_COUNT; juz += 1) {
      if (query && !String(juz).includes(query)) continue;
      items.push({ id: `juz-${juz}`, label: String(juz), value: juz });
    }
    return items;
  }, [searchQuery]);

  const handleGo = async () => {
    setError(null);
    setIsNavigating(true);
    try {
      if (activeTab === 'surah') {
        onNavigate({ surahNumber: selectedSurah, ayahNumber: selectedAyah });
        onClose();
        return;
      }

      if (activeTab === 'page') {
        const location = await resolvePageLocation(selectedPage);
        onNavigate(location);
        onClose();
        return;
      }

      const location = await resolveJuzLocation(selectedJuz);
      onNavigate(location);
      onClose();
    } catch (navError) {
      setError(navError instanceof Error ? navError.message : 'Konuma gidilemedi.');
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <View style={styles.tabs}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                    setError(null);
                  }}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMutedOnLight} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ara"
              placeholderTextColor="rgba(2, 32, 66, 0.45)"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMutedOnLight} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.pickerArea}>
            {activeTab === 'surah' ? (
              <>
                <PickerColumn
                  items={filteredSurahItems}
                  selectedId={`surah-${selectedSurah}`}
                  onSelect={(item) => setSelectedSurah(Number(item.value))}
                  flex={1.4}
                />
                <PickerColumn
                  items={ayahItems}
                  selectedId={`ayah-${selectedSurah}-${selectedAyah}`}
                  onSelect={(item) => setSelectedAyah(Number(item.value))}
                  flex={0.6}
                />
              </>
            ) : null}

            {activeTab === 'page' ? (
              <PickerColumn
                items={pageItems}
                selectedId={`page-${selectedPage}`}
                onSelect={(item) => setSelectedPage(Number(item.value))}
              />
            ) : null}

            {activeTab === 'juz' ? (
              <PickerColumn
                items={juzItems}
                selectedId={`juz-${selectedJuz}`}
                onSelect={(item) => setSelectedJuz(Number(item.value))}
              />
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.goButton, isNavigating && styles.goButtonDisabled]}
            onPress={() => void handleGo()}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <ActivityIndicator color={colors.cream} />
            ) : (
              <Text style={styles.goButtonText}>Git!</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 23, 52, 0.45)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(2, 23, 52, 0.18)',
    marginBottom: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3EDE0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.bar,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMutedOnLight,
  },
  tabTextActive: {
    color: colors.cream,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3EDE0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textOnLight,
    padding: 0,
  },
  pickerArea: {
    flexDirection: 'row',
    gap: 10,
    height: 260,
    marginBottom: 12,
  },
  errorText: {
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
  },
  goButton: {
    backgroundColor: colors.bar,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  goButtonDisabled: {
    opacity: 0.7,
  },
  goButtonText: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: '700',
  },
});
