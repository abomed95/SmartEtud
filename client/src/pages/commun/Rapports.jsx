import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, FileBadge } from 'lucide-react';
import toast from 'react-hot-toast';
import { etudiantAPI, pdfAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Loader';
import { downloadBlob } from '../../utils/helpers';

/** Génération des bulletins et attestations PDF par étudiant. */
export default function Rapports() {
  const [etudiants, setEtudiants] = useState(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => { etudiantAPI.getAll().then(setEtudiants).catch(() => toast.error('Erreur de chargement')); }, []);

  const liste = useMemo(() => (etudiants || []).filter((e) =>
    `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase())), [etudiants, search]);

  const dl = async (e, kind) => {
    setBusy(`${e.id}-${kind}`);
    try {
      const blob = kind === 'bulletin' ? await pdfAPI.getBulletin(e.id) : await pdfAPI.getAttestation(e.id, 'ATTESTATION_INSCRIPTION');
      downloadBlob(blob, `${kind}_${e.matricule}.pdf`);
    } catch { toast.error('Génération impossible'); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Documents" title="Bulletins & attestations" subtitle="Documents PDF officiels, générés à la demande." />
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou matricule" className="input-field pl-10" />
      </div>
      {!etudiants ? <div className="flex justify-center py-16"><Spinner size={26} className="text-slate-400" /></div> : (
        <div className="card overflow-hidden">
          {liste.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-separator/40 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-slate-900">{e.nom} {e.prenom}</p>
                <p className="text-[13px] text-slate-400">{e.matricule} · {e.filiere?.nom}</p>
              </div>
              <button onClick={() => dl(e, 'bulletin')} className="btn-secondary !min-h-[34px] !px-3 text-[13px]" disabled={!!busy}>
                {busy === `${e.id}-bulletin` ? <Spinner size={14} /> : <FileText size={14} />} Bulletin
              </button>
              <button onClick={() => dl(e, 'attestation')} className="btn-secondary !min-h-[34px] !px-3 text-[13px] hidden sm:inline-flex" disabled={!!busy}>
                {busy === `${e.id}-attestation` ? <Spinner size={14} /> : <FileBadge size={14} />} Attestation
              </button>
            </div>
          ))}
          {liste.length === 0 && <p className="text-center text-slate-400 py-10 text-[14px]">Aucun étudiant</p>}
        </div>
      )}
    </div>
  );
}
