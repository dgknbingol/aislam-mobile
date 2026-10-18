import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  subtitle: string;
  sourceLabel: string;
  url: string;
};

export default function SourceWebViewScreen({
  title,
  subtitle,
  sourceLabel,
  url,
}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        <Pressable onPress={retry} style={styles.iconButton} accessibilityLabel="Yenile">
          <Ionicons name="refresh-outline" size={22} color={colors.cream} />
        </Pressable>
      </View>

      <View style={styles.webWrap}>
        {error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={retry} style={styles.retryButton}>
              <Text style={styles.retryText}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            key={reloadKey}
            source={{ uri: url }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Sayfa yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.');
            }}
            onHttpError={() => {
              setLoading(false);
              setError('Yayın şu an açılamıyor. Lütfen daha sonra tekrar dene.');
            }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            startInLoadingState={false}
          />
        )}

        {loading && !error ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Text style={styles.footerText}>Kaynak: {sourceLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bar,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
    backgroundColor: colors.bar,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.cream,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.creamMuted,
  },
  webWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 23, 52, 0.55)',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textOnLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.bar,
  },
  retryText: {
    color: colors.cream,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.bar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.barBorder,
  },
  footerText: {
    fontSize: 12,
    color: colors.creamMuted,
    textAlign: 'center',
  },
});
