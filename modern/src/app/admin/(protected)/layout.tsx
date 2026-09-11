import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, LayoutDashboard, LogOut, FileText, Tag } from 'lucide-react';
import { logout } from '@/app/admin/actions';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.email) {
    redirect('/admin/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-admin-mineral)]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[var(--color-admin-botanical)] text-[var(--color-admin-shell)] flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="font-[var(--font-display)] text-xl font-semibold tracking-wide">Goa Garden Resort</h1>
          <p className="text-xs text-[var(--color-admin-sage)] uppercase tracking-widest mt-1">Admin Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition text-sm">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/admin/calendar" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition text-sm">
            <Calendar size={18} /> Calendar
          </Link>
          <Link href="/admin/pricing" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition text-sm">
            <Tag size={18} /> Room prices
          </Link>
          <Link href="/admin/invoices" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition text-sm">
            <FileText size={18} /> Invoices
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-[var(--color-admin-sage)] mb-3 break-all">{session.email}</div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 text-sm text-white/75 hover:text-white transition w-full">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Mobile Header (simplified) */}
        <header className="md:hidden bg-[var(--color-admin-botanical)] text-[var(--color-admin-shell)] p-4 flex justify-between items-center">
          <h1 className="font-[var(--font-display)] text-lg">GGR Admin</h1>
          <form action={logout}>
            <button type="submit" className="text-sm text-white/80 hover:text-white transition">Logout</button>
          </form>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full relative">
          {children}
        </div>
      </main>
    </div>
  );
}
