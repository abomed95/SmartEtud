import { LogoMark } from '../brand/Logo';

/** Indicateur d'activité iOS (12 branches). */
export function Spinner({ size = 20, className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} style={{ animationDuration: '0.9s', animationTimingFunction: 'steps(12)' }}
      width={size} height={size} viewBox="0 0 24 24" aria-label="Chargement" role="status">
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x="11" y="2" width="2" height="6" rx="1" fill="currentColor"
          opacity={0.15 + (i / 12) * 0.85} transform={`rotate(${i * 30} 12 12)`} />
      ))}
    </svg>
  );
}

export default function PageLoader() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-5 bg-slate-50">
      <LogoMark size={64} className="rounded-[22%] shadow-lg animate-fade-in" />
      <Spinner size={22} className="text-slate-400" />
    </div>
  );
}
