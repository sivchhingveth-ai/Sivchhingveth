import React, { useEffect, useRef } from 'react';
import useAppStore from '../store/appStore';

/**
 * TimeProvider - Single source of truth for time
 * Replaces 3 separate setInterval timers across components
 * Updates every minute (60000ms) instead of every second
 */
export function TimeProvider({ children }: { children: React.ReactNode }) {
  const updateTime = useAppStore((state) => state.updateTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial update
    updateTime();

    // Single interval for entire app - updates every minute
    // Change to 1000 if you need second-level precision
    intervalRef.current = setInterval(() => {
      updateTime();
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateTime]);

  return <>{children}</>;
}

/**
 * Hook to access current time from store
 * Usage: const { now, todayStr } = useTime();
 */
export function useTime() {
  return useAppStore((state) => ({
    now: state.now,
    todayStr: state.todayStr,
    todayDate: state.todayDate,
  }));
}
