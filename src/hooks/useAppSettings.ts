import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const DEFAULT_HOURLY_RATE = 100;

export function useHourlyRate() {
  return useQuery({
    queryKey: ['app_settings', 'technician_hourly_rate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .select('value')
        .eq('key', 'technician_hourly_rate')
        .maybeSingle();
      if (error) throw error;
      const raw = (data as any)?.value;
      const num = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(num) && num > 0 ? num : DEFAULT_HOURLY_RATE;
    },
    staleTime: 60_000,
  });
}

export function useUpdateHourlyRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rate: number) => {
      const { error } = await supabase
        .from('app_settings' as any)
        .upsert(
          { key: 'technician_hourly_rate', value: rate as any, updated_at: new Date().toISOString() },
          { onConflict: 'key' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_settings'] });
      toast({ title: 'Hourly rate updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Could not save hourly rate.', variant: 'destructive' });
    },
  });
}
