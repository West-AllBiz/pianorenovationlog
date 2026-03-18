import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-sidebar-primary">
            <Music className="h-8 w-8 text-sidebar-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-sidebar-accent-foreground mb-4">
            Piano Renovation Log
          </h1>
          <p className="text-sidebar-foreground/70 text-lg leading-relaxed">
            Manage your entire piano workshop — from acquisition through restoration to sale — in one elegant workspace.
          </p>
        </motion.div>
      </div>

      {/* Right - Login form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Keystone</h1>
          </div>

          <h2 className="font-heading text-2xl font-semibold mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your workshop</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="james@keystonepianos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 font-medium">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button className="text-primary font-medium hover:underline">Request access</button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
