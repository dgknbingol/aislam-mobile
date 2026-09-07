import { RouteProp, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DaySelector from '../../components/settings/DaySelector';
import OptionPickerModal from '../../components/settings/OptionPickerModal';
import SettingsHeader from '../../components/settings/SettingsHeader';
import {
  SettingsLinkRow,
  SettingsSectionCard,
  SettingsToggleRow,
} from '../../components/settings/SettingsRows';
import {
  formatClock,
  getDailyContentMeta,
} from '../../constants/dailyContentNotifications';
import type { SettingsStackParamList } from '../../navigation/types';
import {
  createDefaultDailyContentNotificationSettings,
  formatDaysSummary,
  loadAllDailyContentNotificationSettings,
  NOTIFICATION_MELODIES,
  saveDailyContentNotificationSettings,
} from '../../services/notificationSettingsStorage';
import {
  previewNotificationSound,
  stopNotificationSoundPreview,
} from '../../services/notificationSoundPreview';
import type { DailyContentNotificationSettings } from '../../types/notificationSettings';
import { colors } from '../../theme/colors';

type Route = RouteProp<SettingsStackParamList, 'DailyContentNotificationSettings'>;

export default function DailyContentNotificationSettingsScreen() {
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { kind } = route.params;
  const meta = getDailyContentMeta(kind);

  const [settings, setSettings] = useState<DailyContentNotificationSettings>(
    createDefaultDailyContentNotificationSettings(kind),
  );
  const [melodyPickerOpen, setMelodyPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadAllDailyContentNotificationSettings().then((all) => {
      if (!cancelled) {
        setSettings(all[kind]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const persist = useCallback(
    async (next: DailyContentNotificationSettings) => {
      setSettings(next);
      await saveDailyContentNotificationSettings(kind, next);
    },
    [kind],
  );

  return (
    <View style={styles.container}>
      <SettingsHeader title={meta.label} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.scheduleHint}>
          Planlanan saat: {formatClock(settings.hour, settings.minute)}
          {kind === 'hutbe' ? ' · varsayılan yalnızca Cuma' : ''}
        </Text>

        <SettingsSectionCard title={`${meta.label} Bildirimi`}>
          <SettingsToggleRow
            label="Durumu"
            value={settings.enabled}
            onValueChange={(enabled) => void persist({ ...settings, enabled })}
          />
          <SettingsLinkRow
            label="Ses"
            value={NOTIFICATION_MELODIES[settings.melodyIndex]}
            icon="volume-medium-outline"
            onPress={() => setMelodyPickerOpen(true)}
            showDivider={false}
          />
        </SettingsSectionCard>

        <Text style={styles.daysTitle}>Günler</Text>
        <DaySelector
          days={settings.days}
          onChange={(days) => void persist({ ...settings, days })}
        />
        <Text style={styles.daysSummary}>{formatDaysSummary(settings.days)}</Text>
      </ScrollView>

      <OptionPickerModal
        visible={melodyPickerOpen}
        title="Bildirim sesi seç"
        options={NOTIFICATION_MELODIES}
        selectedIndex={settings.melodyIndex}
        closeOnSelect={false}
        onSelect={(index) => {
          void previewNotificationSound(index);
          void persist({ ...settings, melodyIndex: index });
        }}
        onClose={() => {
          void stopNotificationSoundPreview();
          setMelodyPickerOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  scheduleHint: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMutedOnLight,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  daysTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMutedOnLight,
    marginBottom: 10,
    marginLeft: 4,
  },
  daysSummary: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMutedOnLight,
    marginLeft: 4,
  },
});
