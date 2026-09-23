'use client';

import { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export default function AdminPushSetup() {
  const [state, setState] = useState<'idle' | 'enabled' | 'unsupported' | 'loading' | 'error'>('idle');
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const enableNotifications = async () => {
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }

    setState('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('error');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const response = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error('Subscription request failed');
      setState('enabled');
    } catch (error) {
      console.error('Could not enable admin notifications:', error);
      setState('error');
    }
  };

  if (!publicKey || state === 'unsupported') return null;
  if (state === 'enabled') {
    return <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-admin-sage)]"><Check size={15} /> Notifications enabled</div>;
  }

  return (
    <button type="button" onClick={enableNotifications} disabled={state === 'loading'} className="admin-button admin-button--secondary text-xs">
      {state === 'error' ? <BellOff size={15} /> : <Bell size={15} />}
      {state === 'loading' ? 'Enabling…' : state === 'error' ? 'Try notifications again' : 'Enable notifications'}
    </button>
  );
}
