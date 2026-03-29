import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Star, Loader2, ImageIcon, X } from 'lucide-react';

type PhotoCategory = 'acquired' | 'renovation' | 'finished';

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  acquired: 'When Acquired',
  renovation: 'Renovation',
  finished: 'Finished',
};

type PianoPhoto = {
  id: string;
  piano_id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
  category: PhotoCategory;
};

export function usePianoPhotos(pianoId: string | undefined) {
  return useQuery({
    queryKey: ['piano_photos', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('piano_photos')
        .select('*')
        .eq('piano_id', pianoId!)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });
      return (data ?? []) as PianoPhoto[];
    },
  });
}

export function PianoPhotosBanner({ pianoId }: { pianoId: string }) {
  const { data: photos } = usePianoPhotos(pianoId);
  const primary = photos?.find(p => p.is_primary) || photos?.[0];

  if (!primary) {
    return (
      <div className="h-[140px] bg-secondary flex items-center justify-center border-b border-border">
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
          <span className="font-mono text-[11px]">No photos yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[140px] overflow-hidden">
      <img src={primary.url} alt="Piano" className="w-full h-full object-cover" />
    </div>
  );
}

export function PianoPhotosSection({ pianoId }: { pianoId: string }) {
  const { data: photos = [], isLoading } = usePianoPhotos(pianoId);
  const { canEdit, user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PhotoCategory>('acquired');
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('acquired');

  const categoryPhotos = photos.filter(p => (p.category || 'acquired') === activeTab);
  const primary = categoryPhotos.find(p => p.is_primary) || categoryPhotos[0];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const fileName = `${pianoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('piano-photos')
          .upload(fileName, file, { upsert: false });
        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage
          .from('piano-photos')
          .getPublicUrl(fileName);

        const isPrimary = categoryPhotos.length === 0;
        await supabase.from('piano_photos').insert({
          piano_id: pianoId,
          storage_path: fileName,
          url: publicUrl,
          is_primary: isPrimary,
          sort_order: categoryPhotos.length,
          uploaded_by: user.id,
          category: uploadCategory,
        } as any);
      }
      qc.invalidateQueries({ queryKey: ['piano_photos', pianoId] });
      toast({ title: 'Photos uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    await supabase.from('piano_photos').update({ is_primary: false }).eq('piano_id', pianoId);
    await supabase.from('piano_photos').update({ is_primary: true }).eq('id', photoId);
    qc.invalidateQueries({ queryKey: ['piano_photos', pianoId] });
    toast({ title: 'Primary photo updated' });
  };

  const handleDelete = async (photo: PianoPhoto) => {
    await supabase.storage.from('piano-photos').remove([photo.storage_path]);
    await supabase.from('piano_photos').delete().eq('id', photo.id);
    qc.invalidateQueries({ queryKey: ['piano_photos', pianoId] });
    toast({ title: 'Photo deleted' });
  };

  const startUpload = (cat: PhotoCategory) => {
    setUploadCategory(cat);
    fileRef.current?.click();
  };

  if (isLoading) return null;

  const categories: PhotoCategory[] = ['acquired', 'renovation', 'finished'];

  return (
    <div className="mb-6 min-w-0">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Photos</h3>
        {canEdit && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startUpload(activeTab)} disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            Add
          </Button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden" onChange={handleUpload} />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3">
        {categories.map(cat => {
          const count = photos.filter(p => (p.category || 'acquired') === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                activeTab === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {categoryPhotos.length === 0 ? (
        <div className="flex items-center justify-center h-32 bg-secondary/50 rounded-lg border border-dashed border-border">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-1" />
            <p className="text-xs">No {CATEGORY_LABELS[activeTab].toLowerCase()} photos yet</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main photo */}
          {primary && (
            <div className="cursor-pointer rounded-lg overflow-hidden mb-2" onClick={() => setLightbox(primary.url)}>
              <img src={primary.url} alt="Primary" className="w-full max-h-[300px] object-cover" />
            </div>
          )}
          {/* Thumbnail strip with delete */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoryPhotos.map(photo => (
              <div key={photo.id} className="relative flex-shrink-0 group">
                <img
                  src={photo.url}
                  alt={photo.caption || 'Piano photo'}
                  className={`w-16 h-16 rounded-md object-cover cursor-pointer border-2 ${photo.is_primary ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                  onClick={() => setLightbox(photo.url)}
                />
                {canEdit && (
                  <div className="absolute -top-1.5 -right-1.5 flex gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo.id); }}
                      className="bg-background/90 rounded-full p-0.5 shadow border border-border hover:border-primary"
                      title="Set as primary"
                    >
                      <Star className={`h-3 w-3 ${photo.is_primary ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                      className="bg-destructive/90 rounded-full p-0.5 shadow hover:bg-destructive"
                      title="Delete photo"
                    >
                      <Trash2 className="h-3 w-3 text-destructive-foreground" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 text-foreground hover:bg-accent rounded-lg" onClick={() => setLightbox(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={lightbox} alt="Full view" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export function PianoPhotoThumbnail({ pianoId, className = '' }: { pianoId: string; className?: string }) {
  const { data: photos } = usePianoPhotos(pianoId);
  const primary = photos?.find(p => p.is_primary) || photos?.[0];

  if (!primary) {
    return (
      <div className={`bg-secondary flex items-center justify-center rounded-md ${className}`}>
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return <img src={primary.url} alt="Piano" className={`object-cover rounded-md ${className}`} />;
}
