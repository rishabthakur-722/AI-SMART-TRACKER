import { useEffect, useState } from 'react';

export type TradingSession = 'pre-market' | 'open' | 'after-hours' | 'closed' | 'weekend';

export interface MarketStatus {
  session: TradingSession;
  label: string;
  description: string;
  /** True when the primary US equity session is live. */
  isLive: boolean;
  /** Local time in New York (ET) */
  etTime: string;
  /** Minutes until next session change. */
  minutesUntilNext: number;
  nextSessionLabel: string;
}

function getETDate(): Date {
  // Convert current time to US/Eastern (handles DST)
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function computeStatus(): MarketStatus {
  const now = getETDate();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const etTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

  // Weekend
  if (day === 0 || day === 6) {
    const minutesUntilMonday = day === 6 ? (2 * 24 * 60 - totalMinutes + 4 * 60) : (24 * 60 - totalMinutes + 4 * 60);
    return {
      session: 'weekend',
      label: 'Weekend',
      description: 'Markets are closed for the weekend.',
      isLive: false,
      etTime,
      minutesUntilNext: minutesUntilMonday,
      nextSessionLabel: 'Pre-Market (Mon)',
    };
  }

  // Weekday sessions (in ET minutes from midnight)
  const PRE_START = 4 * 60;       //  4:00 AM
  const OPEN_START = 9 * 60 + 30; //  9:30 AM
  const CLOSE_END = 16 * 60;      //  4:00 PM
  const AFTER_END = 20 * 60;      //  8:00 PM

  if (totalMinutes >= PRE_START && totalMinutes < OPEN_START) {
    return {
      session: 'pre-market',
      label: 'Pre-Market',
      description: 'Extended hours trading — limited liquidity.',
      isLive: false,
      etTime,
      minutesUntilNext: OPEN_START - totalMinutes,
      nextSessionLabel: 'Market Open',
    };
  }

  if (totalMinutes >= OPEN_START && totalMinutes < CLOSE_END) {
    return {
      session: 'open',
      label: 'Market Open',
      description: 'NYSE & NASDAQ are live and trading.',
      isLive: true,
      etTime,
      minutesUntilNext: CLOSE_END - totalMinutes,
      nextSessionLabel: 'After-Hours',
    };
  }

  if (totalMinutes >= CLOSE_END && totalMinutes < AFTER_END) {
    return {
      session: 'after-hours',
      label: 'After-Hours',
      description: 'Extended hours — reduced volume.',
      isLive: false,
      etTime,
      minutesUntilNext: AFTER_END - totalMinutes,
      nextSessionLabel: 'Market Closed',
    };
  }

  // Closed (before pre-market OR after after-hours)
  const minutesUntilPreMarket = totalMinutes < PRE_START
    ? PRE_START - totalMinutes
    : 24 * 60 - totalMinutes + PRE_START;

  return {
    session: 'closed',
    label: 'Closed',
    description: 'Markets are closed.',
    isLive: false,
    etTime,
    minutesUntilNext: minutesUntilPreMarket,
    nextSessionLabel: 'Pre-Market',
  };
}

/**
 * useMarketStatus — Returns the current US market trading session.
 * Updates every 30 seconds.
 *
 * @example
 * const { session, label, isLive, etTime } = useMarketStatus();
 */
export function useMarketStatus(): MarketStatus {
  const [status, setStatus] = useState<MarketStatus>(computeStatus);

  useEffect(() => {
    const update = () => setStatus(computeStatus());
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return status;
}
