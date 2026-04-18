import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  category: string | null;
  status: string;
  labor_hours: number | null;
};

type Expenses = {
  parts_cost?: number | null;
  moving_cost?: number | null;
  marketing_cost?: number | null;
} | null | undefined;

interface Props {
  tasks: Task[];
  expenses: Expenses;
  hourlyRate: number;
  showLaborHours: boolean;
  showTaskList: boolean;
  showCostBreakdown: boolean;
  isSold?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  structural: 'Structural',
  action_rebuild: 'Action & Regulation',
  regulation: 'Action & Regulation',
  cabinet_work: 'Cabinet & Finishing',
  cleaning: 'Cleaning',
  tuning: 'Tuning & Voicing',
  voicing: 'Tuning & Voicing',
  pedal_repair: 'Pedal & Trapwork',
  acquisition: 'Intake & Provenance',
  final_qc: 'Final QC',
  listing_sales: 'Listing',
  other: 'Other',
};

const CATEGORY_ORDER = [
  'Structural',
  'Action & Regulation',
  'Cabinet & Finishing',
  'Cleaning',
  'Tuning & Voicing',
  'Pedal & Trapwork',
  'Intake & Provenance',
  'Final QC',
  'Listing',
  'Other',
];

function fmtH(h: number) {
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(2).replace(/\.?0+$/, '')}h`;
}
function fmt$(n: number) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export default function RestorationRecord({
  tasks, expenses, hourlyRate, showLaborHours, showTaskList, showCostBreakdown, isSold,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const publicTasks = useMemo(
    () => tasks.filter(t => t.status === 'done' || t.status === 'in_progress'),
    [tasks]
  );

  const totalHours = useMemo(
    () => publicTasks.reduce((s, t) => s + (Number(t.labor_hours) || 0), 0),
    [publicTasks]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { hours: number; tasks: Task[] }>();
    for (const t of publicTasks) {
      const label = CATEGORY_LABELS[t.category || 'other'] || 'Other';
      const cur = map.get(label) || { hours: 0, tasks: [] };
      cur.hours += Number(t.labor_hours) || 0;
      cur.tasks.push(t);
      map.set(label, cur);
    }
    return CATEGORY_ORDER
      .filter(k => map.has(k))
      .map(k => ({ label: k, ...map.get(k)! }));
  }, [publicTasks]);

  if (!showLaborHours && !showTaskList && !showCostBreakdown) return null;
  if (totalHours <= 0 && !showCostBreakdown) return null;

  const parts = Number(expenses?.parts_cost) || 0;
  const other = (Number(expenses?.moving_cost) || 0) + (Number(expenses?.marketing_cost) || 0);

  // Labor cost is computed from total labor cost stored elsewhere — we don't have hourly rate here for privacy.
  // Per spec: Level 3 needs labor $. We compute it here from a private call — but to honor the
  // "never expose hourly rate" rule, we read the labor_cost field from expenses if present.
  // Fallback: server-injected labor_cost via expenses table.
  const laborCost = Number((expenses as any)?.labor_cost) || 0;
  const subtotal = laborCost + parts + other;

  return (
    <div className="my-6 p-6 rounded-2xl border border-primary/20 bg-card">
      <h3 className="font-heading text-xl text-primary mb-4">Restoration Record</h3>

      {/* Level 1 */}
      {showLaborHours && totalHours > 0 && (
        <div className="text-center py-4">
          <div className="font-heading text-5xl font-bold text-primary leading-none">
            {fmtH(totalHours)}
          </div>
          <p className="mt-3 text-sm text-foreground max-w-[44ch] mx-auto leading-relaxed">
            of hand restoration {isSold ? 'invested ' : ''}by Nick West, master piano technician
            with 30 years of experience.
          </p>
        </div>
      )}

      {/* Level 2 */}
      {showTaskList && grouped.length > 0 && (
        <div className="mt-6 pt-6 border-t border-primary/15">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Work completed on this instrument
          </p>
          <div className="divide-y divide-primary/15">
            {grouped.map(g => (
              <div key={g.label} className="flex items-baseline justify-between py-2">
                <span className="font-mono text-[13px] text-foreground">{g.label}</span>
                <span className="font-mono text-[13px] text-foreground">{fmtH(g.hours)}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between py-2 pt-3">
              <span className="font-heading text-base font-bold text-primary">Total invested</span>
              <span className="font-heading text-base font-bold text-primary">{fmtH(totalHours)}</span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono text-teal hover:text-teal/80 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Hide full task list' : 'Show full task list'}
          </button>

          {expanded && (
            <div className="mt-4 space-y-4">
              {grouped.map(g => (
                <div key={g.label}>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    {g.label}
                  </p>
                  <ul className="space-y-1">
                    {g.tasks.map(t => {
                      const inProg = t.status === 'in_progress';
                      const hours = Number(t.labor_hours) || 0;
                      return (
                        <li
                          key={t.id}
                          className={`flex items-baseline justify-between text-xs ${
                            inProg ? 'opacity-60' : ''
                          }`}
                        >
                          <span className="text-foreground">
                            {t.title}
                            {inProg && <span className="text-muted-foreground"> (in progress)</span>}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {hours > 0 ? fmtH(hours) : '—'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Level 3 */}
      {showCostBreakdown && (
        <div className="mt-6 pt-6 border-t border-primary/15">
          <p className="italic text-[13px] text-muted-foreground mb-4">
            A transparent record of what went into this instrument:
          </p>
          <div className="divide-y divide-primary/15">
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-[13px] text-foreground">Labor</span>
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[13px] text-muted-foreground">{fmtH(totalHours)}</span>
                <span className="font-mono text-[13px] text-foreground w-20 text-right">{fmt$(laborCost)}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-[13px] text-foreground">Parts</span>
              <span className="font-mono text-[13px] text-foreground">{fmt$(parts)}</span>
            </div>
            <div className="flex items-baseline justify-between py-2">
              <span className="font-mono text-[13px] text-foreground">Other</span>
              <span className="font-mono text-[13px] text-foreground">{fmt$(other)}</span>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <span className="font-heading text-lg font-bold text-primary">Restoration investment</span>
              <span className="font-heading text-lg font-bold text-primary">{fmt$(subtotal)}</span>
            </div>
          </div>
          <p className="italic text-[12px] text-muted-foreground mt-3">
            Purchase cost is never shown publicly — only restoration investment is disclosed.
          </p>
        </div>
      )}
    </div>
  );
}
