import type { ReactNode } from 'react';

type TrendPoint = { date: string; amountMinorUnits: number };
type OccupancyPoint = { date: string; occupied: number; total: number };

const money = (minorUnits: number) => `₹${(minorUnits / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const maxOf = (values: number[]) => Math.max(1, ...values);

function ChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="bg-white border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm"><h3 className="text-sm font-semibold text-[var(--color-admin-forest)]">{title}</h3><p className="text-xs text-[var(--color-admin-sage)] mt-1 mb-5">{description}</p>{children}</section>;
}

export function DashboardCharts({ revenueTrend, occupancyTrend }: { revenueTrend: TrendPoint[]; occupancyTrend: OccupancyPoint[] }) {
  const revenueMax = maxOf(revenueTrend.map((point) => point.amountMinorUnits));
  const occupancyMax = maxOf(occupancyTrend.map((point) => point.total));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <ChartCard title="Collected revenue · last 14 days" description="Advances and completed invoice payments recorded in the ledger.">
        <div className="flex items-end gap-1 h-44" aria-label="Collected revenue bar chart">
          {revenueTrend.map((point) => <div key={point.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${shortDate(point.date)}: ${money(point.amountMinorUnits)}`}><div className="w-full max-w-7 bg-[var(--color-admin-terracotta)]/80 rounded-t" style={{ height: `${Math.max(3, (point.amountMinorUnits / revenueMax) * 100)}%` }} /><span className="text-[9px] text-[var(--color-admin-sage)] rotate-[-45deg] origin-top-left whitespace-nowrap">{point.date.endsWith('-01') || point.date === revenueTrend.at(-1)?.date ? shortDate(point.date) : ''}</span></div>)}
        </div>
      </ChartCard>

      <ChartCard title="Occupancy trend · last 14 days" description="Occupied rooms compared with active room inventory.">
        <div className="relative h-44 flex items-end gap-1 border-b border-l border-[var(--color-admin-mist)] px-2" aria-label="Occupancy bar chart">
          {occupancyTrend.map((point) => <div key={point.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${shortDate(point.date)}: ${point.occupied}/${point.total} occupied`}><div className="w-full max-w-7 bg-[var(--color-admin-botanical)]/80 rounded-t" style={{ height: `${Math.max(point.occupied > 0 ? 5 : 1, (point.occupied / occupancyMax) * 100)}%` }} /></div>)}
        </div>
        <div className="flex justify-between text-[10px] text-[var(--color-admin-sage)] mt-2"><span>{shortDate(occupancyTrend[0]?.date || new Date().toISOString().slice(0, 10))}</span><span>{shortDate(occupancyTrend.at(-1)?.date || new Date().toISOString().slice(0, 10))}</span></div>
      </ChartCard>
    </div>
  );
}
