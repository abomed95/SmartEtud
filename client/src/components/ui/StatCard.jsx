import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Pastilles d'icône aux couleurs système Apple
const tints = {
  blue: 'bg-[#0071E3]', green: 'bg-[#34C759]', red: 'bg-[#FF3B30]', yellow: 'bg-[#FF9500]',
  purple: 'bg-[#AF52DE]', indigo: 'bg-[#5856D6]', teal: 'bg-[#30B0C7]', pink: 'bg-[#FF2D55]',
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', trend, trendLabel, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="stat-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${tints[color] || tints.blue}`}>
          <Icon size={15} strokeWidth={2.25} />
        </span>
        <p className="text-[13px] font-medium text-slate-500 truncate">{title}</p>
      </div>
      <p className="text-[26px] font-bold text-slate-900 tabular leading-none">{value}</p>
      {(trendLabel || sub) && (
        <div className="flex items-center gap-1 mt-2 text-[12px]">
          {trendLabel && (trend >= 0 ? <TrendingUp size={13} className="text-success" /> : <TrendingDown size={13} className="text-danger" />)}
          <span className={trendLabel ? (trend >= 0 ? 'text-success' : 'text-danger') : 'text-slate-400'}>{trendLabel || sub}</span>
        </div>
      )}
    </motion.div>
  );
}
