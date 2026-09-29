'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ExternalLink, FileText, LayoutDashboard, Tag } from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/calendar', label: 'Calendar', Icon: Calendar },
  { href: '/admin/pricing', label: 'Room prices', Icon: Tag },
  { href: '/admin/invoices', label: 'Invoices', Icon: FileText },
];

function isActivePath(pathname: string, href: string) {
  return href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-2 px-4 py-4" aria-label="Admin navigation">
      {links.map(({ href, label, Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition ${active ? 'border-[var(--color-admin-brass)] bg-white/15 font-semibold text-white' : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-3 rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <ExternalLink size={18} />
        View resort website
      </Link>
    </nav>
  );
}

export { isActivePath };
