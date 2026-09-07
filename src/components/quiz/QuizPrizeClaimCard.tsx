import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

interface QuizPrizeClaimCardProps {
  rank: number;
  prizeEligibleAtJoin?: boolean;
}

export default function QuizPrizeClaimCard({ rank }: QuizPrizeClaimCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const openSignIn = () => {
    navigation.navigate('Settings', { screen: 'AccountSignIn' });
  };

  if (rank !== 1) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="gift-outline" size={22} color={colors.gold} />
        <Text style={styles.title}>Tebrikler! 1. sıradasın</Text>
      </View>

      {!user ? (
        <>
          <Text style={styles.body}>
            Ödülünü almak için giriş yapman gerekiyor. Teslimat bilgilerin için hesabınla devam et.
          </Text>
          <Pressable style={styles.primaryButton} onPress={openSignIn}>
            <Text style={styles.primaryButtonText}>Giriş Yap ve Ödülü Talep Et</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.body}>
            Ödül talebin alındı. Ekibimiz kısa süre içinde seninle iletişime geçecek.
          </Text>
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={18} color="#2E7D4F" />
            <Text style={styles.successText}>Ödül için uygunsun</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.35)',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textOnLight,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMutedOnLight,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.bar,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cream,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  successText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D4F',
  },
});
