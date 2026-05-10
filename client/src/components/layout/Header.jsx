import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onToggleSidebar }) {
  const { user } = useAuth();

  const greetings = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 gap-4 sticky top-0 z-20 flex-shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
      >
        <Menu size={20} className="text-slate-600" />
      </button>

      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 hidden sm:block">
          {greetings()}, <span className="text-primary-600">{user?.prenom || user?.nom}</span> 👋
        </p>
        {user?.etablissement && (
          <p className="text-xs text-slate-400">{user.etablissement.nom}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={20} className="text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer">
          <span className="text-white text-sm font-bold">
            {user?.nom?.charAt(0)?.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
