import type { ReactNode } from 'react';

type TrendPoint = { date: string; amountMinorUnits: number };
type OccupancyPoint = { date: string; occupied: number; total: number };
type RoomTypePoint = { roomType: string; revenueMinorUnits: number; occupancyRate: number; bookings: number; available: number; unitCount: number };
type StatusPoint = { status: string; count: number };
type MonthlyPoint = { month: string; revenueMinorUnits: number; bookings: number };

const money = (minorUnits: number) => `₹${(minorUnits / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const maxOf = (values: number[]) => Math.max(1, ...values);

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="bg-white border border-[var(--color-admin-mist)] rounded-xl p-5 shadow-sm"><h3 className="text-sm font-semibold text-[var(--color-admin-forest)] mb-4">{title}</h3>{children}</section>;
}

export function DashboardCharts({ revenueTrend, occupancyTrend, roomTypes, statusBreakdown, monthlyTrend }: {
  revenueTrend: TrendPoint[];
  occupancyTrend: OccupancyPoint[];
  roomTypes: RoomTypePoint[];
  statusBreakdown: StatusPoint[];
  monthlyTrend: MonthlyPoint[];
}) {
  const revenueMax = maxOf(revenueTrend.map((point) => point.amountMinorUnits));
  const monthlyMax = maxOf(monthlyTrend.map((point) => point.revenueMinorUnits));
  const statusMax = maxOf(statusBreakdown.map((point) => point.count));
  const occupancyMax = maxOf(occupancyTrend.map((point) => point.total));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <Card title="Collected revenue · last 14 days">
        <div className="flex items-end gap-1 h-44">
          {revenueTrend.map((point) => <div key={point.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group" title={`${shortDate(point.date)}: ${money(point.amountMinorUnits)}`}><div className="w-full max-w-7 bg-[var(--color-admin-terracotta)]/80 rounded-t" style={{ height: `${Math.max(3, (point.amountMinorUnits / revenueMax) * 100)}%` }} /><span className="text-[9px] text-[var(--color-admin-sage)] rotate-[-45deg] origin-top-left whitespace-nowrap">{point.date.endsWith('-01') || point.date === revenueTrend.at(-1)?.date ? shortDate(point.date) : ''}</span></div>)}
        </div>
        <p className="text-xs text-[var(--color-admin-sage)] mt-4">Based on advances and completed invoice payments recorded in the ledger.</p>
      </Card>

      <Card title="Occupancy trend · last 14 days">
        <div className="relative h-44 flex items-end gap-1 border-b border-l border-[var(--color-admin-mist)] px-2">
          {occupancyTrend.map((point) => <div key={point.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${shortDate(point.date)}: ${point.occupied}/${point.total} occupied`}><div className="w-full max-w-7 bg-[var(--color-admin-botanical)]/80 rounded-t" style={{ height: `${Math.max(point.occupied > 0 ? 5 : 1, (point.occupied / occupancyMax) * 100)}%` }} /></div>)}
        </div>
        <div className="flex justify-between text-[10px] text-[var(--color-admin-sage)] mt-2"><span>{shortDate(occupancyTrend[0]?.date || new Date().toISOString().slice(0, 10))}</span><span>{shortDate(occupancyTrend.at(-1)?.date || new Date().toISOString().slice(0, 10))}</span></div>
      </Card>

      <Card title="Revenue by room type">
        <div className="space-y-4">
          {roomTypes.map((room) => <div key={room.roomType}><div className="flex justify-between text-sm mb-1"><span className="font-medium">{room.roomType}</span><span className="text-[var(--color-admin-sage)]">{money(room.revenueMinorUnits)}</span></div><div className="h-2 bg-[var(--color-admin-mineral)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-admin-brass)] rounded-full" style={{ width: `${Math.max(room.revenueMinorUnits > 0 ? 4 : 0, (room.revenueMinorUnits / maxOf(roomTypes.map((item) => item.revenueMinorUnits))) * 100)}%` }} /></div><p className="text-xs text-[var(--color-admin-sage)] mt-1">{room.bookings} bookings · {room.occupancyRate.toFixed(0)}% occupied today · {room.available} available</p></div>)}
        </div>
      </Card>

      <Card title="Booking status breakdown">
        <div className="space-y-4">
          {statusBreakdown.map((item) => <div key={item.status}><div className="flex justify-between text-sm mb-1"><span className="capitalize">{item.status}</span><span className="font-semibold">{item.count}</span></div><div className="h-2 bg-[var(--color-admin-mineral)] rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.status === 'confirmed' ? 'bg-[var(--color-admin-botanical)]' : item.status === 'cancelled' ? 'bg-[var(--color-admin-danger)]' : 'bg-[var(--color-admin-brass)]'}`} style={{ width: `${(item.count / statusMax) * 100}%` }} /></div></div>)}
        </div>
      </Card>

      <Card title="Monthly collected revenue and bookings">
        <div className="space-y-3">
          {monthlyTrend.map((item) => <div key={item.month} className="grid grid-cols-[64px_1fr_72px] items-center gap-3 text-xs"><span className="text-[var(--color-admin-sage)]">{item.month}</span><div className="h-2 bg-[var(--color-admin-mineral)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-admin-terracotta)] rounded-full" style={{ width: `${Math.max(item.revenueMinorUnits > 0 ? 4 : 0, (item.revenueMinorUnits / monthlyMax) * 100)}%` }} /></div><span className="text-right font-medium">{item.bookings} bookings</span></div>)}
        </div>
      </Card>
    </div>
  );
}
