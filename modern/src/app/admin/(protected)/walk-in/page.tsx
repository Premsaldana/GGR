import WalkInReceiptForm from './WalkInReceiptForm';
import { getUnits } from '../calendar/actions';

export default async function WalkInReceiptPage() {
  const units = await getUnits();
  return (
    <div className="h-full overflow-auto bg-[var(--color-admin-shell)] p-6">
      <WalkInReceiptForm units={units.map((unit) => ({ id: unit.id, displayName: unit.displayName }))} />
    </div>
  );
}
