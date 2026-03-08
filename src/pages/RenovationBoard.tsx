import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { samplePianos } from '@/data/sampleData';
import { STATUS_LABELS, PianoStatus } from '@/types/piano';

const KANBAN_STAGES: PianoStatus[] = [
  'acquired', 'scheduled_pickup', 'in_transit', 'received',
  'intake_inspection', 'scope_defined', 'awaiting_parts',
  'cabinet_work', 'action_work', 'string_tuning',
  'voicing_regulation', 'final_detail', 'quality_control',
  'ready_for_listing', 'listed',
];

export default function RenovationBoard() {
  const columns = useMemo(() => {
    return KANBAN_STAGES.map(stage => ({
      stage,
      label: STATUS_LABELS[stage],
      pianos: samplePianos.filter(p => p.status === stage),
    }));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Renovation Board</h1>
        <p className="text-muted-foreground text-sm mb-6">Track pianos through every restoration stage</p>
      </motion.div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-3" style={{ minWidth: `${KANBAN_STAGES.length * 296}px` }}>
          {columns.map((col, ci) => (
            <motion.div
              key={col.stage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.03 }}
              className="kanban-column"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {col.pianos.length}
                </span>
              </div>

              {col.pianos.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                  No pianos
                </div>
              )}

              {col.pianos.map(piano => (
                <Link key={piano.id} to={`/piano/${piano.id}`} className="kanban-card block">
                  <p className="text-xs font-mono text-muted-foreground mb-1">{piano.inventoryId}</p>
                  <p className="font-medium text-sm">{piano.brand} {piano.model}</p>
                  <p className="text-xs text-muted-foreground mt-1">{piano.finish} · {piano.storageLocation}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="w-16 h-1 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${piano.percentComplete}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{piano.percentComplete}%</span>
                  </div>
                </Link>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
