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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: 'Account created', description: 'Check your email to confirm your account.' });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      }
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

          <h2 className="font-heading text-2xl font-semibold mb-1">{isSignUp ? 'Create account' : 'Welcome back'}</h2>
          <p className="text-muted-foreground mb-8">{isSignUp ? 'Set up your workshop account' : 'Sign in to your workshop'}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Nick" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nick@nickspiano.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required minLength={6} />
            </div>
            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
              {isSignUp ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
