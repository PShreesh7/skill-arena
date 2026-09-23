import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const AppLayout = () => (
  <SidebarProvider defaultOpen>
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 border-b border-border/40 flex items-center px-4 md:hidden shrink-0 glass-card">
          <SidebarTrigger />
          <span className="ml-4 font-display font-bold text-primary tracking-wider">CODECLASH</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-7xl mx-auto scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default AppLayout;
