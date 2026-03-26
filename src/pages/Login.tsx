import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate a deterministic email and password from the name
  const getCredentials = (inputName: string) => {
    const slug = inputName.trim().toLowerCase().replace(/\s+/g, '.');
    return {
      email: `${slug}@piano.local`,
      password: `piano-${slug}-2026!`,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { email, password } = getCredentials(name);

    try {
      // Try signing in first
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // If login fails, create the account automatically
        const { error: signUpError } = await signUp(email, password, name.trim());
        if (signUpError) throw signUpError;

        // Auto-confirmed, so sign in immediately
        const { error: retryError } = await signIn(email, password);
        if (retryError) throw retryError;
      }

      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-sidebar-primary">
            <Music className="h-8 w-8 text-sidebar-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-sidebar-accent-foreground mb-4">Piano Renovation Log</h1>
          <p className="text-sidebar-foreground/70 text-lg leading-relaxed">
            Manage your entire piano workshop — from acquisition through restoration to sale — in one elegant workspace.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Piano Renovation Log</h1>
          </div>

          <h2 className="font-heading text-2xl font-semibold mb-1">Welcome</h2>
          <p className="text-muted-foreground mb-8">Enter your name to get started</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Nick"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-11 font-medium" disabled={loading || !name.trim()}>
              {loading ? 'Entering...' : 'Enter Workshop'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Nick is admin · Others join as contributors
          </p>
        </motion.div>
      </div>
    </div>
  );
}
