
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Music, Phone, Mail, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import RestorationRecord from '@/components/public/RestorationRecord';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: 'AVAILABLE', color: 'bg-[#4ade80]/15 text-[#4ade80]' },
  coming_soon: { label: 'COMING SOON', color: 'bg-primary/15 text-primary' },
  in_progress: { label: 'BEING RESTORED', color: 'bg-teal/15 text-teal' },
  reserved: { label: 'RESERVED', color: 'bg-[#a78bfa]/15 text-[#a78bfa]' },
  sold: { label: 'SOLD', color: 'bg-muted text-muted-foreground' },
};

export default function CatalogueDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['catalogue-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: cat, error } = await supabase
        .from('catalogue')
        .select('*')
        .eq('piano_id', id!)
        .eq('visible', true)
        .maybeSingle();
      if (error) throw error;
      if (!cat) return null;

      const [pianoRes, photosRes, charRes, tasksRes, expensesRes, rateRes] = await Promise.all([
        supabase.from('pianos').select('*').eq('id', id!).single(),
        supabase.from('piano_photos').select('*').eq('piano_id', id!).order('sort_order'),
        supabase.from('character_notes').select('*').eq('piano_id', id!).maybeSingle(),
        supabase.from('restoration_tasks').select('id, title, category, status, labor_hours').eq('piano_id', id!),
        supabase.from('expenses').select('parts_cost, moving_cost, marketing_cost').eq('piano_id', id!).maybeSingle(),
        supabase.from('app_settings').select('value').eq('key', 'technician_hourly_rate').maybeSingle(),
      ]);

      const rateRaw = rateRes.data?.value;
      const hourlyRate = typeof rateRaw === 'number' ? rateRaw : Number(rateRaw) || 100;

      return {
        ...cat,
        piano: pianoRes.data,
        photos: photosRes.data || [],
        character: charRes.data,
        tasks: tasksRes.data || [],
        expenses: expensesRes.data,
        hourlyRate,
      };
    },
  });

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  if (!listing) return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-heading text-lg font-bold text-primary">Nick's Piano Services</span>
          </div>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground font-mono">Sign In</Link>
        </div>
      </header>
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Piano not found or not listed.</p>
        <Link to="/catalogue" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to Catalogue</Link>
      </div>
    </div>
  );

  const p = listing.piano;
  const photos = listing.photos;
  const character = listing.character;
  const b = STATUS_BADGE[listing.status] || STATUS_BADGE.coming_soon;
  const currentPhoto = photos[selectedPhoto]?.url;

  const subject = encodeURIComponent(`Inquiry — ${p?.brand} ${p?.model || ''} (${p?.inventory_id})`);
  const body = encodeURIComponent(`I'm interested in the ${p?.brand} ${p?.model || ''} (${p?.inventory_id}) listed on your catalogue. Please contact me with more information.\n\nName: \nPhone: \nMessage: `);
  const mailtoHref = `mailto:NickPianoServices@gmail.com?subject=${subject}&body=${body}`;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Catalogue link copied to clipboard.' });
    } catch {
      toast({ title: 'Share', description: url });
    }
  };

  const tagSections = [
    { title: 'Tone', items: character?.tonal_character || [], colorClass: 'bg-primary/10 text-primary' },
    { title: 'Feel', items: character?.action_feel || [], colorClass: 'bg-teal/10 text-teal' },
    { title: 'Best For', items: character?.musical_suitability || [], colorClass: 'bg-success/10 text-success' },
    { title: 'Cabinet', items: character?.cabinet_character || [], colorClass: 'bg-[#a78bfa]/10 text-[#a78bfa]' },
  ].filter(s => s.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-heading text-lg font-bold text-primary">Nick's Piano Services</span>
          </div>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground font-mono">Sign In</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/catalogue" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Catalogue
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Photo gallery */}
          {photos.length > 0 && (
            <div className="mb-6">
              <div className="rounded-xl overflow-hidden bg-muted mb-2 aspect-video flex items-center justify-center">
                {currentPhoto ? (
                  <img src={currentPhoto} alt={p?.brand} className="w-full h-full object-contain bg-black" />
                ) : (
                  <Music className="h-16 w-16 text-muted-foreground/20" />
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((ph: any, idx: number) => (
                    <button key={ph.id} onClick={() => setSelectedPhoto(idx)}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 ${idx === selectedPhoto ? 'border-primary' : 'border-transparent'}`}
                    >
                      <img src={ph.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title + status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold">{p?.brand} {p?.model || ''}</h1>
              <p className="font-mono text-sm text-muted-foreground">
                {p?.year_built ? `c. ${p.year_built}` : ''}{p?.piano_type ? ` · ${p.piano_type.charAt(0).toUpperCase() + p.piano_type.slice(1)}` : ''}
                {p?.country_of_origin ? ` · ${p.country_of_origin}` : ''}
              </p>
            </div>
            <span className={`status-badge flex-shrink-0 ${b.color}`}>{b.label}</span>
          </div>

          {/* Description */}
          {listing.public_description && (
            <p className="text-sm text-muted-foreground leading-relaxed my-4 whitespace-pre-wrap">{listing.public_description}</p>
          )}

          {/* Highlights */}
          {listing.highlights && listing.highlights.length > 0 && (
            <div className="my-4 space-y-1">
              {listing.highlights.map((h: string, i: number) => (
                <p key={i} className="text-sm text-muted-foreground">✦ {h}</p>
              ))}
            </div>
          )}

          {/* Character tags */}
          {tagSections.length > 0 && (
            <div className="my-6 p-4 bg-card rounded-xl border">
              <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Character</h3>
              {tagSections.map(s => (
                <div key={s.title} className="mb-3">
                  <p className="text-xs font-mono text-muted-foreground mb-1.5">{s.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.items.map((t: string) => (
                      <span key={t} className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${s.colorClass}`}>{t.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing */}
          {listing.price_display && (
            <div className="my-6 p-4 bg-card rounded-xl border">
              <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">Pricing</h3>
              <p className="text-lg font-medium text-primary whitespace-pre-wrap">{listing.price_display}</p>
            </div>
          )}

          {/* Restoration notes */}
          {listing.show_restoration_notes && listing.public_restoration_note && (
            <div className="my-6 p-4 bg-card rounded-xl border">
              <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">Restoration Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.public_restoration_note}</p>
            </div>
          )}

          {/* Restoration Record (public-facing) */}
          <RestorationRecord
            tasks={listing.tasks || []}
            expenses={listing.expenses}
            hourlyRate={listing.hourlyRate || 100}
            showLaborHours={!!(listing as any).show_labor_hours}
            showTaskList={!!(listing as any).show_task_list}
            showCostBreakdown={!!(listing as any).show_cost_breakdown}
            isSold={listing.status === 'sold'}
          />

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <a href="tel:+14075551234" className="w-full">
              <Button variant="outline" className="w-full h-11 font-mono text-sm">
                <Phone className="h-4 w-4 mr-2" /> Call Nick
              </Button>
            </a>
            <a href={mailtoHref} className="block">
              <Button className="w-full h-11 font-mono text-sm bg-primary text-primary-foreground">
                <Mail className="h-4 w-4 mr-2" /> Send Inquiry
              </Button>
            </a>
            <Button variant="ghost" className="w-full h-11 font-mono text-sm text-muted-foreground" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" /> Share This Piano
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
