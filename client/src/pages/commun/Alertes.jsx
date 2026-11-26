import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Phone, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { alerteAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Loader';
import { RISQUE } from '../../utils/helpers';

/** Alerte précoce : anticiper le décrochage plutôt que le subir. */
export default function Alertes() {
  const [data, setData] = useState(null);
  const [filtre, setFiltre] = useState('ELEVE');
  const [aide, setAide] = useState(false);

  useEffect(() => { alerteAPI.getAll().then(setData).catch(() => toast.error('Erreur de chargement')); }, []);

  const liste = useMemo(() => (data?.etudiants || []).filter((e) => !filtre || e.niveau === filtre), [data, filtre]);

  if (!data) return <div className="flex justify-center py-24"><Spinner size={26} className="text-slate-400" /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Alerte précoce"
        title="Anticiper plutôt que subir"
        subtitle="Risque de décrochage calculé à partir des notes, de l'assiduité et des paiements."
        actions={<button onClick={() => setAide(true)} className="btn-secondary"><Info size={16} /> Méthode</button>}
      />

      <div className="grid grid-cols-3 gap-3">
        {['ELEVE', 'MOYEN', 'FAIBLE'].map((n) => (
          <button key={n} onClick={() => setFiltre(n)} className={`card p-4 text-left transition-all ${filtre === n ? 'ring-2 ring-primary-500' : ''}`}>
            <p className="text-[13px] text-slate-500">Risque {RISQUE[n].label.toLowerCase()}</p>
            <p className="text-[28px] font-bold tabular" style={{ color: RISQUE[n].color }}>{data.resume[n]}</p>
          </button>
        ))}
      </div>

      <Segmented value={filtre} onChange={setFiltre} options={[{ value: 'ELEVE', label: 'Élevé' }, { value: 'MOYEN', label: 'Moyen' }, { value: 'FAIBLE', label: 'Faible' }, { value: '', label: 'Tous' }]} />

      {liste.length === 0 ? <div className="card"><EmptyState icon={ShieldAlert} title="Aucun étudiant dans cette catégorie" /></div> : (
        <div className="card overflow-hidden">
          {liste.map((e) => (
            <div key={e.id} className="flex items-start gap-4 px-4 py-3.5 border-b border-separator/40 last:border-0">
              {/* Jauge circulaire du score */}
              <div className="relative w-11 h-11 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-slate-400/15" />
                  <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" strokeLinecap="round" stroke={RISQUE[e.niveau].color}
                    strokeDasharray={`${(e.score / 100) * 94.2} 94.2`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-slate-900 tabular">{e.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-slate-900">{e.prenom} {e.nom}</p>
                <p className="text-[13px] text-slate-500">{e.filiere?.nom}{e.niveauClasse ? ` · ${e.niveauClasse}` : ''} · moyenne {e.nbNotes ? e.moyenne.toFixed(2) : '—'}</p>
                {e.facteurs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {e.facteurs.map((f) => <span key={f} className="badge-gray">{f}</span>)}
                  </div>
                )}
              </div>
              {e.telephone && <a href={`tel:${e.telephone.replace(/\s/g, '')}`} className="icon-btn text-primary-600" aria-label={`Appeler ${e.prenom}`}><Phone size={17} /></a>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={aide} onClose={() => setAide(false)} title="Comment le score est calculé">
        <div className="space-y-3 text-[14px] text-slate-700">
          <p>Score sur 100, combinaison pondérée de trois indicateurs entre 0 et 1 :</p>
          <div className="card p-4 font-mono text-[13px]">score = 100 × (0,45·R<sub>notes</sub> + 0,35·R<sub>assiduité</sub> + 0,20·R<sub>finances</sub>)</div>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>R<sub>notes</sub></strong> = (12 − moyenne) / 6, borné à [0, 1]</li>
            <li><strong>R<sub>assiduité</sub></strong> = (absences non justifiées + retards/3) / 10</li>
            <li><strong>R<sub>finances</sub></strong> = reste à payer / montant dû</li>
          </ul>
          <p>Seuils : ≥ 60 élevé, 30–59 moyen, &lt; 30 faible.</p>
          <p className="text-slate-500">Les poids sont des valeurs de départ. Ils devront être recalibrés sur les abandons réellement constatés. Ce score aide à prioriser les entretiens ; il ne remplace pas le jugement de l'équipe pédagogique.</p>
        </div>
      </Modal>
    </div>
  );
}
