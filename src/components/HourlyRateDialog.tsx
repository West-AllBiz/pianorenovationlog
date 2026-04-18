import { useState } from 'react';
import { Settings } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHourlyRate, useUpdateHourlyRate } from '@/hooks/useAppSettings';

export function HourlyRateButton({ canEdit }: { canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const { data: rate = 100 } = useHourlyRate();
  const update = useUpdateHourlyRate();
  const [draft, setDraft] = useState<string>(String(rate));

  const handleOpen = (next: boolean) => {
    if (next) setDraft(String(rate));
    setOpen(next);
  };

  const handleSave = async () => {
    const num = parseFloat(draft);
    if (!Number.isFinite(num) || num <= 0) return;
    await update.mutateAsync(num);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-primary"
        title="Technician hourly rate"
      >
        <Settings className="h-4 w-4" />
        <span className="font-mono text-[11px]">${rate}/hr</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Technician Hourly Rate</DialogTitle>
            <DialogDescription>
              Used for all labor cost calculations across every piano.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <span className="font-mono text-muted-foreground">$</span>
            <Input
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              disabled={!canEdit}
              className="w-28 font-mono"
            />
            <span className="font-mono text-muted-foreground">/ hr</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canEdit || update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
