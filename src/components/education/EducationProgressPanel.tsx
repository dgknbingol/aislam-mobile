import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EDUCATION_ACHIEVEMENTS } from '../../constants/educationAchievements';
import { EDUCATION_XP } from '../../constants/educationXp';
import { useEducationProgress } from '../../hooks/useEducationProgress';
import { getEarnedAchievementIds } from '../../services/educationProgressStorage';
import { colors } from '../../theme/colors';
import EducationLevelBar from './EducationLevelBar';

function getAchievementDef(id: string) {
  return (
    EDUCATION_ACHIEVEMENTS[id] ?? {
      id,
      title: 'Başarım',
      description: 'Yeni bir başarım kazandın.',
      icon: 'ribbon',
      kind: 'module' as const,
    }
  );
}

export default function EducationProgressPanel() {
  const insets = useSafeAreaInsets();
  const { progress, refresh } = useEducationProgress();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const totalXp = progress?.totalXp ?? 0;
  const earnedIds = progress ? getEarnedAchievementIds(progress) : [];
  const lessonCount = progress ? Object.keys(progress.completedLessons).length : 0;
  const moduleCount = progress ? Object.keys(progress.completedModules).length : 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <EducationLevelBar totalXp={totalXp} />
        <Text style={styles.totalXp}>Toplam {totalXp} XP</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{lessonCount}</Text>
          <Text style={styles.statLabel}>Tamamlanan ders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{moduleCount}</Text>
          <Text style={styles.statLabel}>Tamamlanan modül</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>XP nasıl kazanılır?</Text>
        <Text style={styles.infoItem}>• Ders bitir: +{EDUCATION_XP.LESSON_COMPLETE} XP</Text>
        <Text style={styles.infoItem}>• Modülü tamamla: +{EDUCATION_XP.MODULE_COMPLETE_BONUS} XP</Text>
        <Text style={styles.infoItem}>
          • Quiz doğru cevap: +{EDUCATION_XP.QUIZ_CORRECT_ANSWER} XP (tekrar oynanabilir)
        </Text>
        <Text style={styles.infoItem}>• Her {EDUCATION_XP.XP_PER_LEVEL} XP = 1 seviye</Text>
      </View>

      <Text style={styles.sectionTitle}>Başarımlarım</Text>
      {earnedIds.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="ribbon-outline" size={28} color={colors.gold} />
          <Text style={styles.emptyText}>Henüz başarım yok. Dersleri tamamla ve quiz çöz!</Text>
        </View>
      ) : (
        earnedIds.map((id) => {
          const achievement = getAchievementDef(id);
          return (
            <View key={id} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons
                  name={achievement.icon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={colors.gold}
                />
              </View>
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  card: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  totalXp: { fontSize: 13, fontWeight: '700', color: colors.creamMuted },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.bar,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.gold },
  statLabel: { fontSize: 12, color: colors.creamMuted, marginTop: 4, textAlign: 'center' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: colors.textOnLight, marginBottom: 4 },
  infoItem: { fontSize: 13, lineHeight: 19, color: colors.textMutedOnLight },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnLight,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  emptyText: { fontSize: 13, color: colors.textMutedOnLight, textAlign: 'center', lineHeight: 19 },
  achievementCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.bar,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.18)',
  },
  achievementText: { flex: 1, gap: 3 },
  achievementTitle: { fontSize: 14, fontWeight: '800', color: colors.cream },
  achievementDesc: { fontSize: 12, lineHeight: 17, color: colors.creamMuted },
});
