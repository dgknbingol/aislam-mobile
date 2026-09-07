import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Image } from 'expo-image';
import { Alert, Pressable as RNPressable, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants/app';
import { colors } from '../theme/colors';
import type { Conversation } from '../types/chat';

const brandWordmark = require('../../assets/brand-wordmark.png');

interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function ChatListItem({
  conversation,
  isActive,
  onPress,
  onLongPress,
}: ChatListItemProps) {
  const pressed = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    const base = isActive ? colors.inputField : colors.drawer;
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(pressed.value, [0, 1], [base, colors.bar]),
    };
  }, [isActive]);

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 80 });
    scale.value = withSpring(0.97, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 120 });
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
  };

  return (
    <View style={styles.chatItemWrapper}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={450}
        style={styles.chatItemPressable}
      >
        <Animated.View style={[styles.chatItem, animatedStyle]}>
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={isActive ? colors.gold : colors.creamMuted}
            style={styles.chatIcon}
          />
          <Text
            style={[styles.chatTitle, isActive && styles.chatTitleActive]}
            numberOfLines={1}
          >
            {conversation.title}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function ChatDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    createNewChat,
    deleteConversation,
  } = useChat();

  const handleSelect = (id: string) => {
    selectConversation(id);
    navigation.closeDrawer();
  };

  const handleNewChat = () => {
    createNewChat();
    navigation.closeDrawer();
  };

  const confirmDelete = (conversation: Conversation) => {
    Alert.alert(
      'Sohbeti sil',
      `"${conversation.title}" silinsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteConversation(conversation.id),
        },
      ],
    );
  };

  const handleGoHome = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Home');
  };

  const handleGoAccount = () => {
    navigation.closeDrawer();
    navigation.getParent()?.navigate('Settings', {
      screen: user ? 'AccountMain' : 'AccountSignIn',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{APP_NAME}</Text>
        <RNPressable style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="create-outline" size={18} color={colors.gold} />
          <Text style={styles.newChatText}>Yeni sohbet</Text>
        </RNPressable>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.list}
        style={styles.scrollView}
      >
        <Text style={styles.sectionLabel}>Sohbetler</Text>
        {conversations.map((conversation) => (
          <ChatListItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversation?.id}
            onPress={() => handleSelect(conversation.id)}
            onLongPress={() => confirmDelete(conversation)}
          />
        ))}
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <RNPressable style={styles.homeMenuButton} onPress={handleGoHome}>
          <Ionicons name="home-outline" size={18} color={colors.gold} />
          <Text style={styles.homeMenuText}>Ana menü</Text>
        </RNPressable>
        <RNPressable style={styles.homeMenuButton} onPress={handleGoAccount}>
          <Ionicons name="person-outline" size={18} color={colors.gold} />
          <Text style={styles.homeMenuText}>{user ? 'Hesabım' : 'Giriş yap'}</Text>
        </RNPressable>
        <Image
          source={brandWordmark}
          style={styles.brandWordmark}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          accessibilityLabel={APP_NAME}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.drawer,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 12,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.inputField,
  },
  newChatText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.drawer,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatItemWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chatItemPressable: {
    width: '100%',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  chatIcon: {
    marginRight: 12,
  },
  chatTitle: {
    flex: 1,
    fontSize: 15,
    color: colors.creamMuted,
  },
  chatTitleActive: {
    color: colors.cream,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.barBorder,
    gap: 12,
  },
  homeMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.inputField,
  },
  homeMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
  },
  brandWordmark: {
    width: 180,
    height: 52,
    backgroundColor: 'transparent',
  },
});
