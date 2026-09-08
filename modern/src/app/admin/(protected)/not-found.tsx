import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <h2 className="text-3xl font-bold text-[var(--color-admin-forest)]">Record Not Found</h2>
      <p className="text-gray-600">The requested admin record could not be found or has been deleted.</p>
      <Link href="/admin/calendar" className="text-[var(--color-admin-terracotta)] hover:underline">
        Return to Calendar
      </Link>
    </div>
  );
}
