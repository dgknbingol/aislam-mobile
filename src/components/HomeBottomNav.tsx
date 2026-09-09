import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PressableScale from './PressableScale';
import { useSubscription } from '../context/SubscriptionContext';
import { colors } from '../theme/colors';

export type HomeTabId = 'home' | 'quran' | 'chat' | 'quiz' | 'tesbih';

/** Alt menü için içerik padding (global banner App kabuğunda; burada yok). */
export const HOME_BOTTOM_NAV_CONTENT_PAD = 100;

interface HomeBottomNavProps {
  activeTab: HomeTabId;
  onTabPress: (tab: HomeTabId) => void;
}

interface NavItem {
  id: HomeTabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Ana Sayfa', icon: 'home-outline' },
  { id: 'quran', label: 'Kuran', icon: 'book-outline' },
  { id: 'chat', label: 'AI Asistan', icon: 'chatbubble-ellipses-outline' },
  { id: 'quiz', label: 'Yarışma', icon: 'help-circle-outline' },
  { id: 'tesbih', label: 'Tesbih', icon: 'ribbon-outline' },
];

export default function HomeBottomNav({ activeTab, onTabPress }: HomeBottomNavProps) {
  const insets = useSafeAreaInsets();
  const { quota } = useSubscription();
  // Global banner varken safe-area orada; premium'da banner yok → menüde bırak.
  const paddingBottom = quota?.premium ? Math.max(insets.bottom, 10) : 10;

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const isChat = item.id === 'chat';

        if (isChat) {
          return (
            <PressableScale
              key={item.id}
              onPress={() => onTabPress(item.id)}
              style={styles.chatButtonWrapper}
              contentStyle={styles.chatButton}
              baseColor={colors.inputField}
              pressedColor={colors.barBorder}
              accessibilityLabel="AI Asistan"
            >
              <Ionicons name={item.icon} size={26} color={colors.cream} />
            </PressableScale>
          );
        }

        return (
          <PressableScale
            key={item.id}
            onPress={() => onTabPress(item.id)}
            style={styles.tabButton}
            contentStyle={styles.tabContent}
            accessibilityLabel={item.label}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={isActive ? colors.gold : colors.creamMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {item.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.bar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.barBorder,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.creamMuted,
  },
  tabLabelActive: {
    color: colors.gold,
    fontWeight: '600',
  },
  chatButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -22,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bar,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
});
