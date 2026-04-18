import { useMemo } from 'react';
import { useHourlyRate } from '@/hooks/useAppSettings';

type Task = { status: string; labor_hours: number | null };

function formatHours(h: number) {
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(2).replace(/\.?0+$/, '')}h`;
}

function formatCost(n: number) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function LaborSummary({ tasks }: { tasks: Task[] }) {
  const { data: rate = 100 } = useHourlyRate();

  const { totalHours, doneCount, totalCount, laborCost } = useMemo(() => {
    const applicable = tasks.filter(t => t.status !== 'n/a');
    const done = applicable.filter(t => t.status === 'done');
    const hours = done.reduce((s, t) => s + (Number(t.labor_hours) || 0), 0);
    return {
      totalHours: hours,
      doneCount: done.length,
      totalCount: applicable.length,
      laborCost: hours * rate,
    };
  }, [tasks, rate]);

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        Labor Tracked
      </p>
      <p className="mt-1 font-heading text-[28px] leading-tight font-bold text-primary">
        {formatHours(totalHours)} <span className="text-muted-foreground/40">·</span> {formatCost(laborCost)}
      </p>
      <p className="mt-0.5 text-xs text-foreground">
        {doneCount} of {totalCount} tasks complete
        <span className="ml-2 font-mono text-[10px] text-muted-foreground">@ ${rate}/hr</span>
      </p>
    </div>
  );
}
