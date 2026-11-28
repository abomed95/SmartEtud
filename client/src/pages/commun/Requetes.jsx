import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Inbox, Download, ChevronRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { requeteAPI, pdfAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Segmented from '../../components/ui/Segmented';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import { REQUETE_TYPES, REQUETE_STATUTS, formatDate, downloadBlob } from '../../utils/helpers';

const DOCUMENTS = ['ATTESTATION_INSCRIPTION', 'CERTIFICAT_SCOLARITE'];

/** Requêtes administratives — vue étudiant (dépôt/suivi) et vue personnel (traitement). */
export default function Requetes() {
  const { user } = useAuth();
  const isEtudiant = user.role === 'ETUDIANT';
  const [requetes, setRequetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState(isEtudiant ? '' : 'EN_ATTENTE');
  const [nouvelle, setNouvelle] = useState(false);
  const [selection, setSelection] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { type: 'ATTESTATION_INSCRIPTION' } });
  const traitement = useForm();

  const load = useCallback(async () => {
    try { setRequetes(await requeteAPI.getAll({ statut: filtre || undefined })); }
    catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [filtre]);
  useEffect(() => { load(); }, [load]);

  const deposer = async (data) => {
    setSaving(true);
    try {
      await requeteAPI.create(data);
      toast.success('Requête déposée — vous serez informé(e) ici de son traitement');
      setNouvelle(false); reset(); load();
    } catch (e) { toast.error(e.error || 'Erreur'); } finally { setSaving(false); }
  };

  const ouvrir = (r) => { setSelection(r); traitement.reset({ statut: r.statut === 'EN_ATTENTE' ? 'TRAITEE' : r.statut, reponse: r.reponse || '' }); };

  const traiter = async (data) => {
    setSaving(true);
    try {
      await requeteAPI.traiter(selection.id, data);
      toast.success('Requête mise à jour'); setSelection(null); load();
    } catch (e) { toast.error(e.error || 'Erreur'); } finally { setSaving(false); }
  };

  const pdf = async (r) => {
    try { downloadBlob(await pdfAPI.getAttestation(r.etudiant.id, r.type), `${r.type.toLowerCase()}_${r.etudiant.matricule}.pdf`); }
    catch { toast.error('Document indisponible'); }
  };

  const filtres = isEtudiant
    ? [{ value: '', label: 'Toutes' }, { value: 'EN_ATTENTE', label: 'En attente' }, { value: 'TRAITEE', label: 'Traitées' }]
    : [{ value: 'EN_ATTENTE', label: 'En attente' }, { value: 'EN_COURS', label: 'En cours' }, { value: 'TRAITEE', label: 'Traitées' }, { value: '', label: 'Toutes' }];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Requêtes"
        title={isEtudiant ? 'Mes demandes' : 'Requêtes étudiants'}
        subtitle={isEtudiant ? 'Attestations et démarches, déposées et suivies en ligne.' : 'Traitez les demandes sans file d\'attente au guichet.'}
        actions={isEtudiant && <button onClick={() => setNouvelle(true)} className="btn-primary"><Plus size={18} /> Nouvelle requête</button>}
      />
      <div className="overflow-x-auto -mx-1 px-1"><Segmented value={filtre} onChange={setFiltre} options={filtres} /></div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={26} className="text-slate-400" /></div> : requetes.length === 0 ? (
        <div className="card"><EmptyState icon={Inbox} title="Aucune requête" description={isEtudiant ? 'Déposez votre première demande en ligne.' : 'Rien à traiter pour le moment.'} /></div>
      ) : (
        <div className="card overflow-hidden">
          {requetes.map((r) => (
            <div key={r.id} onClick={() => !isEtudiant && ouvrir(r)} role={isEtudiant ? undefined : 'button'}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-separator/40 last:border-0 ${!isEtudiant ? 'cursor-pointer hover:bg-slate-400/5' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[15px] font-medium text-slate-900">{REQUETE_TYPES[r.type]}</p>
                  <span className={REQUETE_STATUTS[r.statut].badge}>{REQUETE_STATUTS[r.statut].label}</span>
                </div>
                <p className="text-[13px] text-slate-500 truncate">
                  {!isEtudiant && `${r.etudiant.prenom} ${r.etudiant.nom} · `}{r.objet}
                </p>
                <p className="text-[12px] text-slate-400 font-mono">{r.numero} · {formatDate(r.createdAt)}</p>
                {isEtudiant && r.reponse && <p className="text-[13px] text-slate-600 mt-1.5 p-2 rounded-lg bg-slate-400/10">↳ {r.reponse}</p>}
              </div>
              {r.statut === 'TRAITEE' && DOCUMENTS.includes(r.type) && (
                <button onClick={(e) => { e.stopPropagation(); pdf(r); }} className="btn-secondary !min-h-[34px] !px-3 text-[13px]"><Download size={14} /> PDF</button>
              )}
              {!isEtudiant && <ChevronRight size={18} className="text-slate-300" />}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={nouvelle} onClose={() => setNouvelle(false)} title="Nouvelle requête">
        <form onSubmit={handleSubmit(deposer)} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-1.5">Type de demande</label>
            <select {...register('type')} className="input-field">
              {Object.entries(REQUETE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1.5">Objet</label>
            <input {...register('objet', { required: 'Objet requis', maxLength: 200 })} className="input-field" placeholder="Ex. : attestation pour dossier de bourse" />
            {errors.objet && <p className="text-danger text-[12px] mt-1">{errors.objet.message}</p>}
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1.5">Précisions (facultatif)</label>
            <textarea {...register('message', { maxLength: 3000 })} rows={4} className="input-field" />
          </div>
          <button disabled={saving} className="btn-primary w-full min-h-[48px]">{saving ? <Spinner className="text-white" /> : 'Déposer la requête'}</button>
        </form>
      </Modal>

      <Modal isOpen={!!selection} onClose={() => setSelection(null)} title={selection ? REQUETE_TYPES[selection.type] : ''}>
        {selection && (
          <form onSubmit={traitement.handleSubmit(traiter)} className="space-y-4">
            <div className="card p-4 space-y-1">
              <p className="text-[15px] font-semibold text-slate-900">{selection.etudiant.prenom} {selection.etudiant.nom}</p>
              <p className="text-[13px] text-slate-500">{selection.etudiant.matricule} · {selection.etudiant.filiere?.nom}</p>
              <p className="text-[14px] text-slate-700 pt-2">{selection.objet}</p>
              {selection.message && <p className="text-[13px] text-slate-500 whitespace-pre-wrap">{selection.message}</p>}
            </div>
            {DOCUMENTS.includes(selection.type) && (
              <button type="button" onClick={() => pdf(selection)} className="btn-secondary w-full"><Download size={16} /> Générer le document PDF</button>
            )}
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Statut</label>
              <select {...traitement.register('statut')} className="input-field">
                {Object.entries(REQUETE_STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Réponse à l'étudiant</label>
              <textarea {...traitement.register('reponse')} rows={3} className="input-field" placeholder="Ex. : document disponible au téléchargement." />
            </div>
            <button disabled={saving} className="btn-primary w-full min-h-[48px]">{saving ? <Spinner className="text-white" /> : <><CheckCircle2 size={18} /> Enregistrer</>}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
