import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, GripVertical, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { TASK_CATEGORY_LABELS } from '@/types/piano';
import { WorkflowStagesManager } from '@/components/WorkflowStagesManager';
import { usePianos } from '@/hooks/usePianos';

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
    await supabase.from('task_templates').update({ [field]: value } as any).eq('id', id);
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

function generateCSV(headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nicks-piano-services-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportSection() {
  const { data: pianos = [] } = usePianos();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportInventory = async () => {
    setExporting('inventory');
    try {
      const { data: expenses } = await supabase.from('expenses').select('*');
      const expMap: Record<string, any> = {};
      (expenses ?? []).forEach(e => { expMap[e.piano_id] = e; });

      const headers = [
        'ID', 'Tag', 'Color Tag', 'Brand', 'Serial', 'Type', 'Year Built',
        'Country of Origin', 'Ownership', 'Status', 'Friction Score', 'ROI Health',
        'Purchase Price', 'Moving Cost', 'Parts Cost', 'Labor Cost', 'Marketing Cost',
        'Total Invested', 'Est Sale Price', 'Projected Profit', 'Actual Sale Price',
        'Finish Plan', 'Selling Channel', 'Lane', 'Notes',
      ];
      const rows = pianos.map(p => {
        const exp = expMap[p.id] || {};
        const totalInvested = (exp.purchase_price || 0) + (exp.moving_cost || 0) + (exp.parts_cost || 0) + (exp.labor_cost || 0) + (exp.marketing_cost || 0);
        const projectedProfit = exp.estimated_sale_price ? exp.estimated_sale_price - totalInvested : '';
        return [
          p.inventory_id, p.tag, p.color_tag, p.brand, p.serial_number, p.piano_type,
          p.year_built, p.country_of_origin, p.ownership_category, p.status,
          String(p.friction_score ?? ''), p.roi_health,
          String(exp.purchase_price ?? ''), String(exp.moving_cost ?? ''),
          String(exp.parts_cost ?? ''), String(exp.labor_cost ?? ''),
          String(exp.marketing_cost ?? ''), String(totalInvested || ''),
          String(exp.estimated_sale_price ?? ''), String(projectedProfit),
          String(exp.actual_sale_price ?? ''),
          p.finish_plan, p.selling_channel, p.lane, p.private_notes,
        ];
      });
      generateCSV(headers, rows);
      toast({ title: 'Inventory exported' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportTasks = async () => {
    setExporting('tasks');
    try {
      const { data: tasks } = await supabase.from('restoration_tasks').select('*, pianos!restoration_tasks_piano_id_fkey(brand, inventory_id)');
      const headers = ['Piano ID', 'Brand', 'Task', 'Category', 'Status', 'Assignee', 'Hours', 'Parts', 'Notes'];
      const rows = (tasks ?? []).map((t: any) => [
        t.pianos?.inventory_id ?? '', t.pianos?.brand ?? '', t.title, t.category, t.status,
        t.assignee, String(t.labor_hours ?? ''), t.parts_used, t.notes,
      ]);
      generateCSV(headers, rows);
      toast({ title: 'Tasks exported' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExpenses = async () => {
    setExporting('expenses');
    try {
      const { data: expenses } = await supabase.from('expenses').select('*, pianos!expenses_piano_id_fkey(brand, inventory_id)');
      const headers = ['Piano ID', 'Brand', 'Purchase', 'Moving', 'Parts', 'Labor Cost', 'Labor Hours', 'Marketing', 'Est Sale', 'Actual Sale', 'Notes'];
      const rows = (expenses ?? []).map((e: any) => [
        e.pianos?.inventory_id ?? '', e.pianos?.brand ?? '',
        String(e.purchase_price ?? ''), String(e.moving_cost ?? ''),
        String(e.parts_cost ?? ''), String(e.labor_cost ?? ''),
        String(e.labor_hours ?? ''), String(e.marketing_cost ?? ''),
        String(e.estimated_sale_price ?? ''), String(e.actual_sale_price ?? ''),
        e.notes,
      ]);
      generateCSV(headers, rows);
      toast({ title: 'Expenses exported' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Export your full inventory, expenses, and task data to CSV.
      </p>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={handleExportInventory} disabled={!!exporting}>
          <Download className="h-4 w-4 mr-1.5" />
          {exporting === 'inventory' ? 'Exporting...' : 'Export Inventory'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportTasks} disabled={!!exporting}>
          <Download className="h-4 w-4 mr-1.5" />
          {exporting === 'tasks' ? 'Exporting...' : 'Export Tasks'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExpenses} disabled={!!exporting}>
          <Download className="h-4 w-4 mr-1.5" />
          {exporting === 'expenses' ? 'Exporting...' : 'Export Expenses'}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [stagesExpanded, setStagesExpanded] = useState(false);

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
          {!stagesExpanded ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Customize the stages pianos move through during restoration. Default stages are pre-configured.
              </p>
              <Button variant="outline" size="sm" onClick={() => setStagesExpanded(true)}>Customize Stages</Button>
            </>
          ) : (
            <WorkflowStagesManager />
          )}
        </section>

        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-heading text-lg font-semibold mb-4">Data Export</h2>
          <ExportSection />
        </section>
      </div>
    </div>
  );
}
