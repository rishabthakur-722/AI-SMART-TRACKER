import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseRealTimeOptions {
  /** Polling interval in milliseconds. Default 30_000 (30s). */
  interval?: number;
  /** Exponential backoff on error — doubles delay up to maxInterval. Default true. */
  backoff?: boolean;
  /** Maximum polling interval in ms during backoff. Default 300_000 (5 min). */
  maxInterval?: number;
  /** Auto-start polling on mount. Default true. */
  autoStart?: boolean;
  /** Pause polling when the browser tab is hidden. Default true. */
  pauseWhenHidden?: boolean;
}

export interface UseRealTimeReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => void;
  start: () => void;
  stop: () => void;
  isPolling: boolean;
}

/**
 * useRealTime — Generic polling hook with exponential backoff.
 *
 * @param fetcher  Async function that returns T.
 * @param options  Polling configuration.
 *
 * @example
 * const { data, loading } = useRealTime(() => marketService.getQuote('AAPL'), { interval: 10_000 });
 */
export function useRealTime<T>(
  fetcher: () => Promise<T>,
  options: UseRealTimeOptions = {}
): UseRealTimeReturn<T> {
  const {
    interval = 30_000,
    backoff = true,
    maxInterval = 300_000,
    autoStart = true,
    pauseWhenHidden = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalRef = useRef(interval);
  const isMountedRef = useRef(true);
  const pollingRef = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(async () => {
    if (!pollingRef.current || !isMountedRef.current) return;
    if (pauseWhenHidden && document.hidden) {
      timerRef.current = setTimeout(tick, currentIntervalRef.current);
      return;
    }

    setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
        currentIntervalRef.current = interval; // reset backoff on success
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Fetch failed'));
        if (backoff) {
          currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, maxInterval);
        }
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }

    if (pollingRef.current && isMountedRef.current) {
      timerRef.current = setTimeout(tick, currentIntervalRef.current);
    }
  }, [interval, backoff, maxInterval, pauseWhenHidden]);

  const refresh = useCallback(() => {
    clearTimer();
    void tick();
  }, [clearTimer, tick]);

  const start = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setIsPolling(true);
    currentIntervalRef.current = interval;
    void tick();
  }, [interval, tick]);

  const stop = useCallback(() => {
    pollingRef.current = false;
    setIsPolling(false);
    clearTimer();
  }, [clearTimer]);

  // Visibility change listener
  useEffect(() => {
    if (!pauseWhenHidden) return;
    const handleVisibility = () => {
      if (!document.hidden && pollingRef.current) {
        clearTimer();
        void tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pauseWhenHidden, clearTimer, tick]);

  // Auto-start
  useEffect(() => {
    isMountedRef.current = true;
    if (autoStart) start();
    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, [autoStart, start, stop]);

  return { data, loading, error, lastUpdated, refresh, start, stop, isPolling };
}
