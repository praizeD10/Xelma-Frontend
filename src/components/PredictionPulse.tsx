import { TrendingUp } from 'lucide-react';
import { usePredictionPulse } from '../hooks/usePredictionPulse';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * PredictionPulse — a compact live counter that shows how many predictions
 * have been submitted in the last 60 seconds.
 *
 * - Subscribes to the socket feed via `usePredictionPulse`.
 * - When the feed is offline, renders a static count with a muted "offline"
 *   visual instead of crashing or hiding.
 * - Skips the bump animation entirely when `prefers-reduced-motion` is set.
 *
 * Designed to sit inline next to RoundTimeline or inside LiveGameStatsPanel.
 */
export function PredictionPulse({ className = '' }: { className?: string }) {
  const { count, isLive, bump } = usePredictionPulse();
  const { reduced } = useReducedMotion();

  const shouldBump = bump && !reduced;

  return (
    <span
      role="status"
      aria-label={`${count} prediction${count !== 1 ? 's' : ''} in the last minute`}
      aria-live="polite"
      aria-atomic="true"
      data-live={String(isLive)}
      data-count={count}
      className={[
        'inline-flex items-center gap-1.5',
        'rounded-full border px-2.5 py-1',
        'text-[11px] font-bold uppercase tracking-wide',
        'select-none transition-colors',
        isLive
          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
          : 'border-white/10 bg-white/5 text-gray-500',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Pulse dot — only animates when live and motion is ok */}
      <span
        aria-hidden="true"
        className={[
          'h-1.5 w-1.5 shrink-0 rounded-full',
          isLive
            ? reduced
              ? 'bg-cyan-400'
              : 'bg-cyan-400 animate-pulse'
            : 'bg-gray-600',
        ].join(' ')}
      />

      <TrendingUp className="h-3 w-3 shrink-0" aria-hidden />

      {/* Counter — a CSS scale bump fires on each new prediction */}
      <span
        key={shouldBump ? `bump-${count}` : 'static'}
        className={shouldBump ? 'animate-in zoom-in-90 duration-150' : undefined}
      >
        {count}
      </span>

      <span className="font-medium normal-case opacity-70">
        {isLive ? 'recent' : 'offline'}
      </span>
    </span>
  );
}

export default PredictionPulse;
