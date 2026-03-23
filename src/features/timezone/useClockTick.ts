import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export function useClockTick(): DateTime {
  const [now, setNow] = useState(() => DateTime.now());

  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
