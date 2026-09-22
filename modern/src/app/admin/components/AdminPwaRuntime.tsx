'use client';

import { useEffect, useState } from 'react';

export default function AdminPwaRuntime() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/admin' }).catch(() => undefined);
    }

    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-admin-brass)] bg-[var(--color-admin-botanical)] px-4 py-3 text-center text-xs font-medium text-white shadow-lg">
      You are offline. Changes will not be submitted until the connection returns.
    </div>
  );
}
