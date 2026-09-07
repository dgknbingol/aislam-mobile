import { AI_CONFIG } from '../config/ai';

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  premium: boolean;
  premiumExpiresAt: string | null;
  createdAt: string;
};

type ApiErrorResponse = {
  message?: string;
  code?: string;
};

function baseUrl(): string {
  return AI_CONFIG.ragBaseUrl.replace(/\/$/, '');
}

async function parseApiError(response: Response): Promise<ApiErrorResponse> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return {};
  }
}

export class AuthApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
    this.name = 'AuthApiError';
  }
}

export async function register(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ token: string; tokenType: string; expiresInSeconds: number; user: UserProfile }> {
  const response = await fetch(`${baseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    }),
  });

  if (!response.ok) {
    const err = await parseApiError(response);
    throw new AuthApiError(err.message ?? 'Kayıt başarısız.', err.code);
  }

  return response.json();
}

export async function login(params: {
  email: string;
  password: string;
}): Promise<{ token: string; tokenType: string; expiresInSeconds: number; user: UserProfile }> {
  const response = await fetch(`${baseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
    }),
  });

  if (!response.ok) {
    const err = await parseApiError(response);
    throw new AuthApiError(err.message ?? 'Giriş başarısız.', err.code);
  }

  return response.json();
}

export async function getMe(token: string): Promise<UserProfile> {
  const response = await fetch(`${baseUrl()}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await parseApiError(response);
    throw new AuthApiError(err.message ?? 'Profil alınamadı.', err.code);
  }

  return response.json() as Promise<UserProfile>;
}

export async function updateDisplayName(token: string, displayName: string): Promise<UserProfile> {
  const response = await fetch(`${baseUrl()}/api/users/me/display-name`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ displayName }),
  });

  if (!response.ok) {
    const err = await parseApiError(response);
    throw new AuthApiError(err.message ?? 'Kullanıcı adı güncellenemedi.', err.code);
  }

  return response.json() as Promise<UserProfile>;
}

