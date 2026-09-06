import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import './admin.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  // Exclude login page from session check in layout
  // (We handle login protection in its own page component or middleware. Here we just wrap the styling)
  return (
    <div className="min-h-screen bg-[var(--color-admin-mineral)] font-sans antialiased text-[var(--color-admin-ink)]">
      {children}
    </div>
  );
}
