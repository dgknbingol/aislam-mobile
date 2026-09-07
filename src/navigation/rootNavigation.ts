import { createNavigationContainerRef } from '@react-navigation/native';

import { getAsmaOfDay } from '../constants/asmaUlHusna';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type PendingNotificationNav =
  | { type: 'home' }
  | { type: 'asma'; catalogIndex: number };

let pendingNotificationNav: PendingNotificationNav | null = null;

/** Bildirime tıklanınca ana sayfaya dön (reklam / günlük içerik). */
export function navigateToHomeFromNotification(): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Home');
    pendingNotificationNav = null;
    return;
  }
  pendingNotificationNav = { type: 'home' };
}

/** Esmaül Hüsna bildirimine tıklanınca ilgili isme git. */
export function navigateToAsmaFromNotification(catalogIndex?: number): void {
  const index =
    typeof catalogIndex === 'number' && Number.isFinite(catalogIndex)
      ? Math.max(0, Math.floor(catalogIndex))
      : getAsmaOfDay().catalogIndex;

  if (navigationRef.isReady()) {
    navigationRef.navigate('AsmaUlHusna', { catalogIndex: index });
    pendingNotificationNav = null;
    return;
  }
  pendingNotificationNav = { type: 'asma', catalogIndex: index };
}

export function flushPendingNotificationNavigation(): void {
  if (!pendingNotificationNav || !navigationRef.isReady()) return;

  const pending = pendingNotificationNav;
  pendingNotificationNav = null;

  if (pending.type === 'asma') {
    navigationRef.navigate('AsmaUlHusna', { catalogIndex: pending.catalogIndex });
    return;
  }

  navigationRef.navigate('Home');
}
