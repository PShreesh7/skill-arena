import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'purple';
  subtitle?: string;
}

const colorMap = {
  primary: 'text-primary bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
  secondary: 'text-secondary bg-secondary/10 border-secondary/30 shadow-[0_0_15px_rgba(251,146,60,0.2)]',
  accent: 'text-accent bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
  purple: 'text-glow-purple bg-glow-purple/10 border-glow-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
};

const StatCard = ({ label, value, icon: Icon, color = 'primary', subtitle }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card-hover p-6 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-500" />
    
    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="stat-value">{value}</p>
        </div>
        {subtitle && (
          <p className="text-[10px] font-mono font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5 inline-block">
            {subtitle}
          </p>
        )}
      </div>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:scale-110",
        colorMap[color]
      )}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </motion.div>
);

export default StatCard;
