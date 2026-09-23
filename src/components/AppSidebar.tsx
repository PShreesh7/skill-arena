import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import {
  LayoutDashboard, BookOpen, Swords, TrendingUp,
  History, Bot, Coins, LogOut, Trophy, ChevronRight
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
    <Sidebar className="border-r border-border/40 glass-card">
      <SidebarHeader className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors duration-300 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]">
            <Swords className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground tracking-widest group-hover:text-primary transition-colors duration-300">CODECLASH</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Skill Evolution Protocol</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {user && (
          <div className="px-3 mb-6">
            <div className="p-4 rounded-xl glass-card gradient-border relative overflow-hidden group">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-colors">
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
          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50">Navigation</SidebarGroupLabel>
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
                        "h-11 px-4 rounded-lg transition-all duration-300",
                        active 
                          ? "bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-[inset_4px_0_10px_-4px_hsl(var(--primary)/0.2)]" 
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

      <SidebarFooter className="p-4 border-t border-border/40 bg-black/20">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Protocol Termination</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
