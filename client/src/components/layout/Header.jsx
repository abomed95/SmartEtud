import { Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogoMark } from '../brand/Logo';

const NEXT = { system: 'light', light: 'dark', dark: 'system' };
const ICON = { system: MonitorSmartphone, light: Sun, dark: Moon };
const LABEL = { system: 'Thème : automatique', light: 'Thème : clair', dark: 'Thème : sombre' };

/** Barre supérieure translucide, compacte (le grand titre est porté par chaque page). */
export default function Header() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const ThemeIcon = ICON[theme];

  return (
    <header className="h-12 lg:h-14 material border-b border-separator/40 flex items-center px-4 lg:px-8 gap-3 sticky top-0 z-20 flex-shrink-0">
      <Link to="/dashboard" className="lg:hidden"><LogoMark size={28} className="rounded-[22%]" /></Link>
      <p className="flex-1 text-[13px] text-slate-500 truncate">
        {user?.etablissement?.nom || 'Plateforme'}
      </p>
      <button onClick={() => setTheme(NEXT[theme])} className="icon-btn" title={LABEL[theme]} aria-label={LABEL[theme]}>
        <ThemeIcon size={18} />
      </button>
      <Link to="/profil" className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-dj-blue to-primary-600 flex items-center justify-center text-white text-sm font-bold" aria-label="Profil">
        {(user?.prenom || user?.nom)?.charAt(0)?.toUpperCase()}
      </Link>
    </header>
  );
}
