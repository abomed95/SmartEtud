import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Award, CalendarX, Wallet, Inbox, PlayCircle, ChevronRight, ShieldAlert, Target, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { portailAPI, pdfAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/Loader';
import { formatCurrency, RISQUE, downloadBlob } from '../../utils/helpers';

const moisFr = (m) => new Date(`${m}-01`).toLocaleDateString('fr-FR', { month: 'short' });

/** Anneau de progression (style Activité d'Apple) pour la moyenne générale. */
function Anneau({ valeur, max = 20, size = 132 }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, valeur / max));
  const couleur = valeur >= 12 ? '#34C759' : valeur >= 10 ? '#FF9500' : '#FF3B30';
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-400/15" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={couleur} strokeWidth="12" fill="none" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - p) }}
        transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }} />
    </svg>
  );
}

export default function EtudiantDashboard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    portailAPI.getDossier().then(setD).catch((e) => toast.error(e.error || 'Erreur de chargement'));
  }, []);

  if (!d) return <PageLoader />;
  const { etudiant, bulletin, assiduite, finances, risque, evolution, requetes } = d;
  const enCours = (requetes.EN_ATTENTE || 0) + (requetes.EN_COURS || 0);

  const telechargerBulletin = async () => {
    try { downloadBlob(await pdfAPI.getBulletin(etudiant.id), `bulletin_${etudiant.matricule}.pdf`); }
    catch { toast.error('Téléchargement impossible'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${etudiant.filiere?.nom} · ${etudiant.niveau?.nom || ''}`}
        title={`Bonjour ${etudiant.prenom}`}
        subtitle={`Matricule ${etudiant.matricule}`}
        actions={<button onClick={telechargerBulletin} className="btn-secondary"><Download size={16} /> Bulletin PDF</button>}
      />

      {/* Carte héros : moyenne + appréciation */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <Anneau valeur={bulletin.moyenneGenerale} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-bold text-slate-900 tabular leading-none">{bulletin.moyenneGenerale.toFixed(2)}</span>
            <span className="text-[12px] text-slate-400">/ 20</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="eyebrow">Moyenne générale</p>
          <p className="text-[17px] text-slate-700 mt-1">{bulletin.appreciation.texte}</p>
          <Link to="/mes-notes" className="btn-plain mt-3">Détail par matière <ChevronRight size={16} /></Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Matières" value={bulletin.detailMatieres.length} icon={Award} color="indigo" sub="notées ce semestre" delay={0.05} />
        <StatCard title="Absences" value={assiduite.absences} icon={CalendarX} color={assiduite.nonJustifiees >= 3 ? 'red' : 'teal'} sub={`${assiduite.nonJustifiees} non justifiée(s)`} delay={0.1} />
        <StatCard title="Reste à payer" value={formatCurrency(finances.reste)} icon={Wallet} color={finances.reste > 0 ? 'yellow' : 'green'} sub={`sur ${formatCurrency(finances.du)}`} delay={0.15} />
        <StatCard title="Requêtes" value={enCours} icon={Inbox} color="blue" sub="en cours de traitement" delay={0.2} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Évolution des notes */}
        <div className="card p-5 lg:col-span-3">
          <h2 className="section-title mb-4">Évolution</h2>
          {evolution.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={evolution.map((e) => ({ ...e, label: moisFr(e.mois) }))} margin={{ left: -24, right: 8 }}>
                <defs>
                  <linearGradient id="evo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0071E3" stopOpacity={0.3} /><stop offset="100%" stopColor="#0071E3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8E8E93' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 20]} ticks={[0, 10, 20]} tick={{ fontSize: 12, fill: '#8E8E93' }} axisLine={false} tickLine={false} />
                <ReferenceLine y={10} stroke="#8E8E93" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Tooltip contentStyle={{ background: 'rgba(28,28,30,.92)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13 }} formatter={(v) => [`${v}/20`, 'Moyenne']} />
                <Area type="monotone" dataKey="moyenne" stroke="#0071E3" strokeWidth={2.5} fill="url(#evo)" dot={{ r: 3, fill: '#0071E3' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-[14px] text-slate-400 py-10 text-center">Pas encore assez de notes pour afficher une tendance.</p>}
        </div>

        {/* Alerte précoce */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title flex items-center gap-2"><ShieldAlert size={18} className="text-primary-600" /> Mon suivi</h2>
            {risque && <span className={RISQUE[risque.niveau].badge}>Vigilance {RISQUE[risque.niveau].label.toLowerCase()}</span>}
          </div>
          {risque?.facteurs?.length ? (
            <ul className="space-y-2 text-[14px] text-slate-700">
              {risque.facteurs.map((f) => <li key={f} className="flex gap-2"><span className="text-warning">●</span>{f}</li>)}
            </ul>
          ) : <p className="text-[14px] text-slate-500">Tout va bien. Continuez ainsi ! 🎉</p>}
          {risque?.moyenneCible && (
            <div className="mt-4 p-3 rounded-xl bg-primary-500/10 flex gap-3 items-start">
              <Target size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate-700">
                Pour atteindre <strong>10/20</strong>, visez une moyenne d'au moins <strong>{risque.moyenneCible}/20</strong> sur vos prochaines évaluations.
              </p>
            </div>
          )}
          <p className="text-[12px] text-slate-400 mt-4">Une question ? Touchez « Demander à l'IA ».</p>
        </div>
      </div>

      {/* Raccourcis — liste groupée */}
      <div className="card overflow-hidden">
        {[
          { to: '/videos', icon: PlayCircle, color: 'bg-[#FF2D55]', label: 'Cours vidéo', detail: `${d.videosDisponibles} disponible(s)` },
          { to: '/requetes', icon: Inbox, color: 'bg-[#0071E3]', label: 'Demander une attestation', detail: 'En ligne, sans file d\'attente' },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 px-4 py-3 border-b border-separator/40 last:border-0 hover:bg-slate-400/5">
            <span className={`w-8 h-8 rounded-lg ${l.color} text-white flex items-center justify-center`}><l.icon size={17} /></span>
            <span className="flex-1 text-[15px] text-slate-900">{l.label}</span>
            <span className="text-[14px] text-slate-400 hidden sm:inline">{l.detail}</span>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
