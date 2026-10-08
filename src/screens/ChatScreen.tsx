import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import PressableScale from '../components/PressableScale';
import PremiumPaywallModal from '../components/subscription/PremiumPaywallModal';
import { APP_NAME } from '../constants/app';
import { PREMIUM_UI_ENABLED } from '../constants/subscription';
import { useChat } from '../context/ChatContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { RootStackParamList } from '../navigation/types';
import { showInterstitialIfEligible } from '../services/fullscreenAds';
import { colors } from '../theme/colors';
import type { Message } from '../types/chat';

export default function ChatScreen() {
  const navigation = useNavigation<
    DrawerNavigationProp<Record<string, undefined>> &
      NativeStackNavigationProp<RootStackParamList>
  >();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Message>>(null);
  const { activeConversation, createNewChat, sendMessage, isLoading, quotaExceeded, clearQuotaExceeded } =
    useChat();
  const { quota, refreshQuota } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const messages = activeConversation?.messages ?? [];
  const isQuotaExhausted = quota != null && !quota.premium && quota.remaining <= 0;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      void showInterstitialIfEligible({ isPremium: quota?.premium === true });
    });
    return unsubscribe;
  }, [navigation, quota?.premium]);

  useEffect(() => {
    void refreshQuota();
  }, [refreshQuota]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length, isLoading]);

  const showQuotaLimit = useCallback(() => {
    if (PREMIUM_UI_ENABLED) {
      setPaywallVisible(true);
      return;
    }
    Alert.alert(
      'Günlük soru hakkın doldu',
      'Yarın yeniden soru sorabilirsin.',
      [{ text: 'Tamam' }],
    );
  }, []);

  useEffect(() => {
    if (!quotaExceeded) return;
    showQuotaLimit();
    clearQuotaExceeded();
  }, [quotaExceeded, clearQuotaExceeded, showQuotaLimit]);

  const handleSend = async (text: string) => {
    if (isQuotaExhausted) {
      showQuotaLimit();
      return false;
    }

    return sendMessage(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.openDrawer()}
          accessibilityRole="button"
          accessibilityLabel="Sohbet geçmişi"
        >
          <Ionicons name="menu" size={24} color={colors.cream} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeConversation?.title ?? APP_NAME}
        </Text>

        <PressableScale
          onPress={createNewChat}
          style={styles.iconButtonHit}
          contentStyle={styles.iconButton}
          baseColor="transparent"
          pressedColor={colors.inputField}
          accessibilityLabel="Yeni sohbet"
        >
          <Ionicons name="create-outline" size={22} color={colors.cream} />
        </PressableScale>
      </View>

      {quota ? (
        <View style={styles.quotaBar}>
          <Text style={styles.quotaText}>
            {quota.premium ? 'Premium' : 'Ücretsiz'} · Bugün {quota.remaining}/{quota.limit} soru
          </Text>
          {PREMIUM_UI_ENABLED && !quota.premium ? (
            <Pressable onPress={() => setPaywallVisible(true)}>
              <Text style={styles.quotaLink}>Premium</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        style={styles.messageListContainer}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.messageListEmpty,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyLogo}>{APP_NAME}</Text>
            <Text style={styles.emptySubtitle}>Size nasıl yardımcı olabilirim ?</Text>
          </View>
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.textMutedOnLight} />
              <Text style={styles.loadingText}>Yanıt yazılıyor...</Text>
            </View>
          ) : null
        }
      />

      <ChatInput onSend={handleSend} disabled={isLoading} />

      {PREMIUM_UI_ENABLED ? (
        <PremiumPaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
    backgroundColor: colors.bar,
  },
  iconButtonHit: {
    width: 44,
    height: 44,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
    paddingHorizontal: 8,
  },
  quotaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.inputField,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  quotaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.creamMuted,
  },
  quotaLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
  },
  messageListContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyLogo: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textOnLight,
    marginBottom: 8,
    opacity: 0.35,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMutedOnLight,
    textAlign: 'center',
    opacity: 0.75,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMutedOnLight,
    opacity: 0.8,
  },
});
