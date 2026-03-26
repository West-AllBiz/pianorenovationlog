import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { usePianos } from '@/hooks/usePianos';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  date: string;
  title: string;
  detail: string;
  type: 'pickup' | 'task' | 'delivery' | 'sale';
}

export default function CalendarPage() {
  const { data: pianos } = usePianos();
  const { data: tasks } = useQuery({
    queryKey: ['all_tasks'],
    queryFn: async () => {
      const { data } = await supabase.from('restoration_tasks').select('*').order('due_date', { ascending: true });
      return data ?? [];
    },
  });

  const events: TimelineEvent[] = [];

  (pianos ?? []).forEach(p => {
    if (p.pickup_date) events.push({ date: p.pickup_date, title: `Pickup: ${p.brand} ${p.model || ''}`, detail: p.pickup_location || '', type: 'pickup' });
    if (p.sold_date) events.push({ date: p.sold_date, title: `Sold: ${p.brand} ${p.model || ''}`, detail: p.sold_price ? `$${p.sold_price.toLocaleString()}` : '', type: 'sale' });
  });

  (tasks ?? []).forEach(t => {
    if (t.due_date) {
      const piano = (pianos ?? []).find(p => p.id === t.piano_id);
      events.push({ date: t.due_date, title: t.title, detail: piano ? `${piano.brand} ${piano.model || ''}` : '', type: 'task' });
    }
  });

  events.sort((a, b) => a.date.localeCompare(b.date));

  const typeColors: Record<string, string> = {
    pickup: 'bg-info/10 border-info/30',
    task: 'bg-warning/10 border-warning/30',
    delivery: 'bg-success/10 border-success/30',
    sale: 'bg-success/10 border-success/30',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Timeline</h1>
        <p className="text-muted-foreground text-sm mb-6">Upcoming pickups, tasks, and milestones</p>
      </motion.div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground pl-10">No scheduled events yet.</p>
          )}
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 pl-10 relative"
            >
              <div className="absolute left-2.5 top-2 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              <div className={`flex-1 rounded-lg border p-4 ${typeColors[event.type]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs capitalize text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{event.type}</span>
                </div>
                <p className="font-medium text-sm">{event.title}</p>
                {event.detail && <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
