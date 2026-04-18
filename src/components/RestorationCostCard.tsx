import { useMemo } from 'react';
import { useHourlyRate } from '@/hooks/useAppSettings';

type Task = { status: string; labor_hours: number | null };
type Expenses = {
  parts_cost?: number | null;
  moving_cost?: number | null;
  marketing_cost?: number | null;
  purchase_price?: number | null;
} | null | undefined;

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtH(h: number) {
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(2).replace(/\.?0+$/, '')}h`;
}

function Row({ label, hours, value, bold }: { label: string; hours?: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className={`text-xs ${bold ? 'font-heading text-lg font-bold text-primary' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <div className="flex items-baseline gap-3">
        {hours && <span className="font-mono text-xs text-muted-foreground">{hours}</span>}
        <span className={bold
          ? 'font-heading text-lg font-bold text-primary text-right'
          : 'font-mono text-sm text-foreground text-right'}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function RestorationCostCard({ tasks, expenses }: { tasks: Task[]; expenses: Expenses }) {
  const { data: rate = 100 } = useHourlyRate();

  const totals = useMemo(() => {
    const hours = tasks
      .filter(t => t.status === 'done')
      .reduce((s, t) => s + (Number(t.labor_hours) || 0), 0);
    const labor = hours * rate;
    const parts = Number(expenses?.parts_cost) || 0;
    const purchase = Number(expenses?.purchase_price) || 0;
    const other = (Number(expenses?.moving_cost) || 0) + (Number(expenses?.marketing_cost) || 0);
    return { hours, labor, parts, purchase, other, grand: labor + parts + purchase + other };
  }, [tasks, expenses, rate]);

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Restoration Cost to Date
      </h3>
      <div className="divide-y divide-primary/15">
        <Row label="Labor" hours={fmtH(totals.hours)} value={fmt(totals.labor)} />
        <Row label="Parts" value={fmt(totals.parts)} />
        <Row label="Purchase" value={fmt(totals.purchase)} />
        <Row label="Other Exp." value={fmt(totals.other)} />
        <Row label="TOTAL" value={fmt(totals.grand)} bold />
      </div>
      <p className="mt-2 text-right font-mono text-[10px] text-muted-foreground">
        Labor calculated @ ${rate}/hr
      </p>
    </div>
  );
}
