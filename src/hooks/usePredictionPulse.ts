import { useEffect, useRef, useState } from 'react';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from './useConnectionStatus';

/** How long a recent-prediction entry stays in the rolling window (ms). */
const WINDOW_MS = 60_000;

/** Cooldown before the bump animation can re-fire (ms). Prevents spam. */
const BUMP_COOLDOWN_MS = 800;

export interface PredictionPulseState {
  /** Number of predictions received in the last WINDOW_MS. */
  count: number;
  /** True when the socket feed is live. */
  isLive: boolean;
  /** Bumped to `true` briefly on each new prediction, then resets. */
  bump: boolean;
}

/**
 * Subscribes to prediction socket events and maintains a rolling 60-second
 * count. When the socket is offline the count is kept but `isLive` is false,
 * so the UI can degrade gracefully instead of resetting to zero.
 */
export function usePredictionPulse(): PredictionPulseState {
  const { isConnected } = useConnectionStatus();
  // Each entry is the timestamp at which we received the event.
  const windowRef = useRef<number[]>([]);
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);
  const bumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownRef = useRef(false);

  // Recompute count by dropping entries older than WINDOW_MS.
  const flushWindow = () => {
    const now = Date.now();
    windowRef.current = windowRef.current.filter((t) => now - t < WINDOW_MS);
    setCount(windowRef.current.length);
  };

  // Bump animation: set true, reset after cooldown.
  const triggerBump = () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setBump(true);
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = setTimeout(() => {
      setBump(false);
      cooldownRef.current = false;
    }, BUMP_COOLDOWN_MS);
  };

  useEffect(() => {
    const unsub = socketService.onPredictionCreated(() => {
      windowRef.current.push(Date.now());
      flushWindow();
      triggerBump();
    });

    // Decay the window over time so stale counts are purged even without new events.
    const decay = setInterval(flushWindow, WINDOW_MS / 4);

    return () => {
      unsub();
      clearInterval(decay);
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { count, isLive: isConnected, bump };
}
