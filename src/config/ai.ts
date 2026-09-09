const DEFAULT_RAG_API_URL = 'https://api.e-islam.net';

export const AI_CONFIG = {
  ragBaseUrl: (process.env.EXPO_PUBLIC_RAG_API_URL ?? DEFAULT_RAG_API_URL).replace(
    /\/$/,
    '',
  ),
};
