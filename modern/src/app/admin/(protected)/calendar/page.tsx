import CalendarView from '../../components/CalendarView';

export default function CalendarPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-[var(--font-display)] font-semibold mb-1">Calendar</h2>
          <p className="text-[var(--color-admin-sage)] text-sm">Select an empty date to create a new reservation.</p>
        </div>
      </header>
      
      <div className="flex-1 min-h-[600px] bg-[var(--color-admin-shell)] border border-[var(--color-admin-mist)] rounded-xl shadow-sm p-4 relative overflow-hidden">
        <CalendarView />
      </div>
    </div>
  );
}
