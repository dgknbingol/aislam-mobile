import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SettingsHeader from '../../components/settings/SettingsHeader';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { accountFormStyles as styles, inputPlaceholderColor } from './accountFormStyles';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AccountSignUp'>;

export default function AccountSignUpScreen({ navigation }: Props) {
  const { signUp, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    try {
      setIsSubmitting(true);
      await signUp({ email, password, displayName });
      navigation.replace('AccountMain');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Kayıt başarısız.';
      setError(message);
      if (message.includes('DISPLAY') || message.includes('kullanılıyor')) {
        Alert.alert('Kayıt başarısız', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [displayName, email, navigation, password, signUp]);

  return (
    <View style={styles.container}>
      <SettingsHeader title="Üye Ol" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            <Text style={styles.label}>Kullanıcı adı</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="ornek-kullanici"
              placeholderTextColor={inputPlaceholderColor}
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 14 }]}>E-posta</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@e-islam.net"
              placeholderTextColor={inputPlaceholderColor}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 14 }]}>Şifre</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="en az 8 karakter"
              placeholderTextColor={inputPlaceholderColor}
              style={styles.input}
              secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={() => void handleSubmit()}
              disabled={isSubmitting || isLoading}
            >
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Üye olunuyor...' : 'Üye Ol'}</Text>
            </Pressable>

            <Text style={styles.divider}>veya</Text>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              onPress={() => navigation.replace('AccountSignIn')}
            >
              <Ionicons name="log-in-outline" size={18} color={colors.gold} />
              <Text style={styles.secondaryButtonText}>Giriş Yap</Text>
            </Pressable>

            <View style={styles.socialRow}>
              <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.secondaryButtonPressed]} onPress={() => Alert.alert('Yakında', 'Google ile giriş şu an desteklenmiyor.')}>
                <Ionicons name="logo-google" size={20} color={colors.gold} />
                <Text style={styles.socialText}>Google</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.secondaryButtonPressed]} onPress={() => Alert.alert('Yakında', 'Apple ile giriş şu an desteklenmiyor.')}>
                <Ionicons name="logo-apple" size={20} color={colors.gold} />
                <Text style={styles.socialText}>Apple</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}
