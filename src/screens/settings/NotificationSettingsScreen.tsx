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
import { requestServerTestPush } from '../../services/devicePushRegistration';
import {
  ensureNotificationPermissions,
  getNotificationPermissionStatus,
  getScheduledNotificationCount,
  scheduleDailyContentTestNotifications,
  scheduleTestNotification,
  syncAllNotifications,
} from '../../services/prayerNotificationScheduler';
import { colors } from '../../theme/colors';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const insets = useSafeAreaInsets();
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [dailyTestMessage, setDailyTestMessage] = useState<string | null>(null);
  const [pushTestMessage, setPushTestMessage] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const refreshPermission = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionGranted(status === Notifications.PermissionStatus.GRANTED);
    const count = await getScheduledNotificationCount();
    setPendingCount(count);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
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

  const runTestNotification = async () => {
    setTestMessage(null);
    const ok = await scheduleTestNotification(10);
    if (!ok) {
      setTestMessage('Bildirim izni verilmedi.');
      return;
    }
    setTestMessage('10 saniye içinde test bildirimi gelecek. Uygulamayı arka plana alın.');
    await refreshPermission();
  };

  const runDailyContentTest = async () => {
    setDailyTestMessage(null);
    const ok = await scheduleDailyContentTestNotifications(10);
    if (!ok) {
      setDailyTestMessage('Bildirim izni verilmedi.');
      return;
    }
    setDailyTestMessage(
      '10 sn sonra ayet, ardından dua / hadis / hutbe / esma (3 sn arayla). Uygulamayı arka plana alın; esma bildirimine dokununca Esmaül Hüsna açılır.',
    );
    await refreshPermission();
  };

  const runServerPushTest = async () => {
    setPushTestMessage(null);
    const ok = await requestServerTestPush();
    setPushTestMessage(
      ok
        ? 'Sunucu test push gönderildi. Uygulamayı arka plana alın; birkaç saniye içinde gelmeli.'
        : 'Sunucu push başarısız. İnternet, bildirim izni ve API erişimini kontrol edin.',
    );
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
        ) : (
          <>
            <Text style={styles.hint}>
              İnternet varken tüm bildirimler sunucudan FCM/APNs ile gelir (saat sunucuya göre).
              İnternet yokken yalnızca sonraki 1–2 ezan yerel yedek olarak planlanır. Pil
              kısıtlamasını (Samsung: uygulama → pil → kısıtlama yok) kapatmanız önerilir.
              {pendingCount != null ? ` Planlı: ${pendingCount}` : ''}
            </Text>

            <View style={styles.testCard}>
              <Text style={styles.testTitle}>Expo ile hızlı test</Text>
              <Text style={styles.testText}>
                Fiziksel telefonda deneyin. Teste basın, uygulamayı arka plana alın ve bekleyin.
              </Text>
              <Pressable style={styles.testButton} onPress={() => void runTestNotification()}>
                <Text style={styles.testButtonText}>10 sn sonra test bildirimi</Text>
              </Pressable>
              {testMessage ? <Text style={styles.testResult}>{testMessage}</Text> : null}
              <Pressable
                style={[styles.testButton, styles.testButtonSecondary]}
                onPress={() => void runServerPushTest()}
              >
                <Text style={styles.testButtonText}>Sunucu ezan push testi</Text>
              </Pressable>
              {pushTestMessage ? <Text style={styles.testResult}>{pushTestMessage}</Text> : null}
              <Pressable
                style={[styles.testButton, styles.testButtonSecondary]}
                onPress={() => void runDailyContentTest()}
              >
                <Text style={styles.testButtonText}>10 sn sonra günlük içerik testleri</Text>
              </Pressable>
              {dailyTestMessage ? (
                <Text style={styles.testResult}>{dailyTestMessage}</Text>
              ) : null}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Günlük İçerik Bildirimleri</Text>
        <View style={styles.listCard}>
          {DAILY_CONTENT_NOTIFICATIONS.map((item, index) => (
            <SettingsLinkRow
              key={item.kind}
              label={`${item.label} · ${formatClock(item.hour, item.minute)}`}
              onPress={() =>
                navigation.navigate('DailyContentNotificationSettings', { kind: item.kind })
              }
              showDivider={index < DAILY_CONTENT_NOTIFICATIONS.length - 1}
            />
          ))}
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
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMutedOnLight,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.1)',
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnLight,
    marginBottom: 6,
  },
  testText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMutedOnLight,
    marginBottom: 12,
  },
  testButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bar,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  testButtonSecondary: {
    marginTop: 10,
    backgroundColor: colors.inputField,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cream,
  },
  testResult: {
    marginTop: 10,
    fontSize: 13,
    color: colors.goldMuted,
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
