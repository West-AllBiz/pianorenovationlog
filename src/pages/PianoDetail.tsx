import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Check, X, Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import { PianoPhotosSection } from '@/components/PianoPhotos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePiano, usePianoRelated, useUpdatePiano, useLogActivity } from '@/hooks/usePianos';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  STATUS_LABELS, STATUS_COLORS, PIANO_TYPE_LABELS, OWNERSHIP_LABELS,
  COLOR_TAG_HEX, COLOR_TAG_LABELS, CONDITION_SCORE_LABELS, TASK_CATEGORY_LABELS,
  TONAL_CHARACTER_LABELS, ACTION_FEEL_LABELS, MUSICAL_SUITABILITY_LABELS, CABINET_CHARACTER_LABELS,
  ROI_HEALTH_LABELS, ROI_HEALTH_COLORS,
  type PianoStatus, type OwnershipCategory, type ColorTag, type RoiHealth, type PianoType,
  type ConditionScore, type TaskCategory,
} from '@/types/piano';

import CatalogueTab from '@/components/CatalogueTab';

const TABS = ['Overview', 'Intake', 'Restoration', 'Expenses', 'Character Notes', 'Catalogue', 'Activity'] as const;

const TASK_STATUS_STYLES: Record<string, string> = {
  done: 'bg-success/15 text-success',
  in_progress: 'bg-warning/15 text-warning',
  todo: 'bg-muted text-muted-foreground',
  blocked: 'bg-destructive/15 text-destructive',
};
const TASK_STATUS_DISPLAY: Record<string, string> = {
  done: 'Complete', in_progress: 'In Progress', todo: 'Pending', blocked: 'Awaiting Parts',
};

// ── Inline Edit Field (auto-save on blur) ────────────────
function InlineField({ label, value, onSave, type = 'text', options, canEdit: editable = true }: {
  label: string; value: string; onSave: (val: string) => void;
  type?: 'text' | 'select' | 'textarea'; options?: Record<string, string>; canEdit?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <div className="group flex flex-col gap-1 border-b py-2 sm:flex-row sm:justify-between sm:gap-3">
        <span className="text-[10px] sm:text-sm uppercase tracking-wider sm:tracking-normal sm:normal-case text-muted-foreground font-mono">{label}</span>
        <div className="flex w-full min-w-0 items-start gap-1.5 sm:w-auto sm:max-w-[60%] sm:justify-end">
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-left text-sm font-medium">{options ? options[value] || value : value || '—'}</span>
          {editable && (
            <button onClick={() => { setDraft(value); setEditing(true); }} className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 sm:self-center sm:transition-opacity" style={{ opacity: undefined }}>
              <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <div className="flex flex-col gap-1 border-b py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] sm:text-sm uppercase tracking-wider sm:tracking-normal sm:normal-case text-muted-foreground font-mono">{label}</span>
        <div className="flex w-full min-w-0 items-center gap-1 sm:w-auto sm:max-w-[60%]">
          <Select value={draft} onValueChange={v => { setDraft(v); onSave(v); setEditing(false); }}>
            <SelectTrigger className="h-8 w-full min-w-0 text-xs sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(options).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <button onClick={cancel} className="p-1 hover:bg-destructive/10 rounded flex-shrink-0"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 border-b py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] sm:text-sm uppercase tracking-wider sm:tracking-normal sm:normal-case text-muted-foreground font-mono shrink-0">{label}</span>
      <div className="flex w-full min-w-0 items-start gap-1 sm:w-auto sm:max-w-[60%] sm:items-center">
        {type === 'textarea' ? (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="min-h-[100px] w-full min-w-0 text-sm" onBlur={save} onKeyDown={e => { if (e.key === 'Escape') cancel(); }} />
        ) : (
          <Input value={draft} onChange={e => setDraft(e.target.value)} className="h-8 w-full min-w-0 text-sm sm:w-40"
            onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }} autoFocus />
        )}
      </div>
    </div>
  );
}

function FrictionDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < score ? score >= 7 ? 'bg-destructive' : score >= 4 ? 'bg-warning' : 'bg-success' : 'bg-border'}`} />
        ))}
      </div>
      <span className="text-sm font-mono text-muted-foreground">{score}/10</span>
    </div>
  );
}

function ScoreBar({ label, value, onSave, canEdit: editable }: { label: string; value: number; onSave?: (v: number) => void; canEdit?: boolean }) {
  const [editing, setEditing] = useState(false);
  const colorClass = value >= 4 ? 'bg-success' : value === 3 ? 'bg-warning' : 'bg-destructive';

  if (editing && editable && onSave) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} onClick={() => { onSave(v); setEditing(false); }}
              className={`w-7 h-7 rounded text-xs font-mono border ${v === value ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:bg-accent'}`}
            >{v}</button>
          ))}
        </div>
        <button onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => editable && setEditing(true)}>
      <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-4 text-right">{value}</span>
      {editable && <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 min-w-0">
      <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b">{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`status-badge ${className || 'bg-primary/10 text-primary'}`}>{children}</span>;
}

