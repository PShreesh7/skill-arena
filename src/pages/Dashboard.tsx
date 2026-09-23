import { useUser } from '@/contexts/UserContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatCard from '@/components/StatCard';
import { Trophy, Swords, BookOpen, TrendingUp, Target, Flame, Bot, Coins, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
    color: 'border-purple-500/30 hover:border-purple-500',
    glow: 'shadow-[0_0_20px_-10px_rgba(168,85,247,0.3)]',
    iconColor: 'text-purple-500'
  },
];

const Dashboard = () => {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
              READY FOR <span className="text-primary glow-text">EVOLUTION</span>?
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">
              Welcome back, operator <span className="text-foreground font-bold">{user.username}</span>. System status: <span className="text-accent font-bold">OPTIMAL</span>.
            </p>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button variant="neon" size="lg" asChild className="group">
            <Link to="/battle">
              INITIATE BATTLE <Swords className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modeCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.01, translateY: -4 }}
            >
              <Link to={card.path} className="block group">
                <Card className={`h-full border-2 transition-all duration-500 ${card.color} ${card.glow}`}>
                  <CardHeader>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-colors shadow-2xl">
                        <card.icon className={`w-8 h-8 ${card.iconColor} group-hover:scale-110 transition-transform duration-500`} />
                      </div>
                      <div className="flex-1">
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
