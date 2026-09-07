import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsLinkRow } from '../../components/settings/SettingsRows';
import SettingsHeader from '../../components/settings/SettingsHeader';
import { useLocationContext } from '../../context/LocationContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const insets = useSafeAreaInsets();
  const { locationLabel } = useLocationContext();

  return (
    <View style={styles.container}>
      <SettingsHeader title="Ayarlar" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.menuCard}>
          <View style={styles.menuIconWrap}>
            <Ionicons name="settings-outline" size={22} color={colors.gold} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>Uygulama Ayarları</Text>
            <Text style={styles.menuSubtitle}>Konum ve bildirim tercihleri</Text>
          </View>
        </Pressable>

        <View style={styles.listCard}>
          <SettingsLinkRow
            label="Premium"
            value={undefined}
            icon="diamond-outline"
            onPress={() => navigation.navigate('PremiumSettings')}
          />
          <SettingsLinkRow
            label="Konum Ayarları"
            value={locationLabel ?? 'Seçilmedi'}
            icon="location-outline"
            onPress={() => navigation.navigate('LocationSettings')}
          />
          <SettingsLinkRow
            label="Bildirim Ayarları"
            icon="notifications-outline"
            onPress={() => navigation.navigate('NotificationSettings')}
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
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputField,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
  },
  listCard: {
    backgroundColor: colors.inputField,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
});
