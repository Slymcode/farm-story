import { useEffect, useRef, useState } from 'react';

const read = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);

/** Browser connectivity (navigator.onLine + online/offline events). `justReconnected` is true for a few seconds after coming back. */
export function useOnlineStatus(reconnectedForMs = 5000) {
  const [online, setOnline] = useState(read);
  const [justReconnected, setJust] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const up = () => { setOnline(true); setJust(true); clearTimeout(timer.current); timer.current = setTimeout(() => setJust(false), reconnectedForMs); };
    const down = () => { setOnline(false); setJust(false); clearTimeout(timer.current); };
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); clearTimeout(timer.current); };
  }, [reconnectedForMs]);
  return { online, justReconnected };
}
