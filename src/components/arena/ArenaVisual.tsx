import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import arenaStage from '@/assets/arena-stage.jpg';

export type ArenaVariant = 'entrance' | 'hub' | 'learning' | 'battle' | 'progress' | 'history' | 'coach' | 'shop';
const ArenaScene = lazy(() => import('./ArenaScene'));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Cosmetic only: no scene state can change player data or interrupt a form. */
export default function ArenaVisual({ variant = 'hub', className = '' }: { variant?: ArenaVariant; className?: string }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    setAvailable(Boolean(context));
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  }, []);
  return (
    <div className={`arena-visual ${className}`} aria-hidden="true" data-arena-variant={variant}>
      <img src={arenaStage} alt="" className="arena-visual-fallback" />
      {available && <SceneBoundary><Suspense fallback={null}><ArenaScene variant={variant} /></Suspense></SceneBoundary>}
    </div>
  );
}