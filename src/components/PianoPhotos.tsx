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


// Optimize phone photos in the browser before sending them over the network.
// Original photos already in storage are never changed.
const MAX_PHOTO_SIDE = 2200;
const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024;

type UploadImage = { blob: Blob; extension: string; contentType: string };

async function preparePhoto(file: File): Promise<UploadImage> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const mime = file.type || ({
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  } as Record<string, string>)[extension] || '';

  if (file.size === 0) throw new Error('This image is empty.');
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mime)) {
    throw new Error('Please select a JPG, PNG, WebP, or HEIC photo.');
  }

  const original = { blob: file as Blob, extension, contentType: mime };
  if (file.size <= 1_200_000 && mime !== 'image/heic' && mime !== 'image/heif') return original;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (mime === 'image/heic' || mime === 'image/heif') {
      throw new Error('This device cannot convert HEIC. Export the photo as JPG and retry.');
    }
    if (file.size > STORAGE_LIMIT_BYTES) {
      throw new Error('Image is over 10 MB and could not be compressed.');
    }
    return original;
  }

  try {
    const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is unavailable in this browser.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const compressed = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/webp', 0.83);
    });
    canvas.width = 0;
    canvas.height = 0;

    if (compressed?.type === 'image/webp' && (compressed.size < file.size || mime === 'image/heic' || mime === 'image/heif')) {
      return { blob: compressed, extension: 'webp', contentType: 'image/webp' };
    }
    if (mime === 'image/heic' || mime === 'image/heif') {
      throw new Error('HEIC conversion is not supported here. Export as JPG and retry.');
    }
    if (file.size > STORAGE_LIMIT_BYTES) {
      throw new Error('Image exceeds 10 MB even after processing.');
    }
    return original;
  } finally {
    bitmap.close();
  }
}

export function usePianoPhotos(pianoId: string | undefined) {
  return useQuery({
    queryKey: ['piano_photos', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('piano_photos')
        .select('*')
        .eq('piano_id', pianoId!)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });
      if (error) throw error;
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
  const { data: photos = [], isLoading, isError } = usePianoPhotos(pianoId);
  const { canEdit, user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const uploadCategoryRef = useRef<PhotoCategory>('acquired');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PhotoCategory>('acquired');

  const categoryPhotos = photos.filter(p => (p.category || 'acquired') === activeTab);
  const primary = categoryPhotos.find(p => p.is_primary) || categoryPhotos[0];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length || !user || uploading) return;

    // Capture the tab selected when Add was pressed, even if it changes mid-upload.
    const category = uploadCategoryRef.current;
    const existingInCategory = photos.filter(p => (p.category || 'acquired') === category).length;
    const needsFirstPrimary = !photos.some(p => p.is_primary);
    let nextIndex = 0;
    let succeeded = 0;
    const failures: { name: string; message: string }[] = [];

    setUploading(true);
    setUploadProgress({ completed: 0, total: selectedFiles.length });

    const worker = async () => {
      while (nextIndex < selectedFiles.length) {
        const index = nextIndex++;
        const file = selectedFiles[index];
        try {
          const prepared = await preparePhoto(file);
          if (prepared.blob.size > STORAGE_LIMIT_BYTES) {
            throw new Error('Image exceeds the 10 MB upload limit.');
          }

          const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString() + Math.random().toString(36).slice(2);
          const storagePath = pianoId + '/' + uniqueId + '.' + prepared.extension;
          const { error: uploadError } = await supabase.storage
            .from('piano-photos')
            .upload(storagePath, prepared.blob, {
              contentType: prepared.contentType,
              cacheControl: '3600',
              upsert: false,
            });
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('piano-photos')
            .getPublicUrl(storagePath);

          const { error: recordError } = await supabase.from('piano_photos').insert({
            piano_id: pianoId,
            storage_path: storagePath,
            url: publicUrl,
            is_primary: needsFirstPrimary && index === 0,
            sort_order: existingInCategory + index,
            uploaded_by: user.id,
            category,
          } as any);

          if (recordError) {
            // Do not leave an orphaned image that isn't visible in the gallery.
            const { error: cleanupError } = await supabase.storage.from('piano-photos').remove([storagePath]);
            if (cleanupError) console.warn('Could not clean up unlinked photo', cleanupError);
            throw recordError;
          }

          succeeded++;
          // Each completed image becomes visible without waiting for the rest.
          void qc.invalidateQueries({ queryKey: ['piano_photos', pianoId] });
        } catch (err) {
          failures.push({
            name: file.name,
            message: err instanceof Error ? err.message : 'Unexpected upload error',
          });
        } finally {
          setUploadProgress(current => current
            ? { ...current, completed: current.completed + 1 }
            : current);
        }
      }
    };

    try {
      // Two at a time improves throughput without exhausting mobile memory.
      await Promise.all(Array.from({ length: Math.min(2, selectedFiles.length) }, () => worker()));
      void qc.invalidateQueries({ queryKey: ['piano_photos', pianoId] });
      setActiveTab(category);
      if (succeeded > 0) {
        toast({
          title: succeeded + ' photo' + (succeeded === 1 ? '' : 's') + ' uploaded',
          description: failures.length
            ? failures.length + ' failed; successful photos are saved. You can reselect just the failed files.'
            : 'Added to ' + CATEGORY_LABELS[category] + '.',
        });
      }
      if (failures.length > 0) {
        toast({
          title: failures.length + ' photo' + (failures.length === 1 ? '' : 's') + ' failed',
          description: failures[0].name + ': ' + failures[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
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
    uploadCategoryRef.current = cat;
    fileRef.current?.click();
  };

  if (isLoading) return null;
  if (isError) return <p className="mb-6 text-sm text-destructive">Photos could not be loaded. Please refresh and try again.</p>;

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
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden" onChange={handleUpload} />
      </div>

      {uploading && uploadProgress && (
        <div className="mb-3" role="status" aria-live="polite">
          <p className="mb-1 text-xs text-muted-foreground">
            Preparing and uploading {uploadProgress.completed} of {uploadProgress.total} photos…
          </p>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: String(Math.round(uploadProgress.completed / uploadProgress.total * 100)) + '%' }}
            />
          </div>
        </div>
      )}

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
