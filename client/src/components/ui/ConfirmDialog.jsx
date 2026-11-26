import { motion, AnimatePresence } from 'framer-motion';

/** Alerte de confirmation façon iOS : titre, message, deux boutons séparés par un filet. */
export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Supprimer', danger = true }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="alertdialog" aria-modal="true">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[290px] material rounded-2xl z-10 overflow-hidden text-center"
          >
            <div className="px-5 pt-5 pb-4">
              <h3 className="text-[17px] font-semibold text-slate-900">{title}</h3>
              <p className="text-[13px] text-slate-600 mt-1">{message}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-separator/60">
              <button onClick={onClose} className="py-3 text-[17px] text-primary-600 border-r border-separator/60 active:bg-slate-400/10">Annuler</button>
              <button onClick={onConfirm} className={`py-3 text-[17px] font-semibold active:bg-slate-400/10 ${danger ? 'text-danger' : 'text-primary-600'}`}>{confirmText}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
