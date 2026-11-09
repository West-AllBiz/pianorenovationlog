import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
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
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        const { error: signUpError } = await signUp(email, password, name.trim());
        if (signUpError) throw signUpError;
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle top bar */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/catalogue" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-mono">
            <ArrowLeft className="h-4 w-4" />
            Back to Catalogue
          </Link>
          <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
            Staff Portal
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xs"
        >
          <div className="flex justify-center mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <h1 className="font-heading text-lg font-semibold text-center mb-1">Workshop Sign In</h1>
          <p className="text-xs text-muted-foreground text-center font-mono mb-8">
            Authorized personnel only
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
                required
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full h-10 font-mono text-sm"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-center text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
            Nick's Piano Services · Internal
          </p>
        </motion.div>
      </div>
    </div>
  );
}
