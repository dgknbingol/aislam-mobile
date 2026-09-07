import { RouteProp, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DaySelector from '../../components/settings/DaySelector';
import OptionPickerModal, {
  MinutesPickerModal,
} from '../../components/settings/OptionPickerModal';
import {
  previewNotificationSound,
  stopNotificationSoundPreview,
} from '../../services/notificationSoundPreview';
import {
  SettingsLinkRow,
  SettingsSectionCard,
  SettingsToggleRow,
} from '../../components/settings/SettingsRows';
import SettingsHeader from '../../components/settings/SettingsHeader';
import type { SettingsStackParamList } from '../../navigation/types';
import {
  BEFORE_MINUTES_OPTIONS,
  NOTIFICATION_MELODIES,
  createDefaultCompetitionNotificationSettings,
  formatDaysSummary,
  getCompetitionLabel,
  loadAllCompetitionNotificationSettings,
  saveCompetitionNotificationSettings,
} from '../../services/notificationSettingsStorage';
import type { CompetitionNotificationSettings } from '../../types/notificationSettings';
import { colors } from '../../theme/colors';

type Route = RouteProp<SettingsStackParamList, 'CompetitionNotificationSettings'>;

export default function CompetitionNotificationSettingsScreen() {
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { competitionKind } = route.params;
  const competitionLabel = getCompetitionLabel(competitionKind);

  const [settings, setSettings] = useState<CompetitionNotificationSettings>(
    createDefaultCompetitionNotificationSettings(competitionKind),
  );
  const [melodyPicker, setMelodyPicker] = useState<'atTime' | 'before' | null>(null);
  const [minutesPickerOpen, setMinutesPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadAllCompetitionNotificationSettings().then((all) => {
      if (!cancelled) {
        setSettings(all.daily ?? createDefaultCompetitionNotificationSettings('daily'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [competitionKind]);

  const persist = useCallback(
    async (next: CompetitionNotificationSettings) => {
      setSettings(next);
      await saveCompetitionNotificationSettings('daily', next);
    },
    [],
  );

  return (
    <View style={styles.container}>
      <SettingsHeader title={competitionLabel} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSectionCard title={`${competitionLabel} Zamanı Uyarı`}>
          <SettingsToggleRow
            label="Durumu"
            value={settings.atTime.enabled}
            onValueChange={(enabled) =>
              void persist({ ...settings, atTime: { ...settings.atTime, enabled } })
            }
          />
          <SettingsLinkRow
            label="Ses"
            value={NOTIFICATION_MELODIES[settings.atTime.melodyIndex]}
            icon="volume-medium-outline"
            onPress={() => setMelodyPicker('atTime')}
            showDivider={false}
          />
        </SettingsSectionCard>

        <SettingsSectionCard title={`${competitionLabel} Zamanından Önce Uyarı`}>
          <SettingsToggleRow
            label="Durumu"
            value={settings.before.enabled}
            onValueChange={(enabled) =>
              void persist({ ...settings, before: { ...settings.before, enabled } })
            }
          />
          <SettingsLinkRow
            label="Ses"
            value={NOTIFICATION_MELODIES[settings.before.melodyIndex]}
            icon="volume-medium-outline"
            onPress={() => setMelodyPicker('before')}
          />
          <SettingsLinkRow
            label="Uyarı Süresi"
            value={`${settings.before.minutesBefore} Dakika`}
            icon="time-outline"
            onPress={() => setMinutesPickerOpen(true)}
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
        visible={melodyPicker === 'atTime'}
        title="Yarışma sesi seç"
        options={NOTIFICATION_MELODIES}
        selectedIndex={settings.atTime.melodyIndex}
        closeOnSelect={false}
        onSelect={(index) => {
          void previewNotificationSound(index);
          void persist({ ...settings, atTime: { ...settings.atTime, melodyIndex: index } });
        }}
        onClose={() => {
          void stopNotificationSoundPreview();
          setMelodyPicker(null);
        }}
      />

      <OptionPickerModal
        visible={melodyPicker === 'before'}
        title="Önce uyarı sesi seç"
        options={NOTIFICATION_MELODIES}
        selectedIndex={settings.before.melodyIndex}
        closeOnSelect={false}
        onSelect={(index) => {
          void previewNotificationSound(index);
          void persist({ ...settings, before: { ...settings.before, melodyIndex: index } });
        }}
        onClose={() => {
          void stopNotificationSoundPreview();
          setMelodyPicker(null);
        }}
      />

      <MinutesPickerModal
        visible={minutesPickerOpen}
        title="Uyarı süresi"
        options={BEFORE_MINUTES_OPTIONS}
        selectedMinutes={settings.before.minutesBefore}
        onSelect={(minutesBefore) =>
          void persist({ ...settings, before: { ...settings.before, minutesBefore } })
        }
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
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
