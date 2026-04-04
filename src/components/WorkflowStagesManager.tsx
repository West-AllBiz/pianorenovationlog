import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

type WorkflowStage = {
  id: string;
  name: string;
  sort_order: number | null;
  is_default: boolean;
  active: boolean;
};

export function WorkflowStagesManager() {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  const fetchStages = async () => {
    const { data } = await supabase.from('workflow_stages').select('*').order('sort_order', { ascending: true });
    setStages((data as WorkflowStage[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchStages(); }, []);

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from('workflow_stages').update({ active }).eq('id', id);
    setStages(prev => prev.map(s => s.id === id ? { ...s, active } : s));
    toast({ title: active ? 'Stage activated' : 'Stage deactivated' });
  };

  const handleUpdateName = async (id: string, name: string) => {
    await supabase.from('workflow_stages').update({ name }).eq('id', id);
    setStages(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    toast({ title: 'Saved' });
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxSort = Math.max(0, ...stages.map(s => s.sort_order ?? 0));
    const { data, error } = await supabase.from('workflow_stages').insert({
      name: newName, sort_order: maxSort + 1, is_default: false, active: true,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setStages(prev => [...prev, data as WorkflowStage]);
    setNewName('');
    toast({ title: 'Stage added' });
  };

  const handleDelete = async (stage: WorkflowStage) => {
    if (stage.is_default) { toast({ title: 'Cannot delete default stages' }); return; }
    if (!confirm(`Delete stage "${stage.name}"?`)) return;
    await supabase.from('workflow_stages').delete().eq('id', stage.id);
    setStages(prev => prev.filter(s => s.id !== stage.id));
    toast({ title: 'Stage deleted' });
  };

  const handleSaveOrder = async (updatedStages: WorkflowStage[]) => {
    for (let i = 0; i < updatedStages.length; i++) {
      await supabase.from('workflow_stages').update({ sort_order: i + 1 }).eq('id', updatedStages[i].id);
    }
    toast({ title: 'Order saved' });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage workflow stages. Default stages cannot be deleted but can be deactivated.
      </p>

      <div className="space-y-1">
        {stages.map(s => (
          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            <Switch checked={s.active} onCheckedChange={v => handleToggleActive(s.id, v)} className="shrink-0" />
            <Input
              defaultValue={s.name}
              onBlur={e => { if (e.target.value !== s.name) handleUpdateName(s.id, e.target.value); }}
              className={`h-8 text-sm flex-1 ${!s.active ? 'opacity-50' : ''}`}
            />
            <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">{s.sort_order}</span>
            {!s.is_default && (
              <button onClick={() => handleDelete(s)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded shrink-0">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Input placeholder="New stage name" value={newName} onChange={e => setNewName(e.target.value)} className="h-9 text-sm" />
        <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <Button size="sm" variant="outline" onClick={handleSaveOrder}>Save Order</Button>
    </div>
  );
}
