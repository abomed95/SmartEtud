import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Supprimer', danger = true }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl z-10 p-6"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <AlertTriangle size={24} className={danger ? 'text-red-600' : 'text-yellow-600'} />
            </div>
            <h3 className="text-lg font-semibold text-center text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 text-center mb-6">{message}</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
              <button onClick={onConfirm} className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmText}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
