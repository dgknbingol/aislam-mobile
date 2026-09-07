const DEFAULT_RAG_API_URL = 'http://localhost:8080';

export const AI_CONFIG = {
  ragBaseUrl: (process.env.EXPO_PUBLIC_RAG_API_URL ?? DEFAULT_RAG_API_URL).replace(
    /\/$/,
    '',
  ),
};
