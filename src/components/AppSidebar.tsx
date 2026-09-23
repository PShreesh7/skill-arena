import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import {
  LayoutDashboard, BookOpen, Swords, TrendingUp,
  History, Bot, Coins, LogOut, Trophy, ChevronRight, Cpu, Shield
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/learning', label: 'Learning', icon: BookOpen },
  { path: '/battle', label: 'Battle', icon: Swords },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/history', label: 'History', icon: History },
  { path: '/ai-coach', label: 'AI Coach', icon: Bot },
  { path: '/token-shop', label: 'Token Shop', icon: Coins },
];

const AppSidebar = () => {
  const location = useLocation();
  const { user, logout } = useUser();

  return (
    <Sidebar className="border-r border-primary/20 bg-sidebar">
      <SidebarHeader className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center border border-primary/50 bg-primary/10 shadow-[inset_0_0_15px_hsl(var(--primary)/0.1)]">
            <Shield className="h-6 w-6 text-primary" />
            <Swords className="absolute h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">SKILL ARENA</h1>
            <p className="text-[9px] text-primary uppercase tracking-widest">AI Skill Evolution</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {user && (
          <div className="px-3 mb-6">
            <div className="cyber-panel p-4 group">
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex h-10 w-10 items-center justify-center border border-primary/30 bg-primary/10 group-hover:border-primary/60 transition-colors">
                  <span className="text-primary font-bold text-sm font-display">{user.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{user.username}</p>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-secondary animate-pulse" />
                    <span className="text-[11px] text-secondary font-mono font-bold tracking-tighter">{user.elo} ELO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60"><Cpu className="mr-2 size-3" /> Arena Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "h-11 px-4 rounded-sm border border-transparent font-mono text-xs uppercase tracking-wider transition-all duration-300",
                        active 
                          ? "bg-primary/10 text-primary border-primary/40 font-bold shadow-[inset_0_0_14px_hsl(var(--primary)/0.1),0_0_16px_hsl(var(--primary)/0.08)]" 
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5 hover:translate-x-1"
                      )}
                    >
                      <Link to={item.path} className="flex items-center w-full">
                        <item.icon className={cn("w-5 h-5 mr-3 transition-transform duration-300", active && "scale-110")} />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border bg-background/50">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-sm border border-transparent px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>[ Terminate Session ]</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
