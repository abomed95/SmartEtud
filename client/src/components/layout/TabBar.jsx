import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NAV } from './navigation';

/** Barre d'onglets en bas d'écran (mobile), comme une app iOS. */
export default function TabBar({ onMore }) {
  const { user } = useAuth();
  const all = NAV[user?.role] || [];
  const tabs = all.filter((l) => l.tab).slice(0, all.length > 5 ? 4 : 5);
  const hasMore = all.length > tabs.length;

  const item = 'flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 text-[10px] font-medium transition-colors';
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 material border-t border-separator/50 pb-safe" aria-label="Onglets">
      <div className="flex h-12">
        {tabs.map((t) => (
          <NavLink key={t.path} to={t.path} className={({ isActive }) => `${item} ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
            <t.icon size={22} strokeWidth={2} />
            <span>{t.label}</span>
          </NavLink>
        ))}
        {hasMore && (
          <button onClick={onMore} className={`${item} text-slate-400`}>
            <MoreHorizontal size={22} /><span>Plus</span>
          </button>
        )}
      </div>
    </nav>
  );
}
