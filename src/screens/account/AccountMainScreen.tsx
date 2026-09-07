import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';

import SettingsHeader from '../../components/settings/SettingsHeader';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AccountMain'>;

export default function AccountMainScreen({ navigation }: Props) {
  const { user, isLoading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = user?.displayName ?? '';
  const email = user?.email ?? '';

  const canShow = useMemo(() => !isLoading && !!user, [isLoading, user]);

  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigation.replace('AccountSignIn');
    } catch {
      Alert.alert('Hata', 'Çıkış yapılamadı.');
    } finally {
      setIsSigningOut(false);
    }
  }, [navigation, signOut]);

  return (
    <View style={styles.container}>
      <SettingsHeader
        title="Hesabım"
        rightAction={
          canShow ? (
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
              accessibilityLabel="Çıkış Yap"
            >
              <Ionicons name="log-out-outline" size={18} color={colors.cream} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!canShow ? (
          <Text style={styles.note}>Oturum bulunamadı. Lütfen giriş yapın.</Text>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Ionicons name="person-outline" size={22} color={colors.gold} />
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{displayName}</Text>
                  <Text style={styles.cardSubtitle}>{email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Ayarlar</Text>

              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                onPress={() => navigation.navigate('AccountEditUsername')}
              >
                <Ionicons name="create-outline" size={20} color={colors.gold} />
                <Text style={styles.actionText}>Kullanıcı adını değiştir</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                onPress={() => Alert.alert('Yakında', 'Google ile giriş şu an desteklenmiyor.')}
              >
                <Ionicons name="logo-google" size={20} color={colors.gold} />
                <Text style={styles.actionText}>Google ile giriş</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
                onPress={() => Alert.alert('Yakında', 'Apple ile giriş şu an desteklenmiyor.')}
              >
                <Ionicons name="logo-apple" size={20} color={colors.gold} />
                <Text style={styles.actionText}>Apple ile giriş</Text>
              </Pressable>
            </View>

            <TextInput style={styles.hiddenInput} value="" onChangeText={() => {}} editable={false} />

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <Text style={styles.primaryButtonText}>{isSigningOut ? 'Çıkılıyor...' : 'Çıkış Yap'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  note: { color: colors.textMutedOnLight, fontSize: 13, textAlign: 'center', marginTop: 18 },
  card: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.cream },
  cardSubtitle: { fontSize: 13, color: colors.creamMuted, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.cream, marginBottom: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  actionRowPressed: { opacity: 0.85 },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.cream },
  primaryButton: { marginTop: 6, backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryButtonPressed: { opacity: 0.9 },
  primaryButtonText: { color: colors.bar, fontWeight: '800', fontSize: 15 },
  signOutButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  signOutButtonPressed: { opacity: 0.8 },
  hiddenInput: { display: 'none' },
});

