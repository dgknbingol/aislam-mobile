export type EducationAchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  kind: 'module' | 'quiz' | 'category';
};

export const EDUCATION_ACHIEVEMENTS: Record<string, EducationAchievementDef> = {
  'temel-egitimler-master': {
    id: 'temel-egitimler-master',
    title: 'Temel Eğitimler Ustası',
    description: 'Temel Eğitimler genel quizini tamamladın.',
    icon: 'ribbon',
    kind: 'category',
  },
  'islama-giris-complete': {
    id: 'islama-giris-complete',
    title: 'İslam\'a Giriş Tamamlandı',
    description: 'İslam\'a Giriş modülündeki tüm dersleri bitirdin.',
    icon: 'school',
    kind: 'module',
  },
  'islama-giris-mini-quiz-perfect': {
    id: 'islama-giris-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'İslam\'a Giriş Mini Quiz tüm soruları doğru cevapladın.',
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
  'imanin-sartlari-mini-quiz-perfect': {
    id: 'imanin-sartlari-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'İmanın Şartları Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'islamin-sartlari-complete': {
    id: 'islamin-sartlari-complete',
    title: 'İslam\'ın Şartları Tamamlandı',
    description: 'İslam\'ın Şartları modülündeki tüm dersleri bitirdin.',
    icon: 'star',
    kind: 'module',
  },
  'islamin-sartlari-mini-quiz-perfect': {
    id: 'islamin-sartlari-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'İslam\'ın Şartları Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'abdest-complete': {
    id: 'abdest-complete',
    title: 'Abdest Tamamlandı',
    description: 'Abdest modülündeki tüm dersleri bitirdin.',
    icon: 'water',
    kind: 'module',
  },
  'abdest-mini-quiz-perfect': {
    id: 'abdest-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Abdest Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'gusul-complete': {
    id: 'gusul-complete',
    title: 'Gusül Tamamlandı',
    description: 'Gusül modülündeki tüm dersleri bitirdin.',
    icon: 'water',
    kind: 'module',
  },
  'gusul-mini-quiz-perfect': {
    id: 'gusul-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Gusül Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'namaz-complete': {
    id: 'namaz-complete',
    title: 'Namaz Tamamlandı',
    description: 'Namaz modülündeki tüm dersleri bitirdin.',
    icon: 'moon',
    kind: 'module',
  },
  'namaz-mini-quiz-perfect': {
    id: 'namaz-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Namaz Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'oruc-complete': {
    id: 'oruc-complete',
    title: 'Oruç Tamamlandı',
    description: 'Oruç modülündeki tüm dersleri bitirdin.',
    icon: 'sunny',
    kind: 'module',
  },
  'oruc-mini-quiz-perfect': {
    id: 'oruc-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Oruç Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'zekat-complete': {
    id: 'zekat-complete',
    title: 'Zekât Tamamlandı',
    description: 'Zekât modülündeki tüm dersleri bitirdin.',
    icon: 'cash',
    kind: 'module',
  },
  'zekat-mini-quiz-perfect': {
    id: 'zekat-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Zekât Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'hac-complete': {
    id: 'hac-complete',
    title: 'Hac Tamamlandı',
    description: 'Hac modülündeki tüm dersleri bitirdin.',
    icon: 'airplane',
    kind: 'module',
  },
  'hac-mini-quiz-perfect': {
    id: 'hac-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Hac Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'dua-complete': {
    id: 'dua-complete',
    title: 'Dua Tamamlandı',
    description: 'Dua modülündeki tüm dersleri bitirdin.',
    icon: 'hand-left',
    kind: 'module',
  },
  'dua-mini-quiz-perfect': {
    id: 'dua-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Dua Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'kuran-egitimleri-master': {
    id: 'kuran-egitimleri-master',
    title: 'Kur\'an Eğitimleri Ustası',
    description: 'Kur\'an Eğitimleri genel quizini tamamladın.',
    icon: 'book',
    kind: 'category',
  },
  'kurana-giris-complete': {
    id: 'kurana-giris-complete',
    title: 'Kur\'an\'a Giriş Tamamlandı',
    description: 'Kur\'an\'a Giriş modülündeki tüm dersleri bitirdin.',
    icon: 'book',
    kind: 'module',
  },
  'kurana-giris-mini-quiz-perfect': {
    id: 'kurana-giris-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Kur\'an\'a Giriş Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'elif-ba-complete': {
    id: 'elif-ba-complete',
    title: 'Elif-Ba Tamamlandı',
    description: 'Elif-Ba modülündeki tüm dersleri bitirdin.',
    icon: 'text',
    kind: 'module',
  },
  'elif-ba-mini-quiz-perfect': {
    id: 'elif-ba-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Elif-Ba Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'harekeler-complete': {
    id: 'harekeler-complete',
    title: 'Harekeler Tamamlandı',
    description: 'Harekeler modülündeki tüm dersleri bitirdin.',
    icon: 'musical-notes',
    kind: 'module',
  },
  'harekeler-mini-quiz-perfect': {
    id: 'harekeler-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Harekeler Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'kuran-okumaya-baslangic-complete': {
    id: 'kuran-okumaya-baslangic-complete',
    title: 'Kur\'an Okumaya Başlangıç Tamamlandı',
    description: 'Kur\'an Okumaya Başlangıç modülündeki tüm dersleri bitirdin.',
    icon: 'book',
    kind: 'module',
  },
  'kuran-okumaya-baslangic-mini-quiz-perfect': {
    id: 'kuran-okumaya-baslangic-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Kur\'an Okumaya Başlangıç Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'tecvid-complete': {
    id: 'tecvid-complete',
    title: 'Tecvid Tamamlandı',
    description: 'Tecvid modülündeki tüm dersleri bitirdin.',
    icon: 'mic',
    kind: 'module',
  },
  'tecvid-mini-quiz-perfect': {
    id: 'tecvid-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Tecvid Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'sure-ezberi-complete': {
    id: 'sure-ezberi-complete',
    title: 'Sure Ezberi Tamamlandı',
    description: 'Sure Ezberi modülündeki tüm dersleri bitirdin.',
    icon: 'bookmark',
    kind: 'module',
  },
  'kuranin-tarihi-complete': {
    id: 'kuranin-tarihi-complete',
    title: 'Kur\'an\'ın Tarihi Tamamlandı',
    description: 'Kur\'an\'ın Tarihi modülündeki tüm dersleri bitirdin.',
    icon: 'time',
    kind: 'module',
  },
  'kuranin-tarihi-mini-quiz-perfect': {
    id: 'kuranin-tarihi-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Kur\'an\'ın Tarihi Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'kurani-anlama-complete': {
    id: 'kurani-anlama-complete',
    title: 'Kur\'an\'ı Anlama Tamamlandı',
    description: 'Kur\'an\'ı Anlama modülündeki tüm dersleri bitirdin.',
    icon: 'bulb',
    kind: 'module',
  },
  'kurani-anlama-mini-quiz-perfect': {
    id: 'kurani-anlama-mini-quiz-perfect',
    title: 'Mükemmel Quiz',
    description: 'Kur\'an\'ı Anlama Mini Quiz tüm soruları doğru cevapladın.',
    icon: 'trophy',
    kind: 'quiz',
  },
  'siyer-master': {
    id: 'siyer-master',
    title: 'Siyer Ustası',
    description: 'Siyer genel quizini tamamladın.',
    icon: 'walk',
    kind: 'category',
  },
  'siyer-complete': {
    id: 'siyer-complete',
    title: 'Siyer Tamamlandı',
    description: 'Siyer modülündeki tüm dersleri bitirdin.',
    icon: 'walk',
    kind: 'module',
  },
  'hadis-master': {
    id: 'hadis-master',
    title: 'Hadis Ustası',
    description: 'Hadis genel quizini tamamladın.',
    icon: 'chatbubbles',
    kind: 'category',
  },
  'hadis-complete': {
    id: 'hadis-complete',
    title: 'Hadis Tamamlandı',
    description: 'Hadis modülündeki tüm dersleri bitirdin.',
    icon: 'chatbubbles',
    kind: 'module',
  },
  'fikih-master': {
    id: 'fikih-master',
    title: 'Fıkıh Ustası',
    description: 'Fıkıh genel quizini tamamladın.',
    icon: 'scale',
    kind: 'category',
  },
  'fikih-complete': {
    id: 'fikih-complete',
    title: 'Fıkıh Tamamlandı',
    description: 'Fıkıh modülündeki tüm dersleri bitirdin.',
    icon: 'scale',
    kind: 'module',
  },
  'akaid-master': {
    id: 'akaid-master',
    title: 'Akaid Ustası',
    description: 'Akaid genel quizini tamamladın.',
    icon: 'shield-checkmark',
    kind: 'category',
  },
  'akaid-complete': {
    id: 'akaid-complete',
    title: 'Akaid Tamamlandı',
    description: 'Akaid modülündeki tüm dersleri bitirdin.',
    icon: 'shield-checkmark',
    kind: 'module',
  },
  'islam-tarihi-master': {
    id: 'islam-tarihi-master',
    title: 'İslam Tarihi Ustası',
    description: 'İslam Tarihi genel quizini tamamladın.',
    icon: 'time',
    kind: 'category',
  },
  'islam-tarihi-complete': {
    id: 'islam-tarihi-complete',
    title: 'İslam Tarihi Tamamlandı',
    description: 'İslam Tarihi modülündeki tüm dersleri bitirdin.',
    icon: 'time',
    kind: 'module',
  },
  'islam-ahlaki-master': {
    id: 'islam-ahlaki-master',
    title: 'İslam Ahlakı Ustası',
    description: 'İslam Ahlakı genel quizini tamamladın.',
    icon: 'heart',
    kind: 'category',
  },
  'islam-ahlaki-complete': {
    id: 'islam-ahlaki-complete',
    title: 'İslam Ahlakı Tamamlandı',
    description: 'İslam Ahlakı modülündeki tüm dersleri bitirdin.',
    icon: 'heart',
    kind: 'module',
  },
};

export function getModuleCompleteAchievementId(moduleId: string): string {
  return `${moduleId}-complete`;
}

export function getQuizPerfectAchievementId(quizId: string): string {
  return `${quizId}-perfect`;
}

export function getCategoryMasterAchievementId(categoryId: string): string {
  return `${categoryId}-master`;
}

export function resolveEducationAchievement(id: string): EducationAchievementDef {
  const known = EDUCATION_ACHIEVEMENTS[id];
  if (known) return known;

  if (id.endsWith('-master')) {
    const raw = id.slice(0, -'-master'.length).replace(/-/g, ' ');
    const title = raw.replace(/\b\w/g, (c) => c.toUpperCase()) + ' Ustası';
    return {
      id,
      title,
      description: 'Kategori genel quizini tamamladın.',
      icon: 'ribbon',
      kind: 'category',
    };
  }

  if (id.endsWith('-perfect')) {
    return {
      id,
      title: 'Mükemmel Quiz',
      description: 'Bir quizi tüm soruları doğru cevapladın.',
      icon: 'trophy',
      kind: 'quiz',
    };
  }

  if (id.endsWith('-complete')) {
    const raw = id.slice(0, -'-complete'.length).replace(/-/g, ' ');
    const title = raw.replace(/\b\w/g, (c) => c.toUpperCase()) + ' Tamamlandı';
    return {
      id,
      title,
      description: 'Bu modüldeki tüm dersleri bitirdin.',
      icon: 'school',
      kind: 'module',
    };
  }

  return {
    id,
    title: 'Başarım',
    description: 'Yeni bir başarım kazandın.',
    icon: 'ribbon',
    kind: 'module',
  };
}
