export type EducationAchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  kind: 'module' | 'quiz' | 'category';
};

export const EDUCATION_ACHIEVEMENTS: Record<string, EducationAchievementDef> = {
  'islama-giris-complete': {
    id: 'islama-giris-complete',
    title: "İslam'a Giriş Tamamlandı",
    description: "İslam'a Giriş modülündeki tüm dersleri bitirdin.",
    icon: 'school',
    kind: 'module',
  },
  'islama-giris-mini-quiz-perfect': {
    id: 'islama-giris-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: "İslam'a Giriş mini quizi tüm soruları doğru cevapladın.",
    icon: 'trophy',
    kind: 'quiz',
  },
  'imanin-sartlari-complete': {
    id: 'imanin-sartlari-complete',
    title: 'İmanın Şartları Tamamlandı',
    description: 'İmanın Şartları modülündeki tüm dersleri bitirdin.',
    icon: 'heart',
    kind: 'module',
  },
  'islamin-sartlari-complete': {
    id: 'islamin-sartlari-complete',
    title: "İslam'ın Şartları Tamamlandı",
    description: "İslam'ın beş şartını öğrendin.",
    icon: 'star',
    kind: 'module',
  },
  'temel-egitimler-master': {
    id: 'temel-egitimler-master',
    title: 'Temel Eğitimler Ustası',
    description: 'Temel Eğitimler genel quizini tamamladın.',
    icon: 'ribbon',
    kind: 'category',
  },
  'kuran-egitimleri-master': {
    id: 'kuran-egitimleri-master',
    title: "Kur'an Eğitimleri Ustası",
    description: "Kur'an Eğitimleri genel quizini tamamladın.",
    icon: 'book',
    kind: 'category',
  },
  'siyer-master': {
    id: 'siyer-master',
    title: 'Siyer Ustası',
    description: 'Siyer genel quizini tamamladın.',
    icon: 'walk',
    kind: 'category',
  },
  'hadis-master': {
    id: 'hadis-master',
    title: 'Hadis Ustası',
    description: 'Hadis genel quizini tamamladın.',
    icon: 'chatbubbles',
    kind: 'category',
  },
  'fikih-master': {
    id: 'fikih-master',
    title: 'Fıkıh Ustası',
    description: 'Fıkıh genel quizini tamamladın.',
    icon: 'scale',
    kind: 'category',
  },
  'akaid-master': {
    id: 'akaid-master',
    title: 'Akaid Ustası',
    description: 'Akaid genel quizini tamamladın.',
    icon: 'shield-checkmark',
    kind: 'category',
  },
  'islam-tarihi-master': {
    id: 'islam-tarihi-master',
    title: 'İslam Tarihi Ustası',
    description: 'İslam Tarihi genel quizini tamamladın.',
    icon: 'time',
    kind: 'category',
  },
  'islam-ahlaki-master': {
    id: 'islam-ahlaki-master',
    title: 'İslam Ahlakı Ustası',
    description: 'İslam Ahlakı genel quizini tamamladın.',
    icon: 'heart',
    kind: 'category',
  },
};

export function getModuleCompleteAchievementId(moduleId: string): string {
  return `${moduleId}-complete`;
}

export function getQuizPerfectAchievementId(quizId: string): string {
  return `${quizId}-perfect`;
}
