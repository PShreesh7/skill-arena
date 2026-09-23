import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useUser } from '@/contexts/UserContext';
import { Activity, Coins, Cpu, Gauge } from 'lucide-react';

const telemetry = 'WARP_MATCH #9482 // CYBER_PHANTOM VS VORTEX_DEV [ROUND 02 IN PROGRESS] • ASIA-EAST // 14ms • NET_SYNC: 99.98% • ';

const AppLayout = () => {
  const { user } = useUser();

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <div className="h-7 shrink-0 overflow-hidden border-b border-primary/20 bg-primary/5 text-[10px] font-bold uppercase text-primary">
            <div className="telemetry-scroll flex h-full w-max items-center whitespace-nowrap">
              <span className="px-4">{telemetry}</span><span className="px-4" aria-hidden="true">{telemetry}</span>
            </div>
          </div>
          <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/70 px-4 backdrop-blur-xl lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="border-primary/30 bg-primary/5 text-primary" />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-foreground md:text-base">Season 04 // Protocol Override</p>
                <p className="telemetry-label hidden sm:block">Competitive neural grid online</p>
              </div>
            </div>
            {user && <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:flex">
              <div className="flex items-center gap-2 bg-background px-3 py-2"><Gauge className="size-3.5 text-secondary" /><span className="telemetry-label">ELO</span><b className="text-xs text-secondary">{user.elo.toLocaleString()}</b></div>
              <div className="flex items-center gap-2 bg-background px-3 py-2"><Coins className="size-3.5 text-accent" /><span className="telemetry-label">CC</span><b className="text-xs text-accent">{user.xp.toLocaleString()}</b></div>
              <div className="hidden items-center gap-2 bg-background px-3 py-2 xl:flex"><Activity className="size-3.5 text-primary" /><span className="telemetry-label">NRG</span><b className="text-xs text-primary">88/100</b></div>
              <div className="hidden items-center gap-2 bg-background px-3 py-2 xl:flex"><Cpu className="size-3.5 text-glow-purple" /><b className="text-xs text-glow-purple">8 CORES</b></div>
            </div>}
          </header>
          <main className="scanline mx-auto w-full max-w-[1500px] flex-1 overflow-y-auto p-4 scroll-smooth md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
