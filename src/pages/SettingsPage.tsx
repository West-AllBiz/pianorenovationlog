import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { TASK_CATEGORY_LABELS } from '@/types/piano';

type TaskTemplate = {
  id: string;
  task_name: string;
  category: string;
  default_status: string;
  sort_order: number | null;
  active: boolean;
};

function TaskTemplateManager() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('other');

  const fetchTemplates = async () => {
    const { data } = await supabase.from('task_templates').select('*').order('sort_order', { ascending: true });
    setTemplates((data as TaskTemplate[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from('task_templates').update({ active }).eq('id', id);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active } : t));
    toast({ title: active ? 'Template activated' : 'Template deactivated' });
  };

  const handleUpdateField = async (id: string, field: string, value: string) => {
    await supabase.from('task_templates').update({ [field]: value }).eq('id', id);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    toast({ title: 'Saved' });
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxSort = Math.max(0, ...templates.map(t => t.sort_order ?? 0));
    const { data, error } = await supabase.from('task_templates').insert({
      task_name: newName, category: newCategory, default_status: 'todo', sort_order: maxSort + 1, active: true,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setTemplates(prev => [...prev, data as TaskTemplate]);
    setNewName('');
    setNewCategory('other');
    toast({ title: 'Template added' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This won't affect existing piano tasks.`)) return;
    await supabase.from('task_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Template deleted' });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Changes to templates only affect future pianos or manual "Apply Standard Tasks" actions. Existing task lists are not changed.
      </p>

      <div className="space-y-1">
        {templates.map(t => (
          <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            <Switch checked={t.active} onCheckedChange={v => handleToggleActive(t.id, v)} className="shrink-0" />
            <Input
              defaultValue={t.task_name}
              onBlur={e => { if (e.target.value !== t.task_name) handleUpdateField(t.id, 'task_name', e.target.value); }}
              className={`h-8 text-sm flex-1 ${!t.active ? 'opacity-50' : ''}`}
            />
            <Select value={t.category} onValueChange={v => handleUpdateField(t.id, 'category', v)}>
              <SelectTrigger className="h-8 w-32 text-xs shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(TASK_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">{t.sort_order}</span>
            <button onClick={() => handleDelete(t.id, t.task_name)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded shrink-0">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Input placeholder="New template name" value={newName} onChange={e => setNewName(e.target.value)} className="h-9 text-sm" />
        <Select value={newCategory} onValueChange={setNewCategory}>
          <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(TASK_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-6">Settings</h1>
      </motion.div>

      <div className="space-y-8">
        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Workshop Profile</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop Name</Label>
              <Input defaultValue="Piano Renovation Log" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input defaultValue="nick@pianorenolog.com" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="" className="h-11" />
            </div>
            <Button size="sm">Save Changes</Button>
          </div>
        </section>

        {isAdmin && (
          <section className="bg-card rounded-xl border p-6">
            <h2 className="font-heading text-lg font-semibold mb-4">Task Templates</h2>
            <TaskTemplateManager />
          </section>
        )}

        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Renovation Stages</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customize the stages pianos move through during restoration. Default stages are pre-configured.
          </p>
          <Button variant="outline" size="sm">Customize Stages</Button>
        </section>

        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Data Export</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Export your full inventory, expenses, and sales data to CSV.
          </p>
          <Button variant="outline" size="sm">Export All Data</Button>
        </section>
      </div>
    </div>
  );
}
