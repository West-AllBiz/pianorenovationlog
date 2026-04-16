import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Shield, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const roleBadge: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  contributor: 'bg-info/10 text-info',
  viewer: 'bg-muted text-muted-foreground',
};

export default function Team() {
  const { user, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState<string | null>(null);

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('created_at', { ascending: true });

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (!profiles) return [];

      return profiles.map(p => {
        const roleRow = roles?.find(r => r.user_id === p.id);
        return {
          id: p.id,
          name: p.full_name || 'Unknown',
          email: p.email || '',
          role: roleRow?.role || 'viewer',
        };
      });
    },
  });

  const getCredentials = (name: string) => {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '.');
    return { email: `${slug}@piano.local`, password: `piano-${slug}-2026!` };
  };

  const handleSwitch = async (memberName: string) => {
    setSwitching(memberName);
    try {
      await signOut();
      const { email, password } = getCredentials(memberName);
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        const { error: signUpError } = await signUp(email, password, memberName.trim());
        if (signUpError) throw signUpError;
        const { error: retryError } = await signIn(email, password);
        if (retryError) throw retryError;
      }
      toast({ title: `Switched to ${memberName}` });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error switching', description: err.message, variant: 'destructive' });
    } finally {
      setSwitching(null);
    }
  };

  const currentEmail = user?.email;

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">Team</h1>
            <p className="text-muted-foreground text-sm">{teamMembers.length} members</p>
          </div>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" /> Invite
          </Button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {teamMembers.map((member, i) => {
          const isCurrentUser = currentEmail === member.email;

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-4 bg-card rounded-lg border ${isCurrentUser ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {member.name}
                  {isCurrentUser && <span className="text-xs text-primary ml-2">(you)</span>}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {member.email}
                </p>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <div>
                  <span className={`status-badge ${roleBadge[member.role]} capitalize`}>
                    <Shield className="h-3 w-3 mr-1" /> {member.role}
                  </span>
                </div>
                {!isCurrentUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitch(member.name)}
                    disabled={!!switching}
                    className="ml-2"
                  >
                    {switching === member.name ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogIn className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1 hidden sm:inline">Switch</span>
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
