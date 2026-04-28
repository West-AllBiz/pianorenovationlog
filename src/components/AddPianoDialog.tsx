import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { PIANO_TYPE_LABELS, STATUS_LABELS, COLOR_TAG_LABELS } from '@/types/piano';

interface AddPianoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = ['Identification', 'Ownership', 'Condition', 'Financial', 'Review'];

const CONDITION_FIELDS = [
  'soundboard', 'bridges', 'pinblock', 'strings', 'tuning_pins',
  'action', 'hammers', 'dampers', 'keytops', 'pedals', 'trapwork', 'cabinet', 'casters',
] as const;

const STRUCTURAL_ISSUES = [
  { key: 'soundboard_cracks', label: 'Soundboard cracks' },
  { key: 'bridge_separation', label: 'Bridge separation' },
  { key: 'loose_tuning_pins', label: 'Loose tuning pins' },
  { key: 'rust', label: 'Rust' },
  { key: 'water_damage', label: 'Water damage' },
  { key: 'action_wear', label: 'Action wear' },
  { key: 'loose_joints', label: 'Loose joints' },
  { key: 'pedal_problems', label: 'Pedal problems' },
] as const;

export function AddPianoDialog({ open, onOpenChange }: AddPianoDialogProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    brand: '', model: '', serial_number: '', piano_type: 'upright',
    year_built: '', country_of_origin: '', finish: '', bench_included: false,
    ownership_category: 'business_inventory', source: 'other', color_tag: '',
    status: 'acquired',
    sale_type: 'internal_inventory',
    client_name: '', client_contact: '', work_authorized: false,
    donation_recipient: '', donation_status: 'pending',
    purchase_price: '', moving_cost: '', estimated_sale_price: '', notes: '',
    conditions: Object.fromEntries(CONDITION_FIELDS.map(f => [f, 3])) as Record<string, number>,
    issues: Object.fromEntries(STRUCTURAL_ISSUES.map(i => [i.key, false])) as Record<string, boolean>,
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const setCondition = (key: string, val: number) =>
    setForm(f => ({ ...f, conditions: { ...f.conditions, [key]: val } }));
  const toggleIssue = (key: string) =>
    setForm(f => ({ ...f, issues: { ...f.issues, [key]: !f.issues[key] } }));

  const isBusinessInventory = form.ownership_category === 'business_inventory';
  const isClient = form.ownership_category === 'client_piano';
  const isDonation = form.ownership_category === 'donation_project';

  const canProceed = () => {
    if (step === 0) return form.brand.trim() !== '' && form.piano_type !== '';
    if (step === 1) return form.ownership_category !== '' && form.source !== '' && form.status !== '';
    return true;
  };

  const effectiveSteps = isBusinessInventory ? STEPS : STEPS.filter(s => s !== 'Financial');
  const totalSteps = effectiveSteps.length;
  const currentStepName = effectiveSteps[step];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Generate inventory ID
      const { count } = await supabase.from('pianos').select('*', { count: 'exact', head: true });
      const nextNum = (count || 0) + 1;
      const inventoryId = `P-${String(nextNum).padStart(3, '0')}`;

      const { data: piano, error } = await supabase.from('pianos').insert({
        inventory_id: inventoryId,
        brand: form.brand,
        model: form.model || '',
        serial_number: form.serial_number || '',
        piano_type: form.piano_type,
        year_built: form.year_built || '',
        country_of_origin: form.country_of_origin || '',
        finish: form.finish || '',
        bench_included: form.bench_included,
        ownership_category: form.ownership_category,
        source: form.source,
        status: form.status,
        color_tag: form.color_tag || null,
        tag: `Tag ${nextNum}`,
      }).select().single();

      if (error) throw error;

      // Insert condition inspection
      await supabase.from('condition_inspections').insert({
        piano_id: piano.id,
        ...form.conditions,
        ...form.issues,
      });

      // Insert expenses if business inventory
      if (isBusinessInventory) {
        await supabase.from('expenses').insert({
          piano_id: piano.id,
          purchase_price: parseFloat(form.purchase_price) || 0,
          moving_cost: parseFloat(form.moving_cost) || 0,
          estimated_sale_price: parseFloat(form.estimated_sale_price) || null,
          notes: form.notes,
        });
      }

      // Insert client record
      if (isClient && form.client_name) {
        await supabase.from('client_records').insert({
          piano_id: piano.id,
          client_name: form.client_name,
          client_contact: form.client_contact,
          work_authorized: form.work_authorized,
        });
      }

      // Insert donation record
      if (isDonation) {
        await supabase.from('donation_records').insert({
          piano_id: piano.id,
          donation_recipient: form.donation_recipient,
          donation_status: form.donation_status,
        });
      }

      // Activity log
      await supabase.from('activity_log').insert({
        piano_id: piano.id,
        user_id: user.id,
        user_name: profile?.full_name || user.email || 'Unknown',
        action_description: `Piano added by ${profile?.full_name || 'user'}`,
      });

      qc.invalidateQueries({ queryKey: ['pianos'] });
      toast({ title: 'Piano added', description: `${form.brand} (${inventoryId}) has been added to inventory.` });
      onOpenChange(false);
      setStep(0);
      navigate(`/piano/${piano.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save piano', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Piano — {currentStepName}</DialogTitle>
          <DialogDescription>Step {step + 1} of {totalSteps}</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {effectiveSteps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: Identification */}
        {currentStepName === 'Identification' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Brand / Make *</Label>
              <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Baldwin, Steinway" />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={form.model} onChange={e => set('model', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Piano Type *</Label>
              <Select value={form.piano_type} onValueChange={v => set('piano_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PIANO_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Year</Label>
                <Input value={form.year_built} onChange={e => set('year_built', e.target.value)} placeholder="c. 1920" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country_of_origin} onChange={e => set('country_of_origin', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Finish</Label>
              <Input value={form.finish} onChange={e => set('finish', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.bench_included} onCheckedChange={v => set('bench_included', v)} />
              <Label>Bench Included</Label>
            </div>
          </div>
        )}

        {/* Step 2: Ownership */}
        {currentStepName === 'Ownership' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ownership *</Label>
              <Select value={form.ownership_category} onValueChange={v => set('ownership_category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_inventory">Business Inventory</SelectItem>
                  <SelectItem value="client_piano">Client Piano</SelectItem>
                  <SelectItem value="donation_project">Donation Project</SelectItem>
                  <SelectItem value="restoration_archive">Restoration Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source *</Label>
              <Select value={form.source} onValueChange={v => set('source', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['auction', 'private_seller', 'estate', 'trade_in', 'client_repair', 'donation', 'other'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color Tag</Label>
              <Select value={form.color_tag} onValueChange={v => set('color_tag', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(COLOR_TAG_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial Stage *</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isClient && (
              <>
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Client Contact</Label>
                  <Input value={form.client_contact} onChange={e => set('client_contact', e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.work_authorized} onCheckedChange={v => set('work_authorized', v)} />
                  <Label>Work Authorized</Label>
                </div>
              </>
            )}

            {isDonation && (
              <>
                <div className="space-y-2">
                  <Label>Donation Recipient</Label>
                  <Input value={form.donation_recipient} onChange={e => set('donation_recipient', e.target.value)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Condition */}
        {currentStepName === 'Condition' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Rate each component 1–5</p>
            <div className="space-y-3">
              {CONDITION_FIELDS.map(field => (
                <div key={field} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24 capitalize">{field.replace(/_/g, ' ')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => setCondition(field, v)}
                        className={`w-8 h-8 rounded text-xs font-mono border transition-colors ${
                          form.conditions[field] === v
                            ? v >= 4 ? 'bg-success/20 border-success text-success' : v === 3 ? 'bg-warning/20 border-warning text-warning' : 'bg-destructive/20 border-destructive text-destructive'
                            : 'bg-muted/50 border-border text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Structural Issues</p>
              <div className="grid grid-cols-2 gap-2">
                {STRUCTURAL_ISSUES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleIssue(key)}
                    className={`flex items-center gap-2 py-2 px-3 rounded border text-sm transition-colors ${
                      form.issues[key] ? 'bg-destructive/5 border-destructive/20 text-foreground' : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${form.issues[key] ? 'bg-destructive' : 'bg-muted'}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Financial (business inventory only) */}
        {currentStepName === 'Financial' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Purchase Price ($)</Label>
              <Input type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Moving Cost ($)</Label>
              <Input type="number" value={form.moving_cost} onChange={e => set('moving_cost', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estimated Sale Price ($)</Label>
              <Input type="number" value={form.estimated_sale_price} onChange={e => set('estimated_sale_price', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStepName === 'Review' && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-muted-foreground">Brand</div><div className="font-medium">{form.brand}</div>
              <div className="text-muted-foreground">Type</div><div className="font-medium capitalize">{form.piano_type.replace(/_/g, ' ')}</div>
              <div className="text-muted-foreground">Serial</div><div className="font-medium">{form.serial_number || '—'}</div>
              <div className="text-muted-foreground">Ownership</div><div className="font-medium capitalize">{form.ownership_category.replace(/_/g, ' ')}</div>
              <div className="text-muted-foreground">Source</div><div className="font-medium capitalize">{form.source.replace(/_/g, ' ')}</div>
              <div className="text-muted-foreground">Status</div><div className="font-medium">{STATUS_LABELS[form.status as keyof typeof STATUS_LABELS] || form.status}</div>
              {isBusinessInventory && form.purchase_price && (
                <><div className="text-muted-foreground">Purchase</div><div className="font-medium">${form.purchase_price}</div></>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)}>
            {step > 0 ? 'Back' : 'Cancel'}
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>Next</Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Piano'}</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
