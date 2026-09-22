import type { Metadata, Viewport } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, LayoutDashboard, LogOut, FileText, Tag } from 'lucide-react';
import { logout } from '@/app/admin/actions';
import AdminMobileNav from '@/app/admin/components/AdminMobileNav';
import AdminPwaRuntime from '@/app/admin/components/AdminPwaRuntime';

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
        <nav className="flex-1 space-y-2 px-4 py-4" aria-label="Admin navigation">
          <Link href="/admin" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-white/10"><LayoutDashboard size={18} /> Dashboard</Link>
          <Link href="/admin/calendar" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-white/10"><Calendar size={18} /> Calendar</Link>
          <Link href="/admin/pricing" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-white/10"><Tag size={18} /> Room prices</Link>
          <Link href="/admin/invoices" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-white/10"><FileText size={18} /> Invoices</Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 break-all text-xs text-[var(--color-admin-sage)]">{session.email}</div>
          <form action={logout}><button type="submit" className="flex w-full items-center gap-2 text-sm text-white/75 transition hover:text-white"><LogOut size={16} /> Sign out</button></form>
        </div>
      </aside>
      <main className="relative flex-1 overflow-auto">
        <AdminMobileNav email={session.email} />
        <div className="relative mx-auto h-full max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
