import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import {
  googleAuthConfig,
  isAppleAuthAvailable,
  isGoogleAuthConfigured,
} from '../../services/socialAuthConfig';
import { colors } from '../../theme/colors';
import { accountFormStyles as styles } from '../../screens/account/accountFormStyles';

WebBrowser.maybeCompleteAuthSession();

interface SocialAuthButtonsProps {
  onSuccess: () => void;
  disabled?: boolean;
}

export default function SocialAuthButtons({ onSuccess, disabled }: SocialAuthButtonsProps) {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState(false);
  const googleConfigured = isGoogleAuthConfigured();
  const googleIds = googleAuthConfig();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleIds.webClientId || undefined,
    androidClientId: googleIds.androidClientId || undefined,
    iosClientId: googleIds.iosClientId || undefined,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params.id_token;
    if (!idToken) {
      Alert.alert('Google girişi', 'Google oturumu alınamadı.');
      return;
    }
    let cancelled = false;
    setBusy(true);
    void (async () => {
      try {
        await signInWithGoogle(idToken);
        if (!cancelled) onSuccess();
      } catch (error) {
        if (!cancelled) {
          Alert.alert(
            'Google girişi',
            error instanceof Error ? error.message : 'Google ile giriş başarısız.',
          );
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onSuccess, response, signInWithGoogle]);

  const handleGoogle = useCallback(() => {
    if (!googleConfigured) {
      Alert.alert('Google girişi', 'Google ile giriş henüz yapılandırılmadı.');
      return;
    }
    void promptAsync();
  }, [googleConfigured, promptAsync]);

  const handleApple = useCallback(async () => {
    if (!isAppleAuthAvailable()) {
      Alert.alert('Apple girişi', 'Apple ile giriş yalnızca iPhone’da kullanılır.');
      return;
    }
    try {
      setBusy(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        Alert.alert('Apple girişi', 'Apple oturumu alınamadı.');
        return;
      }
      await signInWithApple(credential.identityToken);
      onSuccess();
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      if (code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(
        'Apple girişi',
        error instanceof Error ? error.message : 'Apple ile giriş başarısız.',
      );
    } finally {
      setBusy(false);
    }
  }, [onSuccess, signInWithApple]);

  const locked = disabled || busy;

  return (
    <View style={styles.socialRow}>
      <Pressable
        style={({ pressed }) => [styles.socialButton, pressed && styles.secondaryButtonPressed]}
        onPress={handleGoogle}
        disabled={locked || (googleConfigured && !request)}
      >
        <Ionicons name="logo-google" size={20} color={colors.gold} />
        <Text style={styles.socialText}>Google</Text>
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Pressable
          style={({ pressed }) => [styles.socialButton, pressed && styles.secondaryButtonPressed]}
          onPress={() => void handleApple()}
          disabled={locked}
        >
          <Ionicons name="logo-apple" size={20} color={colors.gold} />
          <Text style={styles.socialText}>Apple</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.socialButton, pressed && styles.secondaryButtonPressed]}
          onPress={() =>
            Alert.alert('Apple girişi', 'Apple ile giriş iOS uygulamasında açılacak.')
          }
        >
          <Ionicons name="logo-apple" size={20} color={colors.gold} />
          <Text style={styles.socialText}>Apple</Text>
        </Pressable>
      )}
    </View>
  );
}
