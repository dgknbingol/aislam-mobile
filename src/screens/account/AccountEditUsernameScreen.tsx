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

type Props = NativeStackScreenProps<SettingsStackParamList, 'AccountEditUsername'>;

export default function AccountEditUsernameScreen({ navigation }: Props) {
  const { user, updateDisplayName, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [nextName, setNextName] = useState(user?.displayName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setError(null);
    try {
      setIsSaving(true);
      await updateDisplayName(nextName);
      Alert.alert('Başarılı', 'Kullanıcı adı güncellendi.');
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Güncelleme başarısız.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [navigation, nextName, updateDisplayName]);

  return (
    <View style={styles.container}>
      <SettingsHeader title="Kullanıcı adını değiştir" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            <Text style={styles.label}>Yeni kullanıcı adı</Text>
            <TextInput
              value={nextName}
              onChangeText={setNextName}
              placeholder="örnek-kullanici"
              placeholderTextColor={inputPlaceholderColor}
              style={styles.input}
              autoCapitalize="none"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={() => void handleSave()}
              disabled={isSaving || isLoading}
            >
              <View style={styles.primaryButtonRow}>
                <Ionicons name="checkmark-outline" size={18} color={colors.bar} />
                <Text style={styles.primaryButtonText}>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}
