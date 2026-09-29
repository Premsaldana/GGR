import type { Metadata, Viewport } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/admin/actions';
import AdminMobileNav from '@/app/admin/components/AdminMobileNav';
import AdminSidebarNav from '@/app/admin/components/AdminSidebarNav';
import AdminPwaRuntime from '@/app/admin/components/AdminPwaRuntime';
import AdminPushSetup from '@/app/admin/components/AdminPushSetup';

export const metadata: Metadata = {
  title: 'Admin',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'GGR Admin',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#233B35',
  viewportFit: 'cover',
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.email) {
    redirect('/admin/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-admin-mineral)]">
      <AdminPwaRuntime />
      <aside className="hidden w-64 flex-shrink-0 flex-col bg-[var(--color-admin-botanical)] text-[var(--color-admin-shell)] md:flex">
        <div className="p-6">
          <h1 className="font-[var(--font-display)] text-xl font-semibold tracking-wide">Goa Garden Resort</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-[var(--color-admin-sage)]">Admin Portal</p>
        </div>
        <AdminSidebarNav />
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 break-all text-xs text-[var(--color-admin-sage)]">{session.email}</div>
          <form action={logout}><button type="submit" className="flex w-full items-center gap-2 text-sm text-white/75 transition hover:text-white"><LogOut size={16} /> Sign out</button></form>
        </div>
      </aside>
      <main className="relative flex-1 overflow-auto">
        <AdminMobileNav email={session.email} />
        <div className="relative mx-auto h-full max-w-7xl p-4 md:p-8">
          <div className="mb-4 flex justify-end"><AdminPushSetup /></div>
          {children}
        </div>
      </main>
    </div>
  );
}
