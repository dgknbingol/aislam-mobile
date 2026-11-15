import { ensureAppUserId } from './appUserStorage';
import { ensureDeviceAccessToken } from './deviceSession';

/**
 * Mobil → API ortak header’lar.
 * Bearer cihaz JWT + X-App-User-Id (token subject ile aynı).
 */
export async function apiClientHeaders(json = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  };
  const [token, appUserId] = await Promise.all([
    ensureDeviceAccessToken(),
    ensureAppUserId(),
  ]);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  headers['X-App-User-Id'] = appUserId;
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}
