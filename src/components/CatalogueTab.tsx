
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';

const CATALOGUE_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'in_progress', label: 'Being Restored' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
];

interface CatalogueTabProps {
  pianoId: string;
  inventoryId: string;
  estimatedSalePrice?: number | null;
  canEdit: boolean;
}

export default function CatalogueTab({ pianoId, inventoryId, estimatedSalePrice, canEdit }: CatalogueTabProps) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: catalogue, isLoading } = useQuery({
    queryKey: ['catalogue', pianoId],
    queryFn: async () => {
      const { data } = await supabase.from('catalogue').select('*').eq('piano_id', pianoId).maybeSingle();
      return data;
    },
  });

  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('coming_soon');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState(['', '', '', '']);
  const [priceDisplay, setPriceDisplay] = useState('');
  const [showRestorationNotes, setShowRestorationNotes] = useState(false);
  const [restorationNote, setRestorationNote] = useState('');

  useEffect(() => {
    if (catalogue) {
      setVisible(catalogue.visible ?? false);
      setStatus(catalogue.status || 'coming_soon');
      setDescription(catalogue.public_description || '');
      const h = catalogue.highlights || [];
      setHighlights([h[0] || '', h[1] || '', h[2] || '', h[3] || '']);
      setPriceDisplay(catalogue.price_display || '');
      setShowRestorationNotes(catalogue.show_restoration_notes ?? false);
      setRestorationNote(catalogue.public_restoration_note || '');
    } else if (!isLoading) {
      // Auto-populate price from expenses
      if (estimatedSalePrice) {
        setPriceDisplay(`From $${estimatedSalePrice.toLocaleString()}`);
      }
    }
  }, [catalogue, isLoading, estimatedSalePrice]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      piano_id: pianoId,
      visible,
      status,
      public_description: description,
      highlights: highlights.filter(h => h.trim()),
      price_display: priceDisplay,
      show_restoration_notes: showRestorationNotes,
      public_restoration_note: restorationNote,
    };

    let error;
    if (catalogue?.id) {
      const res = await supabase.from('catalogue').update(payload).eq('id', catalogue.id);
      error = res.error;
    } else {
      const res = await supabase.from('catalogue').insert(payload);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      qc.invalidateQueries({ queryKey: ['catalogue', pianoId] });
      toast({ title: 'Saved', description: 'Catalogue settings updated.' });
    }
  };

  const catalogueUrl = `${window.location.origin}/catalogue/${pianoId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogueUrl);
      toast({ title: 'Link copied!' });
    } catch {
      toast({ title: 'URL', description: catalogueUrl });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Visibility */}
      <div className="p-4 bg-card rounded-xl border">
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Catalogue Visibility</h3>

        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm">Show in public catalogue</Label>
          <Switch checked={visible} onCheckedChange={setVisible} disabled={!canEdit} />
        </div>

        <div>
          <Label className="text-sm mb-2 block">Availability Status</Label>
          <div className="flex flex-wrap gap-2">
            {CATALOGUE_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => canEdit && setStatus(s.value)}
                disabled={!canEdit}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${status === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Listing Content */}
      <div className="p-4 bg-card rounded-xl border">
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Listing Content</h3>

        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-1.5 block">Public Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this piano for potential buyers..."
              className="min-h-[100px]"
              disabled={!canEdit}
            />
          </div>

          <div>
            <Label className="text-sm mb-1.5 block">Highlight Points (up to 4)</Label>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">•</span>
                  <Input
                    value={h}
                    onChange={e => {
                      const next = [...highlights];
                      next[i] = e.target.value;
                      setHighlights(next);
                    }}
                    placeholder={i === 0 ? 'e.g. American-made, last generation Indiana Baldwin' : ''}
                    disabled={!canEdit}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm mb-1.5 block">Price Display Text</Label>
            <Input
              value={priceDisplay}
              onChange={e => setPriceDisplay(e.target.value)}
              placeholder='e.g. "From $2,500 · Custom finish"'
              disabled={!canEdit}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Restoration Notes */}
      <div className="p-4 bg-card rounded-xl border">
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Restoration Notes (optional)</h3>

        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm">Show restoration progress to guests</Label>
          <Switch checked={showRestorationNotes} onCheckedChange={setShowRestorationNotes} disabled={!canEdit} />
        </div>

        <Textarea
          value={restorationNote}
          onChange={e => setRestorationNote(e.target.value)}
          placeholder="e.g. Currently in finishing queue. Available within 2–3 weeks."
          className="min-h-[80px]"
          disabled={!canEdit}
        />
      </div>

      {/* Preview + Link */}
      <div className="p-4 bg-card rounded-xl border">
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Preview</h3>

        {visible && (
          <a href={catalogueUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-3">
            <ExternalLink className="h-3.5 w-3.5" /> Preview how this piano appears in the catalogue
          </a>
        )}

        <div className="mt-2">
          <Label className="text-xs text-muted-foreground mb-1 block">Catalogue URL {!visible && '(hidden until visible)'}</Label>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded flex-1 truncate">{catalogueUrl}</code>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-shrink-0">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Save */}
      {canEdit && (
        <Button onClick={handleSave} disabled={saving} className="w-full h-11 font-mono">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Catalogue Settings
        </Button>
      )}
    </div>
  );
}
