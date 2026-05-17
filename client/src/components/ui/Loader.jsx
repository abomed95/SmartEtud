import { motion } from 'framer-motion';

export function Spinner({ size = 24, className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary-600 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
        <p className="text-sm text-slate-500 font-medium">SmartEdu ERP</p>
      </motion.div>
    </div>
  );
}
