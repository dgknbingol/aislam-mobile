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

type Props = NativeStackScreenProps<SettingsStackParamList, 'AccountSignIn'>;

export default function AccountSignInScreen({ navigation }: Props) {
  const { signIn, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    try {
      setIsSubmitting(true);
      await signIn({ email, password });
      navigation.replace('AccountMain');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Giriş başarısız.';
      setError(message);
      if (message.includes('INVALID') || message.includes('hatalı')) {
        Alert.alert('Giriş başarısız', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [email, navigation, password, signIn]);

  return (
    <View style={styles.container}>
      <SettingsHeader title="Giriş Yap" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            <Text style={styles.label}>E-posta</Text>
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
              placeholder="••••••••"
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
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}</Text>
            </Pressable>

            <Text style={styles.divider}>veya</Text>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              onPress={() => navigation.replace('AccountSignUp')}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.gold} />
              <Text style={styles.secondaryButtonText}>Üye Ol</Text>
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