function ReadonlyDetailRow({ label, value, valueClassName = '' }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="flex flex-col gap-1 border-b py-2 sm:flex-row sm:justify-between sm:gap-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:text-sm sm:normal-case sm:tracking-normal">{label}</span>
      <div className="w-full min-w-0 sm:w-auto sm:max-w-[60%]">
        <span className={`block min-w-0 whitespace-pre-wrap break-words text-left text-sm font-medium ${valueClassName}`}>{value || '—'}</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function PianoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: piano, isLoading } = usePiano(id);
  const related = usePianoRelated(id);
  const updatePiano = useUpdatePiano();
  const logActivity = useLogActivity();
  const { canEdit, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Overview');
  const qc = useQueryClient();

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!piano) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Piano not found</p>
      <Link to="/inventory" className="text-primary hover:underline text-sm mt-2 inline-block">Back to inventory</Link>
    </div>
  );

  const handleFieldUpdate = (field: string, value: any, oldValue?: any) => {
    updatePiano.mutate({
      id: piano.id,
      updates: { [field]: value },
      fieldName: field,
      oldValue: String(oldValue ?? ''),
      newValue: String(value),
    });
  };

  const inspection = related.inspection.data;
  const tasks = related.tasks.data ?? [];
  const expenses = related.expenses.data;
  const clientRecord = related.clientRecord.data;
  const donationRecord = related.donationRecord.data;
  const characterNotes = related.characterNotes.data;
  const performanceProfile = related.performanceProfile.data;
  const activityLog = related.activityLog.data ?? [];

  const handleConditionUpdate = async (field: string, value: number) => {
    if (!inspection) return;
    const { error } = await supabase.from('condition_inspections').update({ [field]: value }).eq('id', inspection.id);
    if (error) { toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['inspection', piano.id] });
    logActivity(piano.id, `Updated condition ${field}`, field, String(inspection[field as keyof typeof inspection]), String(value));
    toast({ title: 'Saved' });
  };

  const handleIssueToggle = async (field: string) => {
    if (!inspection) return;
    const newVal = !inspection[field as keyof typeof inspection];
    const { error } = await supabase.from('condition_inspections').update({ [field]: newVal }).eq('id', inspection.id);
    if (error) { toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['inspection', piano.id] });
    logActivity(piano.id, `${newVal ? 'Flagged' : 'Cleared'} ${field.replace(/_/g, ' ')}`);
    toast({ title: 'Saved' });
  };

  return (
    <div className="mx-auto max-w-5xl min-w-0 p-4 sm:p-6 lg:p-8">
      {!canEdit && (
        <div className="mb-4 p-3 bg-muted/50 border rounded-lg text-sm text-muted-foreground">
          You have view-only access. Contact an admin to request edit permissions.
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to inventory
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {piano.color_tag && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_TAG_HEX[piano.color_tag as ColorTag] || '#94a3b8' }} />}
              <span className="text-sm font-mono text-muted-foreground">{piano.inventory_id}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">{piano.brand} {piano.model}</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {piano.inventory_id} · {PIANO_TYPE_LABELS[piano.piano_type as PianoType] || piano.piano_type} · #{piano.serial_number || '—'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit ? (
              <Select value={piano.status} onValueChange={v => handleFieldUpdate('status', v, piano.status)}>
                <SelectTrigger className={`h-8 w-auto text-xs status-badge ${STATUS_COLORS[piano.status as PianoStatus] || ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className={`status-badge ${STATUS_COLORS[piano.status as PianoStatus] || ''}`}>{STATUS_LABELS[piano.status as PianoStatus] || piano.status}</span>
            )}
            {canEdit ? (
              <Select value={piano.roi_health || 'moderate'} onValueChange={v => handleFieldUpdate('roi_health', v, piano.roi_health)}>
                <SelectTrigger className={`h-8 w-auto text-xs status-badge ${ROI_HEALTH_COLORS[(piano.roi_health || 'moderate') as RoiHealth] || ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROI_HEALTH_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v} ROI</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className={`status-badge ${ROI_HEALTH_COLORS[(piano.roi_health || 'moderate') as RoiHealth] || ''}`}>{ROI_HEALTH_LABELS[(piano.roi_health || 'moderate') as RoiHealth]} ROI</span>
            )}
          </div>
        </div>

        {piano.friction_score && piano.friction_score >= 7 && (
          <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg flex items-start gap-2">
            <span className="text-destructive text-lg">⚠</span>
            <p className="text-sm"><span className="font-semibold">High friction instrument</span> · Score {piano.friction_score}/10 · Cap investment before committing further scope.</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Restoration Progress</span>
            <span className="text-sm font-bold font-mono">{piano.percent_complete || 0}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${piano.percent_complete || 0}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b mb-6 -mx-4 sm:mx-0 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex min-w-max px-4 sm:px-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >{t}</button>
          ))}
        </div>
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'Overview' && (
          <div className="space-y-0">
            <PianoPhotosSection pianoId={piano.id} />
            <Section title="Piano Details">
              <div className="grid sm:grid-cols-2 gap-x-6">
                <InlineField label="Brand" value={piano.brand} onSave={v => handleFieldUpdate('brand', v, piano.brand)} canEdit={canEdit} />
                <InlineField label="Model" value={piano.model || ''} onSave={v => handleFieldUpdate('model', v, piano.model)} canEdit={canEdit} />
                <InlineField label="Serial" value={piano.serial_number || ''} onSave={v => handleFieldUpdate('serial_number', v, piano.serial_number)} canEdit={canEdit} />
                <InlineField label="Type" value={piano.piano_type} type="select" options={PIANO_TYPE_LABELS} onSave={v => handleFieldUpdate('piano_type', v, piano.piano_type)} canEdit={canEdit} />
                <InlineField label="Finish" value={piano.finish || ''} onSave={v => handleFieldUpdate('finish', v, piano.finish)} canEdit={canEdit} />
                <InlineField label="Year Built" value={piano.year_built || ''} onSave={v => handleFieldUpdate('year_built', v, piano.year_built)} canEdit={canEdit} />
                <InlineField label="Country" value={piano.country_of_origin || ''} onSave={v => handleFieldUpdate('country_of_origin', v, piano.country_of_origin)} canEdit={canEdit} />
                <InlineField label="Color Tag" value={piano.color_tag || ''} type="select" options={COLOR_TAG_LABELS} onSave={v => handleFieldUpdate('color_tag', v, piano.color_tag)} canEdit={canEdit} />
              </div>
            </Section>

            <Section title="Sales & Finishing">
              <InlineField label="Finish Plan" value={(piano as any).finish_plan || ''} type="textarea" onSave={v => handleFieldUpdate('finish_plan', v, (piano as any).finish_plan)} canEdit={canEdit} />
              <InlineField label="Selling Channel" value={(piano as any).selling_channel || ''} onSave={v => handleFieldUpdate('selling_channel', v, (piano as any).selling_channel)} canEdit={canEdit} />
              <InlineField label="Lane" value={(piano as any).lane || ''} onSave={v => handleFieldUpdate('lane', v, (piano as any).lane)} canEdit={canEdit} />
              <InlineField label="Pricing Notes" value={(piano as any).pricing_notes || ''} type="textarea" onSave={v => handleFieldUpdate('pricing_notes', v, (piano as any).pricing_notes)} canEdit={canEdit} />
            </Section>

            {piano.friction_score != null && (
              <Section title="Friction Score">
                <FrictionDots score={piano.friction_score} />
                {canEdit && (
                  <div className="mt-2">
                    <InlineField label="Score (1-10)" value={String(piano.friction_score)} onSave={v => handleFieldUpdate('friction_score', parseInt(v) || piano.friction_score, piano.friction_score)} canEdit={canEdit} />
                  </div>
                )}
              </Section>
            )}

            <Section title="ROI Health">
              <div className="flex items-center gap-3">
                <span className={`status-badge text-sm ${ROI_HEALTH_COLORS[(piano.roi_health || 'moderate') as RoiHealth] || ''}`}>
                  {ROI_HEALTH_LABELS[(piano.roi_health || 'moderate') as RoiHealth]}
                </span>
              </div>
            </Section>

            {piano.private_notes && (
              <Section title="Private Notes">
                {canEdit ? (
                  <EditableTextarea value={piano.private_notes} onSave={v => handleFieldUpdate('private_notes', v, piano.private_notes)} />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{piano.private_notes}</p>
                )}
              </Section>
            )}

            {performanceProfile && (
              <Section title="Performance Profile">
                <div className="grid sm:grid-cols-2 gap-x-6">
                  {[
                    ['Pitch Level', performanceProfile.pitch_level],
                    ['Last Tuning', performanceProfile.last_tuning_date || '—'],
                    ['Pitch Raise Required', performanceProfile.pitch_raise_required ? 'Required' : 'Not required'],
                    ['Regulation Status', performanceProfile.regulation_status],
                    ['Voicing Status', performanceProfile.voicing_status],
                    ['Humidity Sensitivity', performanceProfile.humidity_sensitivity],
                  ].map(([label, value]) => (
                    <ReadonlyDetailRow key={label as string} label={label as string} value={(value as string) || '—'} />
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {activeTab === 'Intake' && (
          <div className="space-y-0">
            {inspection ? (
              <>
                <Section title="Condition Scores (1–5)">
                  <div className="space-y-2.5">
                    {(['soundboard', 'bridges', 'pinblock', 'strings', 'tuning_pins', 'action', 'hammers', 'dampers', 'keytops', 'pedals', 'trapwork', 'cabinet', 'casters'] as const).map(field => (
                      <ScoreBar key={field} label={field.replace(/_/g, ' ')} value={(inspection[field] as number) || 3}
                        onSave={v => handleConditionUpdate(field, v)} canEdit={canEdit} />
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Overall avg: <span className="font-mono font-semibold text-foreground">
                        {((['soundboard', 'bridges', 'pinblock', 'strings', 'tuning_pins', 'action', 'hammers', 'dampers', 'keytops', 'pedals', 'trapwork', 'cabinet', 'casters'] as const)
                          .reduce((s, f) => s + ((inspection[f] as number) || 3), 0) / 13).toFixed(1)}
                      </span> / 5
                    </p>
                  </div>
                </Section>

                <Section title="Structural Issues">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { key: 'soundboard_cracks', label: 'Soundboard cracks' },
                      { key: 'bridge_separation', label: 'Bridge separation' },
                      { key: 'loose_tuning_pins', label: 'Loose tuning pins' },
                      { key: 'rust', label: 'Rust' },
                      { key: 'water_damage', label: 'Water damage' },
                      { key: 'action_wear', label: 'Action wear' },
                      { key: 'loose_joints', label: 'Loose joints' },
                      { key: 'pedal_problems', label: 'Pedal problems' },
                    ].map(({ key, label }) => {
                      const present = inspection[key as keyof typeof inspection] as boolean;
                      return (
                        <button key={key} disabled={!canEdit}
                          onClick={() => canEdit && handleIssueToggle(key)}
                          className={`flex items-center gap-2 py-2 px-3 rounded border text-sm transition-colors ${present ? 'bg-destructive/5 border-destructive/20' : 'bg-card'} ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${present ? 'bg-destructive' : 'bg-success'}`} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No inspection report yet</p>
              </div>
            )}

            <Section title="Source & Ownership">
              <div className="flex flex-wrap gap-2">
                <Tag>{OWNERSHIP_LABELS[piano.ownership_category as OwnershipCategory] || piano.ownership_category}</Tag>
                <Tag className="bg-secondary text-secondary-foreground">Source: {(piano.source || '').replace(/_/g, ' ')}</Tag>
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'Restoration' && (
          <RestorationContent pianoId={piano.id} tasks={tasks} performanceProfile={performanceProfile} canEdit={canEdit} />
        )}

        {activeTab === 'Expenses' && (
          <ExpensesContent pianoId={piano.id} expenses={expenses} clientRecord={clientRecord} donationRecord={donationRecord} canEdit={canEdit} />
        )}

        {activeTab === 'Character Notes' && (
          <CharacterContent pianoId={piano.id} characterNotes={characterNotes} canEdit={canEdit} />
        )}

        {activeTab === 'Catalogue' && (
          <CatalogueTab pianoId={piano.id} inventoryId={piano.inventory_id} estimatedSalePrice={expenses?.estimated_sale_price} canEdit={canEdit} />
        )}

        {activeTab === 'Activity' && (
          <Section title="Activity Log">
            {activityLog.length > 0 ? (
              <div className="space-y-3">
                {activityLog.map((a: any) => (
                  <div key={a.id} className="flex gap-3 py-2 border-b last:border-0">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {(a.user_name || '?').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {a.user_name}
                      </p>
                      <p className="text-sm">{a.action_description}</p>
                      {a.old_value && a.new_value && (
                        <p className="text-xs text-muted-foreground mt-0.5">{a.changed_field}: {a.old_value} → {a.new_value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">No activity recorded yet</p>
            )}
          </Section>
        )}
      </motion.div>
    </div>
  );
}

// ── Editable Textarea (auto-save on blur) ────────────────
function EditableTextarea({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleBlur = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group min-w-0 cursor-pointer" onClick={() => { setDraft(value); setEditing(true); }}>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{value || 'Click to add notes…'}</p>
        <p className="text-xs text-muted-foreground/50 mt-1 opacity-0 group-hover:opacity-100">Click to edit</p>
      </div>
    );
  }

  return (
    <div>
      <Textarea value={draft} onChange={e => setDraft(e.target.value)} rows={6} className="w-full min-w-0 text-sm" autoFocus onBlur={handleBlur} />
      <p className="text-xs text-muted-foreground mt-1">Auto-saves when you click away</p>
    </div>
  );
}

// ── Category grouping for tasks ──────────────────────────
const CATEGORY_GROUP_ORDER = [
  { key: 'cleaning', label: 'Assessment & Cleaning' },
  { key: 'structural', label: 'Structural' },
  { key: 'regulation', label: 'Mechanical & Regulation' },
  { key: 'voicing', label: 'Voicing' },
  { key: 'pedal_repair', label: 'Pedals & Trapwork' },
  { key: 'tuning', label: 'Tuning' },
  { key: 'cabinet_work', label: 'Finishing & Cabinet' },
  { key: 'final_qc', label: 'Final' },
  { key: 'other', label: 'Other' },
];

function getCategoryGroup(cat: string): string {
  if (['cleaning'].includes(cat)) return 'cleaning';
  if (['structural'].includes(cat)) return 'structural';
  if (['regulation', 'key_leveling', 'key_bushing_replacement', 'action_rebuild', 'damper_regulation'].includes(cat)) return 'regulation';
  if (['voicing', 'hammer_shaping', 'hammer_replacement'].includes(cat)) return 'voicing';
  if (['pedal_repair'].includes(cat)) return 'pedal_repair';
  if (['tuning', 'pitch_raise'].includes(cat)) return 'tuning';
  if (['cabinet_work', 'cabinet_repair', 'refinishing', 'polishing', 'final_detailing'].includes(cat)) return 'cabinet_work';
  if (['final_qc'].includes(cat)) return 'final_qc';
  return 'other';
}

// ── Sanding grit options ─────────────────────────────────
const SANDING_GRITS: Record<string, string[]> = {
  'Initial Sanding (40-240 grit)': ['40', '80', '120', '240'],
  'Medium Sanding (400-1000 grit)': ['400', '600', '800', '1000'],
  'Fine Sanding (2000-5000 grit)': ['2000', '3000', '4000', '5000'],
};

// ── Task Row Component ───────────────────────────────────
function TaskRow({ task: t, editable, onUpdate, onDelete }: {
  task: any; editable: boolean;
  onUpdate: (id: string, updates: Record<string, any>) => Promise<void>;
  onDelete: (id: string, title: string) => Promise<void>;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(t.notes || '');
  const grits = SANDING_GRITS[t.title];

  return (
    <div className="p-3 hover:bg-muted/10 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="font-medium text-sm">{t.title}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {editable ? (
            <Select value={t.status} onValueChange={v => onUpdate(t.id, { status: v, ...(v === 'done' ? { completion_date: new Date().toISOString().split('T')[0] } : {}) })}>
              <SelectTrigger className={`h-7 text-xs ${TASK_STATUS_STYLES[t.status] || 'bg-muted text-muted-foreground'}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Awaiting Parts</SelectItem>
                <SelectItem value="done">Complete</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className={`status-badge text-xs ${TASK_STATUS_STYLES[t.status] || ''}`}>{TASK_STATUS_DISPLAY[t.status] || t.status}</span>
          )}
          {editable && (
            <button onClick={() => onDelete(t.id, t.title)} className="p-1 hover:bg-destructive/10 rounded">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
        <div>Assigned: <span className="text-foreground">{t.assignee || '—'}</span></div>
        <div>Hours: <span className="text-foreground font-mono">{t.labor_hours}h</span></div>
        <div>Parts: <span className="text-foreground">{t.parts_used || 'None'}</span></div>
        {t.completion_date && <div>Completed: <span className="text-foreground">{t.completion_date}</span></div>}
      </div>

      {/* Sanding grit dropdown */}
      {grits && editable && (
        <div className="mt-2">
          <Select value={t.parts_used || ''} onValueChange={v => onUpdate(t.id, { parts_used: v })}>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue placeholder="Select grit" />
            </SelectTrigger>
            <SelectContent>
              {grits.map(g => <SelectItem key={g} value={`${g} grit`}>{g} grit</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes toggle + inline editor */}
      <div className="mt-1.5">
        <button
          onClick={() => { setShowNotes(!showNotes); setNotesDraft(t.notes || ''); }}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.notes ? '📝 View/Edit Notes' : '+ Add Notes'}
        </button>
        {showNotes && (
          <div className="mt-1.5 space-y-1.5">
            {editable ? (
              <>
                <Textarea
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Add repair notes, observations…"
                  rows={3}
                  className="text-xs min-h-[60px]"
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-[11px] px-2" onClick={() => { onUpdate(t.id, { notes: notesDraft }); setShowNotes(false); }}>Save</Button>
                  <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => setShowNotes(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic whitespace-pre-wrap">{t.notes || 'No notes yet.'}</p>
            )}
          </div>
        )}
        {!showNotes && t.notes && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">{t.notes}</p>}
      </div>
    </div>
  );
}

// ── Restoration Content ──────────────────────────────────
function RestorationContent({ pianoId, tasks, performanceProfile, canEdit: editable }: {
  pianoId: string; tasks: any[]; performanceProfile: any; canEdit: boolean;
}) {
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', category: 'other', assignee: '', status: 'todo', labor_hours: '0', parts_used: '', notes: '' });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [applyingTemplates, setApplyingTemplates] = useState(false);
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;
  const pctComplete = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Group tasks by category
  const groupedTasks = CATEGORY_GROUP_ORDER.map(g => ({
    ...g,
    tasks: tasks.filter(t => getCategoryGroup(t.category || 'other') === g.key),
  })).filter(g => g.tasks.length > 0);

  const handleAddTask = async () => {
    if (!user || !newTask.title.trim()) return;
    const { error } = await supabase.from('restoration_tasks').insert({
      piano_id: pianoId, title: newTask.title, category: newTask.category,
      assignee: newTask.assignee || null, status: newTask.status,
      labor_hours: parseFloat(newTask.labor_hours) || 0,
      parts_used: newTask.parts_used, notes: newTask.notes, created_by: user.id,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('activity_log').insert({
      piano_id: pianoId, user_id: user.id, user_name: profile?.full_name || user.email || '',
      action_description: `Added task: ${newTask.title}`,
    });
    qc.invalidateQueries({ queryKey: ['tasks', pianoId] });
    qc.invalidateQueries({ queryKey: ['activity_log', pianoId] });
    setAddingTask(false);
    setNewTask({ title: '', category: 'other', assignee: '', status: 'todo', labor_hours: '0', parts_used: '', notes: '' });
    toast({ title: 'Task added' });
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Delete task "${taskTitle}"?`)) return;
    await supabase.from('restoration_tasks').delete().eq('id', taskId);
    qc.invalidateQueries({ queryKey: ['tasks', pianoId] });
    toast({ title: 'Task deleted' });
  };

  const handleUpdateTask = async (taskId: string, updates: Record<string, any>) => {
    await supabase.from('restoration_tasks').update(updates).eq('id', taskId);
    qc.invalidateQueries({ queryKey: ['tasks', pianoId] });
    toast({ title: 'Saved' });
  };

  const handleApplyStandardTasks = async () => {
    if (!confirm('This will add all standard tasks not already present on this piano. Existing tasks will not be changed. Continue?')) return;
    setApplyingTemplates(true);
    try {
      const { data: templates } = await supabase.from('task_templates').select('*').eq('active', true);
      const existingTitles = tasks.map((t: any) => t.title);
      const toInsert = (templates ?? [])
        .filter(t => !existingTitles.includes(t.task_name))
        .map(t => ({
          piano_id: pianoId, title: t.task_name, category: t.category, status: t.default_status,
        }));
      if (toInsert.length === 0) {
        toast({ title: 'All standard tasks already present' });
        return;
      }
      const { error } = await supabase.from('restoration_tasks').insert(toInsert);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tasks', pianoId] });
      toast({ title: `${toInsert.length} standard tasks applied` });
    } catch {
      toast({ title: 'Error', description: 'Failed to apply templates', variant: 'destructive' });
    } finally {
      setApplyingTemplates(false);
    }
  };

  const toggleGroup = (key: string) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-0">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tasks Complete: {doneCount} / {totalCount}</span>
            <span className="text-sm font-bold font-mono">{pctComplete}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full">
            <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pctComplete}%` }} />
          </div>
        </div>
      )}

      <Section title="Restoration Tasks">
        {editable && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {!addingTask && (
              <>
                <Button size="sm" variant="outline" onClick={() => setAddingTask(true)}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
                <Button size="sm" variant="outline" onClick={handleApplyStandardTasks} disabled={applyingTemplates}>
                  {applyingTemplates ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Apply Standard Tasks
                </Button>
              </>
            )}
            {addingTask && (
              <div className="w-full p-4 bg-card rounded-lg border space-y-3">
                <Input placeholder="Task name" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newTask.category} onValueChange={v => setNewTask(t => ({ ...t, category: v }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TASK_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Assignee" value={newTask.assignee} onChange={e => setNewTask(t => ({ ...t, assignee: e.target.value }))} />
                  <Select value={newTask.status} onValueChange={v => setNewTask(t => ({ ...t, status: v }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="blocked">Awaiting Parts</SelectItem>
                      <SelectItem value="done">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Hours" value={newTask.labor_hours} onChange={e => setNewTask(t => ({ ...t, labor_hours: e.target.value }))} />
                </div>
                <Input placeholder="Parts used" value={newTask.parts_used} onChange={e => setNewTask(t => ({ ...t, parts_used: e.target.value }))} />
                <Textarea placeholder="Notes" value={newTask.notes} onChange={e => setNewTask(t => ({ ...t, notes: e.target.value }))} rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddTask} disabled={!newTask.title.trim()}>Save Task</Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingTask(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {groupedTasks.length > 0 ? (
          <div className="space-y-3">
            {groupedTasks.map(group => {
              const groupDone = group.tasks.filter((t: any) => t.status === 'done').length;
              const isCollapsed = collapsedGroups[group.key] ?? false;
              return (
                <div key={group.key} className="rounded-lg border overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isCollapsed ? '' : 'rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                      <span className="text-sm font-semibold">{group.label}</span>
                      <span className="text-xs font-mono text-muted-foreground">({group.tasks.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{groupDone}/{group.tasks.length}</span>
                      <div className="w-16 h-1.5 bg-border rounded-full">
                        <div className="h-full bg-success rounded-full" style={{ width: `${group.tasks.length > 0 ? (groupDone / group.tasks.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y">
                      {group.tasks.map((t: any) => (
                        <TaskRow key={t.id} task={t} editable={editable} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-3">No tasks yet</p>
            {editable && (
              <Button size="sm" variant="outline" onClick={handleApplyStandardTasks} disabled={applyingTemplates}>
                Apply Standard Tasks
              </Button>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Expenses Content ─────────────────────────────────────
function ExpensesContent({ pianoId, expenses, clientRecord, donationRecord, canEdit: editable }: {
  pianoId: string; expenses: any; clientRecord: any; donationRecord: any; canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  const startEdit = () => {
    if (expenses) {
      setForm({ ...expenses });
    } else {
      setForm({ piano_id: pianoId, purchase_price: 0, moving_cost: 0, parts_cost: 0, labor_hours: 0, labor_cost: 0, marketing_cost: 0, estimated_sale_price: 0 });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    const total = (parseFloat(form.purchase_price) || 0) + (parseFloat(form.moving_cost) || 0) +
      (parseFloat(form.parts_cost) || 0) + (parseFloat(form.labor_cost) || 0) + (parseFloat(form.marketing_cost) || 0);
    const data = {
      purchase_price: parseFloat(form.purchase_price) || 0,
      moving_cost: parseFloat(form.moving_cost) || 0,
      parts_cost: parseFloat(form.parts_cost) || 0,
      labor_hours: parseFloat(form.labor_hours) || 0,
      labor_cost: parseFloat(form.labor_cost) || 0,
      marketing_cost: parseFloat(form.marketing_cost) || 0,
      estimated_sale_price: parseFloat(form.estimated_sale_price) || null,
      actual_sale_price: form.actual_sale_price ? parseFloat(form.actual_sale_price) : null,
    };

    if (expenses?.id) {
      await supabase.from('expenses').update(data).eq('id', expenses.id);
    } else {
      await supabase.from('expenses').insert({ ...data, piano_id: pianoId });
    }

    if (user) {
      await supabase.from('activity_log').insert({
        piano_id: pianoId, user_id: user.id, user_name: profile?.full_name || '',
        action_description: 'Updated expenses',
      });
    }

    qc.invalidateQueries({ queryKey: ['expenses', pianoId] });
    qc.invalidateQueries({ queryKey: ['activity_log', pianoId] });
    setEditing(false);
    toast({ title: 'Saved' });
  };

  if (clientRecord) {
    return (
      <Section title="Client Job Details">
        <div className="grid sm:grid-cols-2 gap-x-6">
          {[
            ['Client Name', clientRecord.client_name],
            ['Estimate', clientRecord.estimate ? `$${clientRecord.estimate}` : '—'],
            ['Deposit', `$${clientRecord.deposit_received || 0}`],
            ['Work Authorized', clientRecord.work_authorized ? 'Yes' : 'No'],
            ['Labor Hours', `${clientRecord.labor_hours || 0}h`],
            ['Invoice Total', clientRecord.invoice_total ? `$${clientRecord.invoice_total}` : 'Pending'],
            ['Balance Due', `$${clientRecord.balance_due || 0}`],
            ['Pickup Date', clientRecord.pickup_date || 'TBD'],
          ].map(([k, v]) => (
            <ReadonlyDetailRow key={k as string} label={k as string} value={v as string} />
          ))}
        </div>
      </Section>
    );
  }

  if (donationRecord) {
    return (
      <Section title="Donation Project">
        <div className="grid sm:grid-cols-2 gap-x-6">
          {[
            ['Recipient', donationRecord.donation_recipient || '—'],
            ['Status', (donationRecord.donation_status || '').replace(/_/g, ' ')],
            ['Value', donationRecord.donation_value ? `$${donationRecord.donation_value}` : '—'],
            ['Delivery', donationRecord.delivery_date || 'TBD'],
          ].map(([k, v]) => (
            <ReadonlyDetailRow key={k as string} label={k as string} value={v as string} valueClassName="capitalize" />
          ))}
        </div>
        {donationRecord.notes && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">{donationRecord.notes}</p>}
      </Section>
    );
  }

  if (editing && form) {
    const total = (parseFloat(form.purchase_price) || 0) + (parseFloat(form.moving_cost) || 0) +
      (parseFloat(form.parts_cost) || 0) + (parseFloat(form.labor_cost) || 0) + (parseFloat(form.marketing_cost) || 0);
    const est = parseFloat(form.estimated_sale_price) || 0;
    const profit = est - total;
    const margin = total > 0 ? Math.round((profit / total) * 100) : 0;

    return (
      <div className="space-y-0">
        <Section title="Cost Breakdown">
          <div className="space-y-3">
            {[
              ['Purchase Price', 'purchase_price'], ['Moving Cost', 'moving_cost'], ['Parts Cost', 'parts_cost'],
              ['Labor Hours', 'labor_hours'], ['Labor Cost', 'labor_cost'], ['Marketing', 'marketing_cost'],
              ['Est. Sale Price', 'estimated_sale_price'],
            ].map(([label, key]) => (
              <div key={key as string} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="text-sm text-muted-foreground">{label as string}</span>
                <Input type="number" value={form[key as string] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [key as string]: e.target.value }))} className="h-8 w-full text-sm sm:w-32 sm:text-right" />
              </div>
            ))}
          </div>
        </Section>
        <Section title="Summary">
          <div className="space-y-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><span className="text-muted-foreground">Total Invested</span><span className="font-mono font-bold">${total.toLocaleString()}</span></div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><span className="text-muted-foreground">Projected Profit</span><span className={`font-mono font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>${profit.toLocaleString()}</span></div>
            {margin > 0 && <div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><span className="text-muted-foreground">Margin</span><span className="font-mono">{margin}%</span></div>}
          </div>
        </Section>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (expenses) {
    const total = (expenses.purchase_price || 0) + (expenses.moving_cost || 0) + (expenses.parts_cost || 0) + (expenses.labor_cost || 0) + (expenses.marketing_cost || 0);
    const profit = (expenses.estimated_sale_price || 0) - total;
    const margin = total > 0 ? Math.round((profit / total) * 100) : 0;

    return (
      <div className="space-y-0">
        <Section title="Cost Breakdown">
          {editable && <Button size="sm" variant="outline" className="mb-3" onClick={startEdit}><Edit className="h-3.5 w-3.5 mr-1" /> Edit</Button>}
          <div className="space-y-1.5">
            {[
              ['Purchase Price', expenses.purchase_price], ['Moving Cost', expenses.moving_cost],
              ['Parts Cost', expenses.parts_cost], ['Labor Cost', expenses.labor_cost], ['Marketing', expenses.marketing_cost],
            ].map(([k, v]) => (
              <ReadonlyDetailRow key={k as string} label={k as string} value={`$${((v as number) || 0).toLocaleString()}`} valueClassName="font-mono" />
            ))}
          </div>
        </Section>
        <Section title="Profit Summary">
          <div className="space-y-3">
            <div className="flex flex-col gap-1 border-b py-2 sm:flex-row sm:justify-between"><span className="text-sm font-medium">Total Invested</span><span className="text-sm font-mono font-bold">${total.toLocaleString()}</span></div>
            <div className="flex flex-col gap-1 border-b py-2 sm:flex-row sm:justify-between"><span className="text-sm font-medium">Est. Sale Price</span><span className="text-sm font-mono font-bold">${(expenses.estimated_sale_price || 0).toLocaleString()}</span></div>
            <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">Projected Profit</span>
              <div className="text-left sm:text-right">
                <span className={`text-lg font-mono font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>${profit.toLocaleString()}</span>
                {margin > 0 && <span className="text-xs text-muted-foreground ml-2">{margin}% margin</span>}
              </div>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>No expenses recorded</p>
      {editable && <Button variant="outline" size="sm" className="mt-3" onClick={startEdit}>Add Expenses</Button>}
    </div>
  );
}

// ── Character Notes Content ──────────────────────────────
function CharacterContent({ pianoId, characterNotes, canEdit: editable }: {
  pianoId: string; characterNotes: any; canEdit: boolean;
}) {
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  const handleTagToggle = async (field: string, tag: string) => {
    if (!editable) return;
    const current: string[] = characterNotes?.[field] || [];
    const updated = current.includes(tag) ? current.filter((t: string) => t !== tag) : [...current, tag];

    if (characterNotes?.id) {
      await supabase.from('character_notes').update({ [field]: updated }).eq('id', characterNotes.id);
    } else {
      await supabase.from('character_notes').insert({ piano_id: pianoId, [field]: updated });
    }
    qc.invalidateQueries({ queryKey: ['character_notes', pianoId] });
    toast({ title: 'Saved' });
  };

  const handleShopNotes = async (value: string) => {
    if (characterNotes?.id) {
      await supabase.from('character_notes').update({ custom_shop_notes: value }).eq('id', characterNotes.id);
    } else {
      await supabase.from('character_notes').insert({ piano_id: pianoId, custom_shop_notes: value });
    }
    qc.invalidateQueries({ queryKey: ['character_notes', pianoId] });
    toast({ title: 'Saved' });
  };

  const tagSections: { title: string; field: string; labels: Record<string, string>; colorClass: string }[] = [
    { title: 'Tonal Character', field: 'tonal_character', labels: TONAL_CHARACTER_LABELS, colorClass: 'bg-primary/10 text-primary' },
    { title: 'Action Feel', field: 'action_feel', labels: ACTION_FEEL_LABELS, colorClass: 'bg-info/10 text-info' },
    { title: 'Musical Suitability', field: 'musical_suitability', labels: MUSICAL_SUITABILITY_LABELS, colorClass: 'bg-success/10 text-success' },
    { title: 'Cabinet / Visual', field: 'cabinet_character', labels: CABINET_CHARACTER_LABELS, colorClass: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="space-y-0">
      {tagSections.map(({ title, field, labels, colorClass }) => {
        const selected: string[] = characterNotes?.[field] || [];
        return (
          <Section key={field} title={title}>
            <div className="flex flex-wrap gap-2">
              {Object.entries(labels).map(([key, label]) => {
                const isSelected = selected.includes(key);
                return (
                  <button key={key} onClick={() => handleTagToggle(field, key)} disabled={!editable}
                    className={`status-badge transition-colors ${isSelected ? colorClass : 'bg-muted/50 text-muted-foreground'} ${editable ? 'cursor-pointer hover:opacity-80' : ''}`}
                  >{label}</button>
                );
              })}
            </div>
          </Section>
        );
      })}

      <Section title="Custom Shop Notes">
        {editable ? (
          <EditableTextarea value={characterNotes?.custom_shop_notes || ''} onSave={handleShopNotes} />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{characterNotes?.custom_shop_notes || 'No notes yet'}</p>
        )}
      </Section>
    </div>
  );
}
