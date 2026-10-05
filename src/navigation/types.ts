import type { NavigatorScreenParams } from '@react-navigation/native';

import type { PrayerBannerId } from '../components/prayer-banners/shared';
import type { LeaderboardPeriod } from '../components/quiz/leaderboardMockData';
import type { CompetitionKind } from '../utils/competitionSchedule';
import type { DailyContentKind } from '../types/notificationSettings';



export type RootStackParamList = {

  Onboarding: undefined;

  Home: undefined;

  Chat: undefined;

  Tesbih: undefined;

  PrayerTimes: undefined;

  NearbyMosques: undefined;

  ReligiousDays: undefined;

  Hutbeler: undefined;

  HutbeDetail: { hutbeId: string };

  KazaPrayers: undefined;

  Education: NavigatorScreenParams<EducationStackParamList>;

  Quiz: undefined;

  QuizLobby: { period: LeaderboardPeriod };

  QuizPlay: { period: LeaderboardPeriod; eventId: string };

  Quran: { surahNumber?: number; ayahNumber?: number } | undefined;

  Qibla: undefined;

  AsmaUlHusna: { catalogIndex?: number } | undefined;

  Settings: NavigatorScreenParams<SettingsStackParamList>;

};



export type EducationStackParamList = {
  EducationHub: undefined;
  EducationCategory: { categoryId: string };
  EducationModule: { categoryId: string; moduleId: string };
  EducationLesson: { categoryId: string; moduleId: string; lessonId: string };
  EducationModuleQuiz: { categoryId: string; moduleId: string; quizId: string };
  EducationCategoryQuiz: { categoryId: string; quizId: string };
};



export type SettingsStackParamList = {

  SettingsMain: undefined;
  AccountMain: undefined;
  AccountSignIn: undefined;
  AccountSignUp: undefined;
  AccountEditUsername: undefined;

  LocationSettings: undefined;

  NotificationSettings: undefined;

  PrayerNotificationSettings: { prayerId: PrayerBannerId };

  CompetitionNotificationSettings: { competitionKind: CompetitionKind };

  DailyContentNotificationSettings: { kind: DailyContentKind };

  PremiumSettings: undefined;

};



declare global {

  namespace ReactNavigation {

    interface RootParamList extends RootStackParamList {}

  }

}

