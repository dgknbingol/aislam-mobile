import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsLinkRow } from '../../components/settings/SettingsRows';
import SettingsHeader from '../../components/settings/SettingsHeader';
import { PRAYER_BANNERS } from '../../components/prayer-banners/shared';
import {
  DAILY_CONTENT_NOTIFICATIONS,
  formatClock,
} from '../../constants/dailyContentNotifications';
import type { SettingsStackParamList } from '../../navigation/types';
import { loadAllDailyContentNotificationSettings } from '../../services/notificationSettingsStorage';
import {
  ensureNotificationPermissions,
  getNotificationPermissionStatus,
  syncAllNotifications,
} from '../../services/prayerNotificationScheduler';
import type { AllDailyContentNotificationSettings } from '../../types/notificationSettings';
import { colors } from '../../theme/colors';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const insets = useSafeAreaInsets();
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [dailySettings, setDailySettings] = useState<AllDailyContentNotificationSettings | null>(
    null,
  );

  const refreshPermission = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionGranted(status === Notifications.PermissionStatus.GRANTED);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
      void loadAllDailyContentNotificationSettings().then(setDailySettings);
    }, [refreshPermission]),
  );

  const requestPermission = async () => {
    const granted = await ensureNotificationPermissions();
    setPermissionGranted(granted);
    if (granted) {
      await syncAllNotifications();
      await refreshPermission();
    }
  };

  return (
    <View style={styles.container}>
      <SettingsHeader title="Bildirim Ayarları" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {!permissionGranted ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Bildirim izni gerekli</Text>
            <Text style={styles.permissionText}>
              Ezan vakti, günlük içerik ve yarışma uyarıları için bildirim iznini açın. Ayarlarınız
              kaydedilir; izin verildiğinde otomatik planlanır.
            </Text>
            <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}>
              <Text style={styles.permissionButtonText}>İzin ver</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Günlük İçerik Bildirimleri</Text>
        <View style={styles.listCard}>
          {DAILY_CONTENT_NOTIFICATIONS.map((item, index) => {
            const saved = dailySettings?.[item.kind];
            const hour = saved?.hour ?? item.hour;
            const minute = saved?.minute ?? item.minute;
            return (
              <SettingsLinkRow
                key={item.kind}
                label={`${item.label} · ${formatClock(hour, minute)}`}
                onPress={() =>
                  navigation.navigate('DailyContentNotificationSettings', { kind: item.kind })
                }
                showDivider={index < DAILY_CONTENT_NOTIFICATIONS.length - 1}
              />
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Vakit Bildirimleri</Text>
        <View style={styles.listCard}>
          {PRAYER_BANNERS.map((banner, index) => (
            <SettingsLinkRow
              key={banner.id}
              label={`${banner.label} Vakti`}
              onPress={() =>
                navigation.navigate('PrayerNotificationSettings', { prayerId: banner.id })
              }
              showDivider={index < PRAYER_BANNERS.length - 1}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Yarışma Bildirimleri</Text>
        <View style={styles.listCard}>
          <SettingsLinkRow
            label="Günlük Yarışma"
            onPress={() =>
              navigation.navigate('CompetitionNotificationSettings', {
                competitionKind: 'daily',
              })
            }
            showDivider={false}
          />
        </View>
      </ScrollView>
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
  permissionCard: {
    backgroundColor: '#FFFDF6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.35)',
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnLight,
    marginBottom: 6,
  },
  permissionText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMutedOnLight,
    marginBottom: 12,
  },
  permissionButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.inputField,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cream,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMutedOnLight,
    marginBottom: 10,
    marginTop: 6,
    marginLeft: 4,
  },
  listCard: {
    backgroundColor: colors.inputField,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
});
