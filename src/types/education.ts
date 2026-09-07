export type EducationBlockType = 'heading' | 'paragraph' | 'bullet' | 'youtube' | 'source' | 'table';

export type EducationBlock = {
  type: EducationBlockType;
  text?: string | null;
  title?: string | null;
  url?: string | null;
  items?: string[] | null;
};

export type EducationTopicContent = {
  readingMinutes?: number | null;
  blocks: EducationBlock[];
};

export type EducationLessonSummary = {
  id: string;
  title: string;
  summary: string;
  hasContent: boolean;
};

export type EducationQuizMeta = {
  id: string;
  title: string;
  type: 'MODULE' | 'CATEGORY';
  questionCount: number;
  passPercent: number;
  achievementId: string;
};

export type EducationModule = {
  id: string;
  title: string;
  summary: string;
  quiz: EducationQuizMeta | null;
  lessons: EducationLessonSummary[];
};

export type EducationCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  quiz: EducationQuizMeta | null;
  modules: EducationModule[];
};

export type EducationCatalog = {
  version: number;
  categories: EducationCategory[];
};

export type EducationTopicDetail = {
  id: string;
  categoryId: string;
  categoryTitle: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  summary: string;
  content: EducationTopicContent | null;
};

export type EducationQuizOption = {
  label: string;
  text: string;
  correct: boolean;
};

export type EducationQuizQuestion = {
  question: string;
  options: EducationQuizOption[];
};

export type EducationQuizDetail = {
  id: string;
  title: string;
  moduleId: string;
  questions: EducationQuizQuestion[];
};

/** @deprecated Use EducationLessonSummary */
export type EducationTopicSummary = EducationLessonSummary;
