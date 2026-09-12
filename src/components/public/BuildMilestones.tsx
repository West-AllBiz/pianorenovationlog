type Milestone = {
  id?: string;
  title: string;
  category?: string | null;
  status: string;
  completion_date?: string | null;
};

interface Props {
  tasks: Milestone[];
  percentComplete?: number | null;
}

const GROUPS: { key: string; label: string; note: string }[] = [
  { key: 'done', label: 'Completed', note: 'Finished stages of this build' },
  { key: 'in_progress', label: 'In Progress', note: 'Currently on the bench' },
  { key: 'todo', label: 'Upcoming', note: 'Planned next stages' },
];

function fmtDate(d?: string | null) {
  if (!d) return null;
  const parsed = new Date(`${d}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BuildMilestones({ tasks, percentComplete }: Props) {
  const milestones = tasks.filter(t => ['done', 'in_progress', 'todo'].includes(t.status));
  if (milestones.length === 0) return null;

  const pct = typeof percentComplete === 'number'
    ? Math.max(0, Math.min(100, percentComplete))
    : null;

  return (
    <div className="my-6 p-6 rounded-2xl border border-primary/20 bg-card">
      <h3 className="font-heading text-xl text-primary mb-4">Build Progress</h3>

      {pct !== null && (
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Overall progress
            </span>
            <span className="font-heading text-2xl font-bold text-primary leading-none">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-teal transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-5">
        {GROUPS.map(g => {
          const items = milestones.filter(t => t.status === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                {g.label} · {items.length}
              </p>
              <ul className="space-y-1.5">
                {items.map((t, i) => {
                  const date = fmtDate(t.completion_date);
                  return (
                    <li
                      key={t.id || `${g.key}-${i}`}
                      className={`flex items-baseline justify-between gap-3 text-[13px] ${
                        g.key === 'todo' ? 'text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      <span>
                        <span className={g.key === 'done' ? 'text-teal mr-1.5' : 'text-muted-foreground mr-1.5'}>
                          {g.key === 'done' ? '✓' : g.key === 'in_progress' ? '◆' : '○'}
                        </span>
                        {t.title}
                      </span>
                      {date && <span className="font-mono text-[11px] text-muted-foreground flex-shrink-0">{date}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
