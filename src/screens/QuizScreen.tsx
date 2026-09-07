import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LeaderboardList from '../components/quiz/LeaderboardList';
import LeaderboardPodium from '../components/quiz/LeaderboardPodium';
import QuizAchievementsSection from '../components/quiz/QuizAchievementsSection';
import type { LeaderboardEntry } from '../components/quiz/leaderboardMockData';
import { useEducationProgress } from '../hooks/useEducationProgress';
import { useMonthlyLeaderboard } from '../hooks/useMonthlyLeaderboard';
import { COMPETITION_PRIZE_HINT } from '../constants/competition';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type QuizHubView = 'leaderboard' | 'achievements';

function QuizHubTabs({
  activeView,
  onChange,
}: {
  activeView: QuizHubView;
  onChange: (view: QuizHubView) => void;
}) {
  return (
    <View style={styles.hubTabs}>
      <Pressable
        onPress={() => onChange('leaderboard')}
        style={[styles.hubTab, activeView === 'leaderboard' && styles.hubTabActive]}
      >
        <Ionicons
          name="podium-outline"
          size={16}
          color={activeView === 'leaderboard' ? colors.textOnLight : colors.creamMuted}
        />
        <Text style={[styles.hubTabText, activeView === 'leaderboard' && styles.hubTabTextActive]}>
          Aylık Puan Durumu
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('achievements')}
        style={[styles.hubTab, activeView === 'achievements' && styles.hubTabActive]}
      >
        <Ionicons
          name="ribbon-outline"
          size={16}
          color={activeView === 'achievements' ? colors.textOnLight : colors.creamMuted}
        />
        <Text style={[styles.hubTabText, activeView === 'achievements' && styles.hubTabTextActive]}>
          Başarılarım
        </Text>
      </Pressable>
    </View>
  );
}

export default function QuizScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [activeView, setActiveView] = useState<QuizHubView>('leaderboard');
  const { topTen, currentUser, currentPlayerId, loading } = useMonthlyLeaderboard();
  const { totalXp } = useEducationProgress();

  const showPodium = topTen.length >= 3;
  const podiumEntries = showPodium
    ? (topTen.slice(0, 3) as [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry])
    : null;
  const listEntries = showPodium ? topTen.slice(3) : topTen;
  const isUserVisible = topTen.some((entry) => entry.id === currentPlayerId);

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.navigate('Home')}
            style={styles.backButton}
            accessibilityLabel="Ana menüye dön"
          >
            <Ionicons name="chevron-back" size={24} color={colors.cream} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>Bilgi Yarışması</Text>
            <Text style={styles.headerTitle}>Yarışma Merkezi</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <QuizHubTabs activeView={activeView} onChange={setActiveView} />

        {activeView === 'leaderboard' ? (
          <>
            <View style={styles.leaderboardBanner}>
              <View style={styles.bannerGlow} />
              <Ionicons name="trophy" size={22} color={colors.gold} />
              <View style={styles.bannerTextWrap}>
                <Text style={styles.bannerTitle}>Aylık Puan Durumu</Text>
                <Text style={styles.bannerSubtitle}>Günlük yarışmalardan biriken toplam puan</Text>
                <Text style={styles.bannerExtraSubtitle}>{COMPETITION_PRIZE_HINT}</Text>
              </View>
            </View>
            {podiumEntries ? (
              <LeaderboardPodium
                entries={podiumEntries}
                currentUserId={currentPlayerId}
                educationLevelXp={totalXp}
              />
            ) : null}
          </>
        ) : null}
      </View>

      {activeView === 'leaderboard' ? (
        loading && topTen.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : topTen.length === 0 && currentUser.entry.score === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Henüz sıralama yok. İlk yarışmayı tamamla!</Text>
          </View>
        ) : (
          <LeaderboardList
            entries={listEntries}
            currentUser={currentUser}
            rankOffset={showPodium ? 4 : 1}
            showCurrentUserFooter={!isUserVisible}
            contentPaddingBottom={insets.bottom + 24}
            educationLevelXp={totalXp}
          />
        )
      ) : null}

      <View
        style={[styles.tabPanel, activeView !== 'achievements' && styles.tabPanelHidden]}
        pointerEvents={activeView === 'achievements' ? 'auto' : 'none'}
      >
        <QuizAchievementsSection contentPaddingBottom={insets.bottom + 24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bar,
  },
  hero: {
    backgroundColor: colors.bar,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.send,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.cream,
  },
  headerSpacer: {
    width: 40,
  },
  hubTabs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  hubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hubTabActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  hubTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.creamMuted,
  },
  hubTabTextActive: {
    color: colors.textOnLight,
  },
  leaderboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.28)',
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.cream,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.creamMuted,
  },
  bannerExtraSubtitle: {
    fontSize: 11,
    color: colors.creamMuted,
    marginTop: 6,
    fontWeight: '600',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputField,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 18,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputField,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 18,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: colors.creamMuted,
    textAlign: 'center',
  },
  tabPanel: {
    flex: 1,
  },
  tabPanelHidden: {
    display: 'none',
  },
});
