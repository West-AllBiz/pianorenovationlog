
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: 'AVAILABLE', color: 'bg-[#4ade80]/15 text-[#4ade80]' },
  coming_soon: { label: 'COMING SOON', color: 'bg-primary/15 text-primary' },
  in_progress: { label: 'BEING RESTORED', color: 'bg-teal/15 text-teal' },
  reserved: { label: 'RESERVED', color: 'bg-[#a78bfa]/15 text-[#a78bfa]' },
  sold: { label: 'SOLD', color: 'bg-muted text-muted-foreground' },
};

type FilterKey = 'all' | 'available' | 'coming_soon' | 'custom' | 'antique';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available Now' },
  { key: 'coming_soon', label: 'Coming Soon' },
  { key: 'custom', label: 'Custom Finish' },
  { key: 'antique', label: 'Antique' },
];

export default function Catalogue() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['public-catalogue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogue')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const pianoIds = data.map((c: any) => c.piano_id);
      if (pianoIds.length === 0) return [];

      const [pianos, photos, charNotes, tasks] = await Promise.all([
        supabase.from('pianos').select('id, brand, model, piano_type, year_built, country_of_origin, finish_plan, selling_channel, inventory_id, ownership_category, sale_type').in('id', pianoIds),
        supabase.from('piano_photos').select('piano_id, url, is_primary, sort_order, category').in('piano_id', pianoIds),
        supabase.from('character_notes').select('piano_id, tonal_character, action_feel, musical_suitability, cabinet_character').in('piano_id', pianoIds),
        supabase.from('restoration_tasks').select('piano_id, status, labor_hours').in('piano_id', pianoIds),
      ]);

      return data.map((c: any) => {
        const pianoTasks = (tasks.data || []).filter((t: any) => t.piano_id === c.piano_id);
        const totalHours = pianoTasks
          .filter((t: any) => t.status === 'done' || t.status === 'in_progress')
          .reduce((s: number, t: any) => s + (Number(t.labor_hours) || 0), 0);
        return {
          ...c,
          piano: pianos.data?.find((p: any) => p.id === c.piano_id),
          photos: (photos.data || []).filter((p: any) => p.piano_id === c.piano_id),
          character: charNotes.data?.find((n: any) => n.piano_id === c.piano_id),
          totalHours,
        };
      });
    },
  });

  const filtered = listings.filter((l: any) => {
    // Single source of truth: sale_type. Hide anything not publicly listable
    // (defense in depth; RLS also enforces). ownership_category is informational only.
    const p = l.piano;
    const saleType = p?.sale_type || 'internal_inventory';
    if (saleType !== 'internal_inventory' && saleType !== 'consignment') return false;

    if (filter === 'all') return true;
    if (filter === 'available') return l.status === 'available';
    if (filter === 'coming_soon') return l.status === 'coming_soon' || l.status === 'in_progress';
    if (filter === 'custom') {
      const fp = (p?.finish_plan || '').toLowerCase();
      return fp.includes('custom') || fp.includes('gloss');
    }
    if (filter === 'antique') {
      const y = parseInt(p?.year_built || '9999');
      return y < 1960;
    }
    return true;
  });

  const getPrimaryPhoto = (listing: any) => {
    const primary = listing.photos?.find((p: any) => p.is_primary);
    if (primary) return primary.url;
    const finished = listing.photos?.filter((p: any) => p.category === 'finished').sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    if (finished?.length) return finished[0].url;
    const sorted = [...(listing.photos || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted[0]?.url || null;
  };

  const badge = (status: string) => STATUS_BADGE[status] || STATUS_BADGE.coming_soon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-heading text-lg font-bold text-primary">Nick's Piano Services</span>
          </div>
          <Link
            to="/login"
            aria-label="Staff sign in"
            title="Staff sign in"
            className="text-muted-foreground/40 hover:text-muted-foreground text-[10px] font-mono uppercase tracking-wider"
          >
            Staff
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-2">Nick's Piano Services</h1>
        <p className="font-mono text-sm text-muted-foreground mb-1">Saint Cloud, Florida</p>
        <p className="font-mono text-sm text-muted-foreground mb-6">Central Florida's Restoration Specialist</p>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${filter === f.key
                ? 'bg-teal text-teal-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground font-mono text-sm">Loading catalogue...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-mono text-sm">No pianos in catalogue yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((listing: any, i: number) => {
              const p = listing.piano;
              const photo = getPrimaryPhoto(listing);
              const b = badge(listing.status);
              const tags = [
                ...(listing.character?.tonal_character || []),
                ...(listing.character?.action_feel || []),
              ].slice(0, 4);
              const suitability = (listing.character?.musical_suitability || []).slice(0, 3);

              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/catalogue/${listing.piano_id}`} className="block bg-card rounded-xl border overflow-hidden hover:border-primary/30 transition-colors">
                    {/* Photo */}
                    <div className="h-44 bg-muted flex items-center justify-center overflow-hidden">
                      {photo ? (
                        <img src={photo} alt={p?.brand} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Music className="h-10 w-10 text-muted-foreground/30 mx-auto mb-1" />
                          <span className="text-xs text-muted-foreground/40 font-mono">No photo yet</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-heading font-bold text-lg">{p?.brand} {p?.model || ''}</h3>
                        <span className={`status-badge text-[10px] flex-shrink-0 ${b.color}`}>{b.label}</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mb-2">
                        {p?.year_built ? `c. ${p.year_built}` : ''}{p?.year_built && p?.piano_type ? ' · ' : ''}{p?.piano_type ? p.piano_type.charAt(0).toUpperCase() + p.piano_type.slice(1) : ''}
                        {p?.country_of_origin ? ` · ${p.country_of_origin}` : ''}
                      </p>
                      {p?.sale_type === 'consignment' && (
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-3">
                          Available on Consignment
                        </p>
                      )}

                      {/* Highlights */}
                      {listing.highlights && listing.highlights.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {listing.highlights.slice(0, 2).map((h: string, idx: number) => (
                            <p key={idx} className="text-xs text-muted-foreground">✦ {h}</p>
                          ))}
                        </div>
                      )}

                      {/* Tags */}
                      {(tags.length > 0 || suitability.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {tags.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary">{t.replace(/_/g, ' ')}</span>
                          ))}
                          {suitability.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-success/10 text-success">{t.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      )}

                      {/* Labor hours line */}
                      {listing.show_labor_hours && listing.totalHours > 0 && (
                        <p className="text-xs font-mono text-foreground mb-2">
                          <span className="text-primary">✦</span>{' '}
                          {Number.isInteger(listing.totalHours) ? listing.totalHours : listing.totalHours.toFixed(1).replace(/\.0$/, '')} hours of master restoration
                          {listing.status === 'sold' ? ' invested' : ''}
                        </p>
                      )}

                      {/* Price */}
                      {listing.price_display && (
                        <p className="text-sm font-medium text-primary">{listing.price_display}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
