import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Wrench, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { PianoPhotosBanner } from '@/components/PianoPhotos';
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

function CompactCatStatus(catTasks: TaskRow[]) {
  if (catTasks.length === 0) return null;
  const done = catTasks.filter(t => t.status === 'done').length;
  if (done === catTasks.length) return <span className="text-success">✓</span>;
  if (catTasks.some(t => t.status === 'blocked')) return <span className="text-destructive">●</span>;
  if (catTasks.some(t => t.status === 'in_progress')) return <span className="text-primary">●</span>;
  return null;
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
      className={`rounded-lg border bg-card overflow-hidden border-l-[3px] ${borderClass} flex flex-col min-h-[280px] ${
        isArchive && !expanded ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <button
        className="w-full text-left p-3 flex flex-col gap-0.5"
        onClick={() => isArchive && setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs text-primary">{piano.inventory_id}</span>
            <span className="text-muted-foreground text-[10px]">·</span>
            <span className="font-heading font-semibold text-sm text-foreground truncate">{piano.brand}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {frictionDots(piano.friction_score)}
            {isArchive && (expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground truncate">
            {pianoTypeLabel} · {piano.year_built || '—'}
            {isClient && ' · Client: Mike'}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 ${ROI_HEALTH_COLORS[roiKey]}`}>
            {ROI_HEALTH_LABELS[roiKey]}
          </Badge>
        </div>
        <Badge variant="outline" className="w-fit text-[10px] mt-0.5 border-primary/30 text-primary">
          {statusLabel}
        </Badge>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 flex-1 flex flex-col">
          {/* Alerts */}
          {isClient && piano.status === 'final_qc' && (
            <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              Invoice pending — action required
            </div>
          )}
          {isDonation && (
            <div className="text-[11px] text-mission bg-mission/10 px-2 py-1.5 rounded-md">
              Keys for Kids — mission placement pending
            </div>
          )}

          {/* Overall progress */}
          {total > 0 ? (
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">Progress</span>
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
            <div className="text-center py-2">
              <p className="text-[11px] text-muted-foreground mb-1.5">No tasks assigned yet.</p>
              <Button size="sm" variant="outline" className="text-[11px] h-7" asChild>
                <Link to={`/piano/${piano.id}`}>Apply Standard Tasks</Link>
              </Button>
            </div>
          )}

          {/* Category breakdown — compact */}
          {grouped.length > 0 && (
            <div className="space-y-0.5">
              {grouped.map(({ category, tasks: catTasks }) => {
                const catDone = catTasks.filter(t => t.status === 'done').length;
                const catPct = Math.round((catDone / catTasks.length) * 100);
                return (
                  <div key={category} className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-[72px] truncate text-muted-foreground">{category}</span>
                    <div className="w-10 h-1 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                      <div
                        className={`h-full rounded-full ${isDonation ? 'bg-mission' : progressBarColor(catPct)}`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-7 text-right">{catDone}/{catTasks.length}</span>
                    <span className="w-3 text-center">{CompactCatStatus(catTasks)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active tasks — pill tags */}
          {activeTasks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {activeTasks.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary">
                  <Wrench className="h-2.5 w-2.5" />{t.title}
                </span>
              ))}
            </div>
          )}

          {/* Blocked tasks — pill tags */}
          {blockedTasks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {blockedTasks.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[11px] text-destructive">
                  <AlertTriangle className="h-2.5 w-2.5" />{t.title}
                </span>
              ))}
            </div>
          )}

          {/* Footer — pushed to bottom */}
          <div className="flex items-center justify-between pt-2 mt-auto border-t border-border">
            <span className="text-[10px] text-muted-foreground">
              {new Date(piano.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <Link
              to={`/piano/${piano.id}`}
              className="text-[11px] font-medium text-primary hover:underline"
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
