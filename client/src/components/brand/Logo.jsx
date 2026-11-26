import { useId } from 'react';
import { BRAND } from '../../config/brand';

/** Pictogramme : lagon bleu, terre verte, étoile rouge (couleurs du drapeau) + « A » d'Aqoon. */
export function LogoMark({ size = 36, className = '' }) {
  // identifiant unique : plusieurs logos par page (un SVG masqué casserait le dégradé partagé)
  const gid = `aq-g-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6AB2E7" /><stop offset="1" stopColor="#0071E3" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${gid})`} />
      <path d="M0 44 Q32 34 64 44 V64 H0Z" fill="#12AD2B" />
      <path d="M32 13 L46 41 H38.5 L32 27.5 L25.5 41 H18 Z" fill="#fff" />
      <path d="M32 6.5 l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#D7141A" />
    </svg>
  );
}

export default function Logo({ size = 36, sub = true }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <LogoMark size={size} className="flex-shrink-0 rounded-[22%] shadow-sm" />
      <div className="min-w-0 leading-tight">
        <p className="text-[17px] font-bold text-slate-900 tracking-tight">
          {BRAND.nom} <span className="font-semibold text-primary-600">{BRAND.organisation}</span>
        </p>
        {sub && <p className="text-[11px] text-slate-400 truncate">{BRAND.slogan}</p>}
      </div>
    </div>
  );
}
