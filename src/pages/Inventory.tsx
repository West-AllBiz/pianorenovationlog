import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Plus, ChevronDown, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { samplePianos, sampleExpenses } from '@/data/sampleData';
import { STATUS_LABELS, STATUS_COLORS, PIANO_TYPE_LABELS, PianoStatus } from '@/types/piano';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PianoStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return samplePianos.filter((p) => {
      const matchesSearch =
        !search ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.model.toLowerCase().includes(search.toLowerCase()) ||
        p.serialNumber.includes(search) ||
        p.inventoryId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const getExpenseTotal = (pianoId: string) =>
    sampleExpenses.filter(e => e.pianoId === pianoId).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">{samplePianos.length} pianos in catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Piano
          </Button>
        </div>
      </motion.div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand, model, serial, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" /> Filters
          {statusFilter !== 'all' && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
          )}
        </Button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-4 p-4 bg-card rounded-lg border overflow-hidden"
        >
          <label className="text-sm font-medium mb-2 block">Status</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`status-badge transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >
              All
            </button>
            {(Object.entries(STATUS_LABELS) as [PianoStatus, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`status-badge transition-colors ${statusFilter === value ? 'bg-primary text-primary-foreground' : `${STATUS_COLORS[value]} hover:opacity-80`}`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Table / Cards */}
      <div className="space-y-2">
        {filtered.map((piano, i) => {
          const totalExpenses = getExpenseTotal(piano.id);
          const estimatedProfit = (piano.soldPrice || piano.askingPrice || 0) - totalExpenses;

          return (
            <motion.div
              key={piano.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={`/piano/${piano.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{piano.inventoryId}</span>
                    <span className={`status-badge ${STATUS_COLORS[piano.status]}`}>
                      {STATUS_LABELS[piano.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">{PIANO_TYPE_LABELS[piano.pianoType]}</span>
                  </div>
                  <p className="font-semibold">{piano.brand} {piano.model}</p>
                  <p className="text-sm text-muted-foreground">
                    {piano.finish} · {piano.yearBuilt ? `c.${piano.yearBuilt}` : 'Year unknown'} · {piano.storageLocation}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-sm sm:flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="font-medium">${totalExpenses.toLocaleString()}</p>
                  </div>
                  {(piano.askingPrice || piano.soldPrice) && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{piano.soldPrice ? 'Sold' : 'Asking'}</p>
                      <p className="font-medium">${(piano.soldPrice || piano.askingPrice || 0).toLocaleString()}</p>
                    </div>
                  )}
                  <div className="w-14 text-right">
                    <div className="text-xs text-muted-foreground mb-0.5">{piano.percentComplete}%</div>
                    <div className="w-full h-1.5 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${piano.percentComplete}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-1">No pianos found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
