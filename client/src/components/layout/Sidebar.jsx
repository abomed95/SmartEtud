import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Users, GraduationCap, BookOpen,
  ClipboardList, CreditCard, Calendar, FileText, Settings,
  LogOut, ChevronRight, Menu, X, UserCircle, School
} from 'lucide-react';
import toast from 'react-hot-toast';

const navConfig = {
  SUPER_ADMIN: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/etablissements', icon: Building2, label: 'Établissements' },
    { path: '/utilisateurs', icon: Users, label: 'Utilisateurs' }
  ],
  DIRECTEUR: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/etudiants', icon: GraduationCap, label: 'Étudiants' },
    { path: '/professeurs', icon: Users, label: 'Professeurs' },
    { path: '/secretaires', icon: UserCircle, label: 'Secrétaires' },
    { path: '/filieres', icon: School, label: 'Filières' },
    { path: '/matieres', icon: BookOpen, label: 'Matières' },
    { path: '/paiements', icon: CreditCard, label: 'Paiements' },
    { path: '/absences', icon: Calendar, label: 'Assiduité' },
    { path: '/rapports', icon: FileText, label: 'Rapports' }
  ],
  PROFESSEUR: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/notes', icon: ClipboardList, label: 'Notes' },
    { path: '/absences', icon: Calendar, label: 'Absences' }
  ],
  SECRETAIRE: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/paiements', icon: CreditCard, label: 'Paiements' },
    { path: '/absences', icon: Calendar, label: 'Assiduité' },
    { path: '/etudiants', icon: GraduationCap, label: 'Étudiants' }
  ]
};

const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  DIRECTEUR: 'Directeur',
  PROFESSEUR: 'Professeur',
  SECRETAIRE: 'Secrétaire'
};

export default function Sidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.aside
          initial={false}
          animate={{ x: isOpen ? 0 : '-100%' }}
          className="fixed top-0 left-0 h-full w-64 bg-dark-900 z-40 flex flex-col lg:translate-x-0 lg:static lg:z-auto transition-transform"
        >
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight">SmartEdu</p>
              <p className="text-slate-400 text-xs truncate">ERP Platform</p>
            </div>
            <button onClick={onToggle} className="lg:hidden p-1 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="px-3 py-4 border-b border-white/10">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-xl">
              <div className="w-8 h-8 bg-primary-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-400 font-bold text-sm">
                  {user?.nom?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.nom} {user?.prenom}</p>
                <p className="text-slate-400 text-xs">{roleLabels[user?.role]}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <link.icon size={18} className="flex-shrink-0" />
                <span className="flex-1">{link.label}</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
            <NavLink to="/profil" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Settings size={18} />
              <span>Paramètres</span>
            </NavLink>
            <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  );
}
