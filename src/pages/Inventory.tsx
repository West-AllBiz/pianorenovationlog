import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Plus, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePianos } from '@/hooks/usePianos';
import { useAuth } from '@/hooks/useAuth';
import { AddPianoDialog } from '@/components/AddPianoDialog';
import { STATUS_LABELS, STATUS_COLORS, PIANO_TYPE_LABELS, OWNERSHIP_LABELS, OWNERSHIP_COLORS, COLOR_TAG_HEX } from '@/types/piano';
import { PianoPhotoThumbnail } from '@/components/PianoPhotos';
import type { PianoStatus, OwnershipCategory, ColorTag, PianoType } from '@/types/piano';

export default function Inventory() {
  const { data: pianos = [], isLoading } = usePianos();
  const { canEdit } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    return pianos.filter((p) => {
      const s = search.toLowerCase();
      const matchesSearch = !s ||
        p.brand.toLowerCase().includes(s) ||
        (p.model || '').toLowerCase().includes(s) ||
        (p.serial_number || '').toLowerCase().includes(s) ||
        p.inventory_id.toLowerCase().includes(s) ||
        (p.tag || '').toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesOwnership = ownershipFilter === 'all' || p.ownership_category === ownershipFilter;
      return matchesSearch && matchesStatus && matchesOwnership;
    });
  }, [pianos, search, statusFilter, ownershipFilter]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">{pianos.length} pianos in catalog</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Piano
            </Button>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by brand, serial, ID, or tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button variant="outline" size="sm" className="h-10 shrink-0" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-1.5" /> Filters
        </Button>
      </div>

      {showFilters && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-4 p-4 bg-card rounded-lg border overflow-hidden space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Ownership</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setOwnershipFilter('all')} className={`status-badge transition-colors ${ownershipFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All</button>
              {(Object.entries(OWNERSHIP_LABELS) as [OwnershipCategory, string][]).map(([value, label]) => (
                <button key={value} onClick={() => setOwnershipFilter(value)} className={`status-badge transition-colors ${ownershipFilter === value ? 'bg-primary text-primary-foreground' : `${OWNERSHIP_COLORS[value]}`}`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setStatusFilter('all')} className={`status-badge transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All</button>
              {(Object.entries(STATUS_LABELS) as [PianoStatus, string][]).map(([value, label]) => (
                <button key={value} onClick={() => setStatusFilter(value)} className={`status-badge transition-colors ${statusFilter === value ? 'bg-primary text-primary-foreground' : `${STATUS_COLORS[value]}`}`}>{label}</button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {filtered.map((piano, i) => (
          <motion.div key={piano.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Link to={`/piano/${piano.id}`} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
              <PianoPhotoThumbnail pianoId={piano.id} className="w-12 h-12 flex-shrink-0 hidden sm:block" />
              {piano.color_tag && (
                <div className="w-3 h-3 rounded-full flex-shrink-0 hidden sm:block" style={{ backgroundColor: COLOR_TAG_HEX[piano.color_tag as ColorTag] || '#94a3b8' }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{piano.inventory_id}</span>
                  <span className={`status-badge ${STATUS_COLORS[piano.status as PianoStatus] || ''}`}>{STATUS_LABELS[piano.status as PianoStatus] || piano.status}</span>
                  <span className={`status-badge ${OWNERSHIP_COLORS[piano.ownership_category as OwnershipCategory] || ''}`}>{OWNERSHIP_LABELS[piano.ownership_category as OwnershipCategory] || piano.ownership_category}</span>
                </div>
                <p className="font-semibold">{piano.brand} {piano.model}</p>
                <p className="text-sm text-muted-foreground">SN: {piano.serial_number || '—'} · {PIANO_TYPE_LABELS[piano.piano_type as PianoType] || piano.piano_type} · {piano.tag}</p>
              </div>
              <div className="flex items-center gap-6 text-sm sm:flex-shrink-0">
                {piano.asking_price && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Asking</p>
                    <p className="font-medium">${piano.asking_price.toLocaleString()}</p>
                  </div>
                )}
                <div className="w-14 text-right">
                  <div className="text-xs text-muted-foreground mb-0.5">{piano.percent_complete || 0}%</div>
                  <div className="w-full h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${piano.percent_complete || 0}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-1">No pianos found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <AddPianoDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
