import { useUser } from '@/contexts/UserContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';
import { Trophy, Swords, BookOpen, TrendingUp, Target, Flame, Bot, Coins, ArrowRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ArenaVisual from '@/components/arena/ArenaVisual';

const modeCards = [
  {
    title: 'Learning Mode',
    desc: 'AI-guided skill progression with adaptive topics',
    icon: BookOpen,
    path: '/learning',
    color: 'border-primary/30 hover:border-primary',
    glow: 'shadow-[0_0_20px_-10px_hsl(var(--primary)/0.3)]',
    iconColor: 'text-primary'
  },
  {
    title: 'Battle Mode',
    desc: 'Real-time coding battles with matchmaking',
    icon: Swords,
    path: '/battle',
    color: 'border-secondary/30 hover:border-secondary',
    glow: 'shadow-[0_0_20px_-10px_hsl(var(--secondary)/0.3)]',
    iconColor: 'text-secondary'
  },
  {
    title: 'AI Coach',
    desc: 'Get personalized code reviews and tips',
    icon: Bot,
    path: '/ai-coach',
    color: 'border-accent/30 hover:border-accent',
    glow: 'shadow-[0_0_20px_-10px_hsl(var(--accent)/0.3)]',
    iconColor: 'text-accent'
  },
  {
    title: 'Token Shop',
    desc: 'Spend CC Tokens to unlock courses & expert content',
    icon: Coins,
    path: '/token-shop',
    color: 'border-glow-purple/30 hover:border-glow-purple',
    glow: 'shadow-[0_0_20px_-10px_hsl(var(--glow-purple)/0.3)]',
    iconColor: 'text-glow-purple'
  },
];

const Dashboard = () => {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="relative isolate min-h-[350px] overflow-hidden border-b border-primary/50 px-6 py-8 sm:px-10 sm:py-10 md:min-h-[390px]">
        <ArenaVisual variant="hub" className="absolute inset-0 -z-20" />
        <div className="arena-hub-scrim pointer-events-none absolute inset-0 -z-10" />
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="arena-hub-copy flex min-h-[290px] max-w-xl flex-col justify-center">
          <p className="mb-4 font-mono text-xs font-bold uppercase text-accent">● Arena online <span className="mx-2 text-muted-foreground">/</span> Player: {user.username}</p>
          <h1 className="arena-title font-display text-3xl font-black uppercase leading-none text-foreground sm:text-4xl lg:text-5xl">Your next<br /><span className="text-primary">move starts here.</span></h1>
          <p className="mt-4 max-w-md text-sm text-foreground/85 sm:text-base">Train your skills or take on an ELO-matched challenger. The choice is yours.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/battle">Enter Battle <Swords className="ml-1 size-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild className="border-accent/70 bg-background/70 text-accent hover:bg-accent/15"><Link to="/learning">Start Training <BookOpen className="ml-1 size-4" /></Link></Button>
          </div>
        </motion.div>
        <span className="absolute bottom-4 right-5 hidden font-mono text-[10px] uppercase text-accent sm:block">ELO {user.elo.toLocaleString()} / Level {user.level}</span>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <StatCard label="ELO RATING" value={user.elo} icon={Trophy} color="secondary" subtitle={`RANK: LEVEL ${user.level}`} />
        <StatCard label="BATTLES" value={user.totalBattles} icon={Swords} color="primary" />
        <StatCard label="WIN RATE" value={user.totalBattles > 0 ? `${Math.round((user.wins / user.totalBattles) * 100)}%` : '0%'} icon={Target} color="accent" />
        <StatCard label="STREAK" value={user.streak} icon={Flame} color="purple" />
      </div>

      {/* Mode Selection */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/50" />
          <h2 className="text-sm font-bold tracking-[0.3em] text-muted-foreground uppercase">Selection Terminal</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/50" />
        </div>
        
         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {modeCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.01, translateY: -4 }}
            >
              <Link to={card.path} className="block group">
                 <Card className={`h-full border transition-all duration-500 ${card.color} ${card.glow}`}>
                  <CardHeader>
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 shrink-0 rounded-sm bg-background/80 flex items-center justify-center border border-border group-hover:border-primary/40 transition-colors">
                        <card.icon className={`w-8 h-8 ${card.iconColor} group-hover:scale-110 transition-transform duration-500`} />
                      </div>
                       <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">{card.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">{card.desc}</CardDescription>
                      </div>
                      <ArrowRight className="w-6 h-6 text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
          <Link to="/progress" className="glass-card-hover p-8 flex items-center gap-6 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">PERFORMANCE DATA</h3>
              <p className="text-muted-foreground font-medium">Analyze your evolution metrics and mastery</p>
            </div>
          </Link>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
          <Link to="/history" className="glass-card-hover p-8 flex items-center gap-6 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <History className="w-24 h-24" />
            </div>
            <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 group-hover:border-secondary/50 transition-colors">
              <History className="w-7 h-7 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-foreground group-hover:text-secondary transition-colors">ARCHIVE LOGS</h3>
              <p className="text-muted-foreground font-medium">Review past combat records and replays</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
