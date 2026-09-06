import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-2xl font-[var(--font-display)] font-semibold mb-2">Overview</h2>
        <p className="text-[var(--color-admin-sage)] text-sm">Today's snapshot at Goa Garden Resort</p>
      </header>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--color-admin-shell)] border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--color-admin-sage)] uppercase tracking-wider mb-2">In-House Guests</h3>
          <p className="text-3xl font-[var(--font-display)]">0</p>
        </div>
        <div className="bg-[var(--color-admin-shell)] border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--color-admin-sage)] uppercase tracking-wider mb-2">Today's Check-ins</h3>
          <p className="text-3xl font-[var(--font-display)]">0</p>
        </div>
        <div className="bg-[var(--color-admin-shell)] border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--color-admin-sage)] uppercase tracking-wider mb-2">Today's Check-outs</h3>
          <p className="text-3xl font-[var(--font-display)]">0</p>
        </div>
      </div>

      <div className="mt-8 flex justify-center p-12 bg-white/50 border border-dashed border-[var(--color-admin-mist)] rounded-xl">
        <div className="text-center">
          <p className="text-[var(--color-admin-sage)] mb-4">No recent activity to display.</p>
          <Link href="/admin/calendar" className="inline-block bg-[var(--color-admin-terracotta)] text-[var(--color-admin-shell)] px-6 py-2 rounded-md font-medium text-sm hover:bg-orange-700 transition">
            Open Calendar
          </Link>
        </div>
      </div>
    </div>
  );
}
