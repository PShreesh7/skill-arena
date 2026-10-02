import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { motion } from 'framer-motion';
import { Swords, Zap, Trophy, ArrowRight, Loader2, Mail, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import arenaStage from '@/assets/arena-stage.jpg';
const Landing = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'resend'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {
    login,
    signup
  } = useUser();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (mode === 'forgot') {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      setSubmitting(false);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Reset link sent',
          description: 'Check your email for a password reset link.'
        });
        setMode('login');
      }
      return;
    }
    if (mode === 'resend') {
      const {
        error
      } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      setSubmitting(false);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Verification email sent',
          description: 'Check your inbox for the confirmation link.'
        });
        setMode('login');
      }
      return;
    }
    let error: string | null;
    if (mode === 'login') {
      error = await login(email, password);
    } else {
      error = await signup(username, email, password);
    }
    setSubmitting(false);
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive'
      });
    } else if (mode === 'signup') {
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link. Please verify your email to continue.'
      });
    }
  };
  const titles: Record<string, {
    heading: string;
    sub: string;
  }> = {
    login: {
      heading: 'Welcome Back',
      sub: 'Enter the battlefield'
    },
    signup: {
      heading: 'Join the Arena',
      sub: 'Create your warrior profile'
    },
    forgot: {
      heading: 'Reset Password',
      sub: 'We\'ll send you a reset link'
    },
    resend: {
      heading: 'Resend Verification',
      sub: 'Get a new confirmation email'
    }
  };
  const buttonLabels: Record<string, string> = {
    login: 'Enter Arena',
    signup: 'Create Account',
    forgot: 'Send Reset Link',
    resend: 'Resend Email'
  };
  return <div className="auth-screen relative min-h-screen overflow-hidden bg-background">
    <img src={arenaStage} width={1536} height={1024} alt="A glowing trophy in the Skill Arena" className="absolute inset-0 h-full w-full object-cover object-center opacity-60" />
    <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/65 to-background" />
    <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-7 sm:px-8 lg:px-12">
      <div className="flex items-center gap-3 text-primary"><span className="flex size-9 items-center justify-center border border-primary/60 bg-background/80 shadow-[0_0_22px_hsl(var(--primary)/0.3)]"><Swords className="size-5" /></span><span className="font-display text-sm font-bold uppercase text-foreground">Skill Arena</span><span className="ml-auto hidden font-mono text-xs uppercase text-accent sm:block">System Online / Season 04</span></div>
      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:gap-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
          <p className="mb-4 font-mono text-xs font-bold uppercase text-accent">// Your arena awaits</p>
          <h1 className="arena-title font-display text-5xl font-black uppercase leading-[0.95] text-primary sm:text-7xl lg:text-8xl">SKILL<br /><span className="text-accent">ARENA</span></h1>
          <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-foreground">Your code is your weapon. Your rank is earned.</p>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">AI-powered challenges, ELO-ranked battles, and a path to mastery.</p>
          <div className="mt-8 flex flex-wrap gap-2 font-mono text-[10px] uppercase sm:text-xs"><span className="border border-primary/50 bg-background/70 px-3 py-2 text-primary"><Zap className="mr-1 inline size-3" /> Adaptive assessment</span><span className="border border-accent/50 bg-background/70 px-3 py-2 text-accent"><Swords className="mr-1 inline size-3" /> Ranked battles</span><span className="border border-secondary/50 bg-background/70 px-3 py-2 text-secondary"><Trophy className="mr-1 inline size-3" /> Earn your ELO</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="arena-auth-shell w-full border border-accent/60 bg-background/90 p-6 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center gap-2 border-b border-border pb-4 font-mono text-[10px] uppercase text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" /> Access terminal <span className="ml-auto text-muted-foreground">01 / Identity</span></div>
          <h2 className="font-display text-2xl font-bold text-foreground">{titles[mode].heading}</h2>
          <p className="mb-7 mt-1 text-sm text-muted-foreground">{titles[mode].sub}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <div><label htmlFor="arena-username" className="mb-1.5 block text-xs font-bold uppercase text-foreground">Username</label><input id="arena-username" type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground" placeholder="cyberwarrior" required /></div>}
            <div><label htmlFor="arena-email" className="mb-1.5 block text-xs font-bold uppercase text-foreground">Email</label><input id="arena-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground" placeholder="you@example.com" required /></div>
            {(mode === 'login' || mode === 'signup') && <div><label htmlFor="arena-password" className="mb-1.5 block text-xs font-bold uppercase text-foreground">Password</label><input id="arena-password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground" placeholder="••••••••" required minLength={6} /></div>}
            <Button type="submit" disabled={submitting} className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">{submitting ? <Loader2 className="size-4 animate-spin" /> : <>{buttonLabels[mode]}<ArrowRight className="size-4" /></>}</Button>
          </form>
          {mode === 'login' && <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><Button variant="link" size="sm" onClick={() => setMode('forgot')} className="h-auto p-0 text-muted-foreground hover:text-primary"><KeyRound className="size-3.5" />Forgot password?</Button><Button variant="link" size="sm" onClick={() => setMode('resend')} className="h-auto p-0 text-muted-foreground hover:text-primary"><Mail className="size-3.5" />Resend verification</Button></div>}
          {(mode === 'forgot' || mode === 'resend') && <Button variant="link" onClick={() => setMode('login')} className="mt-4 h-auto p-0 text-primary">← Back to login</Button>}
          <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">{mode === 'signup' ? 'Already have an account?' : 'New recruit?'}{' '}<Button variant="link" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="h-auto p-0 text-primary">{mode === 'signup' ? 'Log in' : 'Create profile'}</Button></p>
        </motion.div>
      </div>
      <p className="font-mono text-[10px] uppercase text-muted-foreground">Build your skills. Claim your rank.</p>
    </div>
  </div>;
};
export default Landing;