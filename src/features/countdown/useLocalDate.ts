import { useEffect, useState } from 'react';
import { getLocalDateOnly } from './countdown';

export function useLocalDate() {
  const [today, setToday] = useState(getLocalDateOnly);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const currentDate = getLocalDateOnly();
      setToday((current) => current === currentDate ? current : currentDate);
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refresh, Math.max(1, nextMidnight.getTime() - now.getTime() + 20));
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearTimeout(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  return today;
}
