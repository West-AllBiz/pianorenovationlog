import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Wrench, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePianos, type DbPiano } from '@/hooks/usePianos';
import {
  STATUS_LABELS, OWNERSHIP_LABELS, ROI_HEALTH_LABELS, ROI_HEALTH_COLORS,
  PIANO_TYPE_LABELS,
  type PianoStatus, type OwnershipCategory, type RoiHealth, type PianoType,
} from '@/types/piano';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type TaskRow = {
  id: string;
  title: string;
  category: string | null;
  status: string;
  assignee: string | null;
  updated_at: string;
  piano_id: string;
};

const CATEGORY_ORDER = [
  'Assessment', 'Structural', 'Mechanical', 'Pedals & Trapwork',
  'Tuning', 'Finishing', 'Final QC', 'other',
];

type OwnerFilter = 'all' | 'business_inventory' | 'client_piano' | 'donation_project' | 'restoration_archive';
type SortMode = 'progress_asc' | 'progress_desc' | 'friction' | 'roi' | 'alpha';

const OWNERSHIP_BORDER: Record<string, string> = {
  business_inventory: 'border-l-primary',
  client_piano: 'border-l-teal',
  donation_project: 'border-l-mission',
  restoration_archive: 'border-l-[hsl(0_0%_33%)]',
};

