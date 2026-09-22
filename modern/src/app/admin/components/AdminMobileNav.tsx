'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, Download, FileText, LayoutDashboard, LogOut, Menu, Tag, X } from 'lucide-react';
import { logout } from '@/app/admin/actions';

const links = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/calendar', label: 'Calendar', Icon: Calendar },
  { href: '/admin/pricing', label: 'Room prices', Icon: Tag },
  { href: '/admin/invoices', label: 'Invoices', Icon: FileText },
];

export default function AdminMobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleInstall);
  }, []);

  const installApp = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  };

  return <>
    <header className="flex items-center justify-between bg-[var(--color-admin-botanical)] p-4 text-[var(--color-admin-shell)] md:hidden">
      <div>
        <h1 className="font-[var(--font-display)] text-lg">GGR Admin</h1>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-admin-sage)]">Remote operations</p>
      </div>
      <button type="button" className="rounded-md p-2 text-white/90 transition hover:bg-white/10" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="admin-mobile-navigation" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
    {open && <div id="admin-mobile-navigation" className="border-b border-white/10 bg-[var(--color-admin-botanical)] px-4 pb-4 text-[var(--color-admin-shell)] md:hidden">
      <nav className="grid gap-1" aria-label="Admin navigation">
        {links.map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-white/10"><Icon size={18} />{label}</Link>)}
      </nav>
      {installEvent && <button type="button" onClick={installApp} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-md border border-white/20 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"><Download size={18} />Install admin app</button>}
      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="mb-3 break-all text-xs text-[var(--color-admin-sage)]">{email}</p>
        <form action={logout}><button type="submit" className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"><LogOut size={16} /> Sign out</button></form>
      </div>
    </div>}
  </>;
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}
