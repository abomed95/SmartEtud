import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { portailAPI, absenceAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/Loader';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/helpers';

const couleur = (m) => (m >= 12 ? 'bg-success' : m >= 10 ? 'bg-warning' : 'bg-danger');

export default function MesNotes() {
  const [d, setD] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [vue, setVue] = useState('notes');

  useEffect(() => {
    Promise.all([portailAPI.getDossier(), absenceAPI.getAll()])
      .then(([dos, abs]) => { setD(dos); setAbsences(abs.filter((a) => a.type !== 'PRESENCE')); })
      .catch(() => toast.error('Erreur de chargement'));
  }, []);

  if (!d) return <PageLoader />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Données académiques" title="Notes & assiduité" subtitle={`Moyenne générale : ${d.bulletin.moyenneGenerale.toFixed(2)}/20`} />
      <Segmented value={vue} onChange={setVue} options={[{ value: 'notes', label: 'Notes' }, { value: 'absences', label: `Absences (${absences.length})` }]} />

      {vue === 'notes' ? (
        d.bulletin.detailMatieres.length === 0 ? <div className="card"><EmptyState title="Aucune note" description="Vos notes apparaîtront ici dès leur saisie." /></div> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {d.bulletin.detailMatieres.map((m) => (
              <div key={m.matiere.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-900 truncate">{m.matiere.nom}</p>
                    <p className="text-[12px] text-slate-400">Coefficient {m.matiere.coefficient}</p>
                  </div>
                  <p className="text-[22px] font-bold text-slate-900 tabular">{m.moyenne.toFixed(2)}</p>
                </div>
                <div className="h-1.5 rounded-full bg-slate-400/15 mt-3 overflow-hidden">
                  <div className={`h-full rounded-full ${couleur(m.moyenne)}`} style={{ width: `${(m.moyenne / 20) * 100}%` }} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {m.notes.map((n, i) => <span key={i} className="px-2 py-0.5 rounded-md bg-slate-400/10 text-[12px] text-slate-600 tabular">{n}</span>)}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card overflow-hidden">
          {absences.length === 0 ? <EmptyState title="Aucune absence" description="Bravo pour votre assiduité !" /> : absences.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-separator/40 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-slate-900">{a.matiere?.nom || 'Journée'}</p>
                <p className="text-[13px] text-slate-400">{formatDate(a.date)}{a.motif ? ` · ${a.motif}` : ''}</p>
              </div>
              <span className={a.type === 'RETARD' ? 'badge-warning' : 'badge-danger'}>{a.type === 'RETARD' ? 'Retard' : 'Absence'}</span>
              {a.justifiee && <span className="badge-success">Justifiée</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
