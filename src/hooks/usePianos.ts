import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type DbPiano = {
  id: string;
  inventory_id: string;
  tag: string | null;
  color_tag: string | null;
  brand: string;
  model: string | null;
  serial_number: string | null;
  piano_type: string;
  finish: string | null;
  bench_included: boolean | null;
  year_built: string | null;
  year_estimated: boolean | null;
  country_of_origin: string | null;
  ownership_category: string;
  source: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  pickup_date: string | null;
  pickup_location: string | null;
  transport_company: string | null;
  status: string;
  asking_price: number | null;
  sold_price: number | null;
  sold_date: string | null;
  buyer_name: string | null;
  buyer_contact: string | null;
  tags: string[] | null;
  private_notes: string | null;
  percent_complete: number | null;
  friction_score: number | null;
  roi_health: string | null;
  finish_plan: string | null;
  selling_channel: string | null;
  pricing_notes: string | null;
  lane: string | null;
  created_at: string;
  updated_at: string;
};

export function usePianos() {
  return useQuery({
    queryKey: ['pianos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pianos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbPiano[];
    },
  });
}

export function usePiano(id: string | undefined) {
  return useQuery({
    queryKey: ['piano', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pianos')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as DbPiano;
    },
  });
}

export function usePianoRelated(pianoId: string | undefined) {
  const inspection = useQuery({
    queryKey: ['inspection', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('condition_inspections')
        .select('*')
        .eq('piano_id', pianoId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const tasks = useQuery({
    queryKey: ['tasks', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('restoration_tasks')
        .select('*')
        .eq('piano_id', pianoId!)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
  });

  const expenses = useQuery({
    queryKey: ['expenses', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('piano_id', pianoId!)
        .maybeSingle();
      return data;
    },
  });

  const clientRecord = useQuery({
    queryKey: ['client_record', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('client_records')
        .select('*')
        .eq('piano_id', pianoId!)
        .maybeSingle();
      return data;
    },
  });

  const donationRecord = useQuery({
    queryKey: ['donation_record', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('donation_records')
        .select('*')
        .eq('piano_id', pianoId!)
        .maybeSingle();
      return data;
    },
  });

  const characterNotes = useQuery({
    queryKey: ['character_notes', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('character_notes')
        .select('*')
        .eq('piano_id', pianoId!)
        .maybeSingle();
      return data;
    },
  });

  const performanceProfile = useQuery({
    queryKey: ['performance_profile', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('performance_profiles')
        .select('*')
        .eq('piano_id', pianoId!)
        .maybeSingle();
      return data;
    },
  });

  const activityLog = useQuery({
    queryKey: ['activity_log', pianoId],
    enabled: !!pianoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('piano_id', pianoId!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  return { inspection, tasks, expenses, clientRecord, donationRecord, characterNotes, performanceProfile, activityLog };
}

export function useUpdatePiano() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates, fieldName, oldValue, newValue }: {
      id: string;
      updates: Record<string, any>;
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
    }) => {
      const { error } = await supabase.from('pianos').update(updates).eq('id', id);
      if (error) throw error;

      if (fieldName && user) {
        await supabase.from('activity_log').insert({
          piano_id: id,
          user_id: user.id,
          user_name: profile?.full_name || user.email || 'Unknown',
          action_description: `Updated ${fieldName}`,
          changed_field: fieldName,
          old_value: oldValue || null,
          new_value: newValue || null,
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['piano', vars.id] });
      qc.invalidateQueries({ queryKey: ['pianos'] });
      qc.invalidateQueries({ queryKey: ['activity_log', vars.id] });
      toast({ title: 'Saved', description: 'Changes saved successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Save failed — please try again.', variant: 'destructive' });
    },
  });
}

export function useLogActivity() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  return async (pianoId: string, description: string, field?: string, oldVal?: string, newVal?: string) => {
    if (!user) return;
    await supabase.from('activity_log').insert({
      piano_id: pianoId,
      user_id: user.id,
      user_name: profile?.full_name || user.email || 'Unknown',
      action_description: description,
      changed_field: field || null,
      old_value: oldVal || null,
      new_value: newVal || null,
    });
    qc.invalidateQueries({ queryKey: ['activity_log', pianoId] });
  };
}
