import { useState } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import TabBar from './TabBar';
import Modal from '../ui/Modal';
import AssistantButton from '../assistant/AssistantPanel';
import { NAV } from './navigation';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 lg:pt-8 pb-28 lg:pb-12"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <TabBar onMore={() => setMoreOpen(true)} />
      <AssistantButton />

      {/* Menu « Plus » (mobile) : liste groupée iOS */}
      <Modal isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="Menu" size="sm">
        <div className="card overflow-hidden -mx-1">
          {(NAV[user?.role] || []).map((l) => (
            <NavLink key={l.path} to={l.path} onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-4 py-3 border-b border-separator/40 last:border-0 text-[15px] text-slate-900 active:bg-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center"><l.icon size={16} /></span>
              {l.label}
            </NavLink>
          ))}
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="mt-4 w-full card px-4 py-3 text-danger font-medium flex items-center justify-center gap-2">
          <LogOut size={16} /> Déconnexion
        </button>
      </Modal>
    </div>
  );
}
