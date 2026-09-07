import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  showDivider?: boolean;
}

function MenuRow({ icon, title, subtitle, onPress, showDivider = true }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.gold} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.creamMuted} />

      {showDivider ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

export default function HomeDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const openPrayerTimes = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('PrayerTimes');
  };

  const openNearbyMosques = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('NearbyMosques');
  };

  const openReligiousDays = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('ReligiousDays');
  };

  const openHutbeler = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Hutbeler');
  };

  const openKazaPrayers = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('KazaPrayers');
  };

  const openAsmaUlHusna = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('AsmaUlHusna');
  };

  const openEducation = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Education');
  };

  const openSettings = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Settings');
  };

  const openAccount = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Settings', {
      screen: user ? 'AccountMain' : 'AccountSignIn',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Menü</Text>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.list}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Uygulama</Text>

        <View style={styles.menuCard}>
          <MenuRow
            icon="time-outline"
            title="Vakitler"
            subtitle="Aylık ezan vakitleri tablosu"
            onPress={openPrayerTimes}
          />
          <MenuRow
            icon="calendar-outline"
            title="Dini Günler"
            subtitle="Kandiller, bayramlar ve mübarek günler"
            onPress={openReligiousDays}
          />
          <MenuRow
            icon="newspaper-outline"
            title="Hutbeler"
            subtitle="Diyanet Cuma hutbeleri, tarihe göre arşiv"
            onPress={openHutbeler}
          />
          <MenuRow
            icon="book-outline"
            title="Kazalar"
            subtitle="Kaza namazı ve oruç sayacı"
            onPress={openKazaPrayers}
          />
          <MenuRow
            icon="map-outline"
            title="Yakın Camiler"
            subtitle="Haritada yakındaki camileri gör, yol tarifi al"
            onPress={openNearbyMosques}
          />
          <MenuRow
            icon="library-outline"
            title="Eğitim Merkezi"
            subtitle="Temel eğitimler, Kur'an, siyer, hadis ve daha fazlası"
            onPress={openEducation}
          />
          <MenuRow
            icon="sparkles-outline"
            title="Esmaül Hüsna"
            subtitle="Allah'ın 99 güzel ismi, anlamları ve ses"
            onPress={openAsmaUlHusna}
          />
          <MenuRow
            icon="settings-outline"
            title="Ayarlar"
            subtitle="Konum, bildirim ve diğer tercihler"
            onPress={openSettings}
          />
          <MenuRow
            icon="person-outline"
            title={user ? 'Hesabım' : 'Giriş Yap'}
            subtitle={user ? 'Kullanıcı adını güncelle' : 'Üye olarak yarışmalara katıl'}
            onPress={openAccount}
            showDivider={false}
          />
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.drawer,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.cream,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.drawer,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: colors.inputField,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
    lineHeight: 22,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
    lineHeight: 18,
  },
  divider: {
    position: 'absolute',
    left: 70,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
