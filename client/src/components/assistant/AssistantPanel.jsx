import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp, X, RotateCcw } from 'lucide-react';
import { assistantAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Loader';

const SUGGESTIONS = {
  ETUDIANT: ['Quelle est ma moyenne générale ?', 'Quelles matières dois-je travailler en priorité ?', 'Combien me reste-t-il à payer ?', 'Comment obtenir une attestation ?'],
  PROFESSEUR: ['Quels étudiants sont en difficulté ?', 'Quelle est la moyenne de mes matières ?'],
  DIRECTEUR: ['Résume la situation de l\'établissement', 'Quels étudiants risquent de décrocher ?', 'Où en sont les encaissements ?'],
  SECRETAIRE: ['Combien de requêtes sont en attente ?', 'Quels étudiants ont des impayés importants ?'],
  SUPER_ADMIN: ['Donne-moi un état de la plateforme'],
};

/** Rendu minimal : **gras** et retours à la ligne, sans HTML injecté. */
const Texte = ({ children }) => (
  <p className="whitespace-pre-wrap">
    {children.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}
  </p>
);

/** Bouton flottant « Demander à l'IA » présent sur chaque écran + panneau de discussion. */
export default function AssistantButton() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 250); }, [open]);

  const envoyer = async (texte) => {
    const question = (texte ?? input).trim();
    if (!question || loading) return;
    const next = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { reponse, mode } = await assistantAPI.chat(next, location.pathname);
      setMessages([...next, { role: 'assistant', content: reponse, mode }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: err.error || 'Service momentanément indisponible.', erreur: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className="fixed z-30 right-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:bottom-6 lg:right-8 flex items-center gap-2 pl-3.5 pr-4 h-11 rounded-full text-white text-[14px] font-semibold shadow-lg shadow-primary-600/30 bg-gradient-to-r from-primary-600 to-[#5856D6]"
        aria-label="Demander à l'IA"
      >
        <Sparkles size={17} /> <span className="hidden sm:inline">Demander à l'IA</span><span className="sm:hidden">IA</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-end sm:justify-end sm:p-6" role="dialog" aria-label="Assistant IA">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 sm:bg-black/10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative w-full sm:w-[400px] h-[85dvh] sm:h-[600px] bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-sheet flex flex-col overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 material border-b border-separator/40">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-[#5856D6] flex items-center justify-center text-white"><Sparkles size={16} /></span>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-slate-900">Assistant Aqoon</p>
                  <p className="text-[11px] text-slate-400">Répond à partir de vos données</p>
                </div>
                {messages.length > 0 && <button onClick={() => setMessages([])} className="icon-btn" title="Nouvelle conversation"><RotateCcw size={16} /></button>}
                <button onClick={() => setOpen(false)} className="icon-btn" aria-label="Fermer"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-[15px]">
                {messages.length === 0 && (
                  <div className="pt-6 text-center">
                    <p className="text-[22px] font-bold text-slate-900">Bonjour {user?.prenom || user?.nom} 👋</p>
                    <p className="text-[14px] text-slate-500 mt-1 mb-6">Posez une question en français, somali, afar ou arabe.</p>
                    <div className="space-y-2">
                      {(SUGGESTIONS[user?.role] || []).map((s) => (
                        <button key={s} onClick={() => envoyer(s)} className="w-full text-left card px-4 py-3 text-[14px] text-primary-600 hover:shadow-card-hover transition-shadow">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3.5 py-2 rounded-[18px] ${m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : m.erreur ? 'bg-danger/10 text-danger rounded-bl-md' : 'bg-surface text-slate-900 shadow-card rounded-bl-md'}`}>
                      <Texte>{m.content}</Texte>
                      {m.mode === 'hors-ligne' && <p className="text-[10px] opacity-60 mt-1">Mode hors-ligne</p>}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start"><div className="bg-surface shadow-card rounded-[18px] rounded-bl-md px-4 py-3"><Spinner size={16} className="text-slate-400" /></div></div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); envoyer(); }} className="p-3 pb-safe material border-t border-separator/40 flex items-end gap-2">
                <textarea
                  ref={inputRef} rows={1} value={input} maxLength={2000}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                  placeholder="Votre question…"
                  className="flex-1 resize-none max-h-28 px-4 py-2.5 rounded-[20px] bg-surface border border-separator/60 text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <button type="submit" disabled={!input.trim() || loading} aria-label="Envoyer"
                  className="w-9 h-9 mb-0.5 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-30 transition-opacity">
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
