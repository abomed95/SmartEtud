import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { NAV } from './navigation';
import Logo from '../brand/Logo';
import { ROLE_LABELS } from '../../utils/helpers';

/** Barre latérale translucide (matériau « sidebar » macOS) — visible à partir de 1024 px. */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('À bientôt !');
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col h-full material border-r border-separator/50">
      <div className="px-4 pt-5 pb-4"><Logo /></div>

      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto" aria-label="Navigation principale">
        {links.map((link) => (
          <NavLink key={link.path} to={link.path} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <link.icon size={18} className="flex-shrink-0 text-primary-600" strokeWidth={2} />
            <span className="flex-1">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-separator/50 space-y-0.5">
        <NavLink to="/profil" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <div className="w-7 h-7 -ml-0.5 rounded-full bg-gradient-to-br from-dj-blue to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.prenom || user?.nom)?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold">{user?.prenom} {user?.nom}</p>
            <p className="text-[11px] opacity-70">{ROLE_LABELS[user?.role]}</p>
          </div>
          <Settings size={16} className="opacity-60" />
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link w-full text-danger hover:bg-danger/10">
          <LogOut size={18} /><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
