import { useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import ArenaVisual, { type ArenaVariant } from './ArenaVisual';

const scenes: Record<string, { variant: ArenaVariant; title: string; tag: string }> = {
  '/learning': { variant: 'learning', title: 'Training grid', tag: 'Skill evolution' },
  '/battle': { variant: 'battle', title: 'Battle arena', tag: 'Ranked combat' },
  '/progress': { variant: 'progress', title: 'Your evolution', tag: 'Performance archive' },
  '/history': { variant: 'history', title: 'Match archive', tag: 'Combat records' },
  '/ai-coach': { variant: 'coach', title: 'Neural link', tag: 'AI Coach' },
  '/token-shop': { variant: 'shop', title: 'Reward vault', tag: 'CC Token exchange' },
};

export default function ArenaPageBanner() {
  const { pathname } = useLocation();
  const { user } = useUser();
  const scene = scenes[pathname];
  if (!scene) return null;
  return <section className="arena-page-banner relative isolate mb-6 overflow-hidden border-b border-primary/30">
    <ArenaVisual variant={scene.variant} className="absolute inset-0 -z-20" />
    <div className="arena-band-scrim absolute inset-0 -z-10" />
    <div className="relative flex min-h-44 flex-col justify-center px-5 py-7 sm:px-8">
      <p className="mb-2 font-mono text-[10px] uppercase text-accent">{scene.tag}</p>
      <h2 className="max-w-[55%] font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">{scene.title}</h2>
      {user && <p className="mt-3 font-mono text-[10px] text-primary">LEVEL {user.level} <span className="px-2 text-muted-foreground">/</span> ELO {user.elo.toLocaleString()}</p>}
    </div>
  </section>;
}