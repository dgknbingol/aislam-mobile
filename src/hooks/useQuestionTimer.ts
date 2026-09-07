import { useEffect, useRef, useState } from 'react';

interface UseQuestionTimerOptions {
  durationMs: number;
  questionKey: string | number;
  enabled: boolean;
  onExpire?: () => void;
}

export function useQuestionTimer({
  durationMs,
  questionKey,
  enabled,
  onExpire,
}: UseQuestionTimerOptions) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [isExpired, setIsExpired] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!enabled) return;

    setRemainingMs(durationMs);
    setIsExpired(false);
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      setRemainingMs(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        onExpireRef.current?.();
        return true;
      }

      return false;
    };

    if (tick()) return;

    const interval = setInterval(() => {
      if (tick()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [durationMs, enabled, questionKey]);

  const remainingSec = Math.ceil(remainingMs / 1000);
  const elapsedMs = durationMs - remainingMs;
  const progress = durationMs > 0 ? remainingMs / durationMs : 0;

  return {
    remainingMs,
    remainingSec,
    elapsedMs,
    progress,
    isExpired,
  };
}
