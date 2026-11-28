import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Feuille modale : glisse depuis le bas sur mobile (sheet iOS), centrée sur grand écran.
 * Fermeture : Échap, clic sur le fond, ou bouton.
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);

  const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl', full: 'sm:max-w-6xl' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40" onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={`relative w-full ${sizes[size]} bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-sheet z-10 max-h-[92dvh] flex flex-col`}
          >
            <div className="sm:hidden mx-auto mt-2 w-9 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-3">
              <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-400/15 flex items-center justify-center text-slate-500 hover:bg-slate-400/25" aria-label="Fermer">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 pb-6 pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