function frictionDots(score: number | null) {
  const s = score ?? 0;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2 w-2 rounded-full ${
            i < Math.min(s, 5)
              ? s >= 7 ? 'bg-destructive' : 'bg-primary'
              : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

function progressBarColor(pct: number) {
  if (pct >= 100) return 'bg-success';
  if (pct >= 67) return 'bg-teal';
  if (pct >= 34) return 'bg-primary';
  return 'bg-destructive';
}

function categoryStatus(tasks: TaskRow[]): { label: string; cls: string } {
  if (tasks.length === 0) return { label: 'Pending', cls: 'text-muted-foreground' };
  const done = tasks.filter(t => t.status === 'done').length;
  if (done === tasks.length) return { label: '✓ Done', cls: 'text-success' };
  if (tasks.some(t => t.status === 'blocked')) return { label: 'Blocked', cls: 'text-destructive' };
  if (tasks.some(t => t.status === 'in_progress')) return { label: 'Active', cls: 'text-primary' };
  return { label: 'Pending', cls: 'text-muted-foreground' };
}

function useAllTasks() {
  return useQuery({
    queryKey: ['all_restoration_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restoration_tasks')
        .select('id, title, category, status, assignee, updated_at, piano_id');
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

function PianoProgressCard({ piano, tasks }: { piano: DbPiano; tasks: TaskRow[] }) {
  const ownership = piano.ownership_category as OwnershipCategory;
  const isArchive = ownership === 'restoration_archive';
  const [expanded, setExpanded] = useState(!isArchive);

  const total = tasks.length;
  const complete = tasks.filter(t => t.status === 'done').length;
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

  const grouped = useMemo(() => {
    const map: Record<string, TaskRow[]> = {};
    for (const t of tasks) {
      const cat = t.category || 'other';
      (map[cat] ??= []).push(t);
    }
    return CATEGORY_ORDER
      .filter(c => map[c])
      .map(c => ({ category: c, tasks: map[c] }));
  }, [tasks]);

  const activeTasks = tasks.filter(t => t.status === 'in_progress').slice(0, 3);
  const blockedTasks = tasks.filter(t => t.status === 'blocked');

  const borderClass = OWNERSHIP_BORDER[ownership] || 'border-l-primary';
  const isClient = ownership === 'client_piano';
  const isDonation = ownership === 'donation_project';

  const roiKey = (piano.roi_health as RoiHealth) || 'moderate';
  const statusLabel = STATUS_LABELS[piano.status as PianoStatus] || piano.status;
  const pianoTypeLabel = PIANO_TYPE_LABELS[piano.piano_type as PianoType] || piano.piano_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border bg-card overflow-hidden border-l-[3px] ${borderClass} ${
        isArchive && !expanded ? 'opacity-60' : ''
      }`}
    >
      {/* Header — always visible */}
      <button
        className="w-full text-left p-4 flex flex-col gap-1"
        onClick={() => isArchive && setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs text-primary">{piano.inventory_id}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="font-heading font-semibold text-sm text-foreground truncate">{piano.brand}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {frictionDots(piano.friction_score)}
            {isArchive && (expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {pianoTypeLabel} · {piano.year_built || '—'}
            {isClient && ' · Client: Mike'}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 ${ROI_HEALTH_COLORS[roiKey]}`}>
            {ROI_HEALTH_LABELS[roiKey]}
          </Badge>
        </div>
        <Badge variant="outline" className="w-fit text-[10px] mt-1 border-primary/30 text-primary">
          {statusLabel}
        </Badge>
      </button>

      {/* Body — collapsible for archive */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Special alerts */}
          {isClient && piano.status === 'final_qc' && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              Invoice pending — action required
            </div>
          )}
          {isDonation && (
            <div className="text-xs text-mission bg-mission/10 px-3 py-2 rounded-md">
              Keys for Kids — mission placement pending
            </div>
          )}

          {/* Overall progress */}
          {total > 0 ? (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-mono text-muted-foreground">{complete}/{total} · {pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isDonation ? 'bg-mission' : progressBarColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground mb-2">No tasks assigned yet.</p>
              <Button size="sm" variant="outline" className="text-xs" asChild>
                <Link to={`/piano/${piano.id}`}>Apply Standard Tasks</Link>
              </Button>
            </div>
          )}

          {/* Category breakdown */}
          {grouped.length > 0 && (
            <div className="space-y-1.5">
              {grouped.map(({ category, tasks: catTasks }) => {
                const catDone = catTasks.filter(t => t.status === 'done').length;
                const catPct = Math.round((catDone / catTasks.length) * 100);
                const st = categoryStatus(catTasks);
                return (
                  <div key={category} className="flex items-center gap-2 text-xs">
                    <span className="w-[100px] sm:w-[130px] truncate text-muted-foreground">{category}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDonation ? 'bg-mission' : progressBarColor(catPct)}`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                    <span className="font-mono w-8 text-right text-muted-foreground">{catDone}/{catTasks.length}</span>
                    <span className={`w-14 text-right ${st.cls}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active tasks */}
          {activeTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
                <Wrench className="h-3 w-3" /> Active now
              </div>
              {activeTasks.map(t => (
                <p key={t.id} className="text-xs text-muted-foreground pl-4">
                  · {t.title}{t.assignee ? ` — ${t.assignee}` : ''}
                </p>
              ))}
            </div>
          )}

          {/* Blocked tasks */}
          {blockedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-destructive mb-1">
                <AlertTriangle className="h-3 w-3" /> Blocked
              </div>
              {blockedTasks.map(t => (
                <p key={t.id} className="text-xs text-muted-foreground pl-4">
                  · {t.title} (awaiting parts)
                </p>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground">
              Updated {new Date(piano.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <Link
              to={`/piano/${piano.id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              → Details
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function RenovationBoard() {
  const { data: pianos, isLoading: pianosLoading } = usePianos();
  const { data: allTasks, isLoading: tasksLoading } = useAllTasks();
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('progress_asc');

  const isLoading = pianosLoading || tasksLoading;

  const tasksByPiano = useMemo(() => {
    const map: Record<string, TaskRow[]> = {};
    for (const t of allTasks ?? []) {
      (map[t.piano_id] ??= []).push(t);
    }
    return map;
  }, [allTasks]);

  const filtered = useMemo(() => {
    let list = [...(pianos ?? [])];
    if (ownerFilter !== 'all') {
      list = list.filter(p => p.ownership_category === ownerFilter);
    }
    list.sort((a, b) => {
      const aTasks = tasksByPiano[a.id] ?? [];
      const bTasks = tasksByPiano[b.id] ?? [];
      const aPct = aTasks.length ? aTasks.filter(t => t.status === 'done').length / aTasks.length : 0;
      const bPct = bTasks.length ? bTasks.filter(t => t.status === 'done').length / bTasks.length : 0;

      switch (sortMode) {
        case 'progress_asc': return aPct - bPct;
        case 'progress_desc': return bPct - aPct;
        case 'friction': return (b.friction_score ?? 0) - (a.friction_score ?? 0);
        case 'roi': {
          const order: Record<string, number> = { watch: 0, moderate: 1, strong: 2, mission: 3, client: 4, archive: 5 };
          return (order[a.roi_health ?? 'moderate'] ?? 3) - (order[b.roi_health ?? 'moderate'] ?? 3);
        }
        case 'alpha': return a.brand.localeCompare(b.brand);
        default: return 0;
      }
    });
    return list;
  }, [pianos, ownerFilter, sortMode, tasksByPiano]);

  const activeCount = (pianos ?? []).filter(p => p.ownership_category !== 'restoration_archive').length;
  const archiveCount = (pianos ?? []).filter(p => p.ownership_category === 'restoration_archive').length;
  const totalTasks = allTasks?.length ?? 0;
  const totalDone = allTasks?.filter(t => t.status === 'done').length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Renovation Progress</h1>
        <p className="text-muted-foreground text-sm mb-4">
          {activeCount} active · {archiveCount} archived · {totalDone}/{totalTasks} tasks done
        </p>
      </motion.div>

      {/* Filters */}
      <div className="space-y-2 mb-6">
        <ToggleGroup
          type="single"
          value={ownerFilter}
          onValueChange={v => v && setOwnerFilter(v as OwnerFilter)}
          className="flex flex-wrap justify-start gap-1"
        >
          {([
            ['all', 'All'],
            ['business_inventory', 'Business'],
            ['client_piano', 'Client'],
            ['donation_project', 'Donation'],
            ['restoration_archive', 'Archive'],
          ] as const).map(([val, label]) => (
            <ToggleGroupItem key={val} value={val} size="sm" className="text-xs px-3 h-8">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup
          type="single"
          value={sortMode}
          onValueChange={v => v && setSortMode(v as SortMode)}
          className="flex flex-wrap justify-start gap-1"
        >
          {([
            ['progress_asc', 'Progress ↑'],
            ['progress_desc', 'Progress ↓'],
            ['friction', 'Friction'],
            ['roi', 'ROI'],
            ['alpha', 'A–Z'],
          ] as const).map(([val, label]) => (
            <ToggleGroupItem key={val} value={val} size="sm" className="text-xs px-3 h-8">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 min-[481px]:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(piano => (
          <PianoProgressCard
            key={piano.id}
            piano={piano}
            tasks={tasksByPiano[piano.id] ?? []}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No pianos match this filter.
        </div>
      )}
    </div>
  );
}
