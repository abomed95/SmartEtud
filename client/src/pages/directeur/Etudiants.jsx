import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, GraduationCap, Search, Trash2, Pencil, KeyRound, FileText, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { etudiantAPI, filiereAPI, pdfAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { downloadBlob } from '../../utils/helpers';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

const SEXE_OPTIONS = [{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }];
const STATUT_OPTIONS = [{ value: 'ACTIF', label: 'Actif' }, { value: 'INACTIF', label: 'Inactif' }, { value: 'SUSPENDU', label: 'Suspendu' }];

export default function Etudiants() {
  const [etudiants, setEtudiants] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFiliere, setFilterFiliere] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEtu, setEditEtu] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedNiveaux, setSelectedNiveaux] = useState([]);
  const [acces, setAcces] = useState(null);       // étudiant pour lequel on crée l'accès portail
  const [accesEmail, setAccesEmail] = useState('');
  const [identifiants, setIdentifiants] = useState(null); // mot de passe temporaire à transmettre
  const { user } = useAuth();
  const isDirecteur = user?.role === 'DIRECTEUR';

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const watchFiliere = watch('filiereId');

  const load = useCallback(async () => {
    try {
      const [etudData, filData] = await Promise.all([
        etudiantAPI.getAll({ search: search || undefined, filiereId: filterFiliere || undefined }),
        filiereAPI.getAll()
      ]);
      setEtudiants(etudData);
      setFilieres(filData);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [search, filterFiliere]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (watchFiliere) {
      const fil = filieres.find(f => f.id === watchFiliere);
      setSelectedNiveaux(fil?.niveaux || []);
    }
  }, [watchFiliere, filieres]);

  const openCreate = () => { setEditEtu(null); reset(); setModalOpen(true); };
  const openEdit = (etu) => {
    setEditEtu(etu);
    reset({
      nom: etu.nom, prenom: etu.prenom, telephone: etu.telephone, email: etu.email,
      sexe: etu.sexe, dateNaissance: etu.dateNaissance?.slice(0, 10),
      filiereId: etu.filiereId, niveauId: etu.niveauId, statut: etu.statut
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editEtu) {
        await etudiantAPI.update(editEtu.id, data);
        toast.success('Étudiant modifié');
      } else {
        await etudiantAPI.create(data);
        toast.success('Étudiant inscrit avec succès !');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await etudiantAPI.remove(deleteDialog.id);
      toast.success('Étudiant supprimé');
      setDeleteDialog(null);
      load();
    } catch { toast.error('Erreur'); }
  };

  const creerAcces = async () => {
    try {
      const r = await etudiantAPI.createCompte(acces.id, { email: accesEmail });
      setIdentifiants(r);
      setAcces(null);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
  };

  const bulletin = async (etu) => {
    try { downloadBlob(await pdfAPI.getBulletin(etu.id), `bulletin_${etu.matricule}.pdf`); }
    catch { toast.error('Génération impossible'); }
  };

  const badgeStatut = { ACTIF: 'badge-success', INACTIF: 'badge-gray', SUSPENDU: 'badge-danger' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Étudiants</h1>
          <p className="text-slate-500 text-sm mt-1">{etudiants.length} étudiant(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={18} /> Inscrire un étudiant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, téléphone, matricule..." className="input-field pl-9" />
        </div>
        <select value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)} className="input-field sm:w-48">
          <option value="">Toutes les filières</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : etudiants.length === 0 ? (
        <div className="card"><EmptyState icon={GraduationCap} title="Aucun étudiant" description="Inscrivez votre premier étudiant" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Inscrire</button>} /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-header">Étudiant</th>
                  <th className="table-header hidden md:table-cell">Matricule</th>
                  <th className="table-header hidden sm:table-cell">Filière</th>
                  <th className="table-header hidden lg:table-cell">Contact</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.map((etu, i) => (
                  <motion.tr
                    key={etu.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${etu.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {etu.nom.charAt(0)}{etu.prenom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{etu.nom} {etu.prenom}</p>
                          <p className="text-xs text-slate-400 sm:hidden">{etu.filiere?.nom}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{etu.matricule}</span>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-slate-600">{etu.filiere?.nom}</td>
                    <td className="table-cell hidden lg:table-cell text-slate-500">{etu.telephone || '—'}</td>
                    <td className="table-cell">
                      <span className={badgeStatut[etu.statut] || 'badge-gray'}>{etu.statut}</span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => bulletin(etu)} title="Bulletin PDF" className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <FileText size={15} />
                        </button>
                        <button onClick={() => { setAcces(etu); setAccesEmail(etu.user?.email || etu.email || ''); }} title={etu.user ? 'Réinitialiser l\'accès portail' : 'Créer l\'accès portail'}
                          className={`p-1.5 rounded-lg transition-colors hover:bg-primary-50 ${etu.user ? 'text-success' : 'text-slate-400 hover:text-primary-600'}`}>
                          <KeyRound size={15} />
                        </button>
                        {isDirecteur && <button onClick={() => openEdit(etu)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>}
                        {isDirecteur && <button onClick={() => setDeleteDialog(etu)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editEtu ? 'Modifier étudiant' : 'Inscrire un étudiant'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input {...register('nom', { required: 'Requis' })} className="input-field" placeholder="Nom de famille" />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
              <input {...register('prenom', { required: 'Requis' })} className="input-field" placeholder="Prénom" />
              {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input {...register('telephone')} className="input-field" placeholder="+253..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input {...register('email')} type="email" className="input-field" placeholder="email@..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sexe</label>
              <select {...register('sexe')} className="input-field">
                {SEXE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de naissance</label>
              <input {...register('dateNaissance')} type="date" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Filière *</label>
              <select {...register('filiereId', { required: 'Requis' })} className="input-field">
                <option value="">Sélectionner...</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
              {errors.filiereId && <p className="text-red-500 text-xs mt-1">{errors.filiereId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Niveau</label>
              <select {...register('niveauId')} className="input-field">
                <option value="">Sélectionner...</option>
                {selectedNiveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
              </select>
            </div>
            {editEtu && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select {...register('statut')} className="input-field">
                  {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : <Plus size={16} />}
              {saving ? 'Enregistrement...' : (editEtu ? 'Modifier' : 'Inscrire')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!acces} onClose={() => setAcces(null)} title="Accès au portail étudiant" size="sm">
        <div className="space-y-4">
          <p className="text-[14px] text-slate-600">
            {acces?.user ? 'Un nouveau mot de passe temporaire sera généré pour ' : 'Créez un compte pour que '}
            <strong>{acces?.prenom} {acces?.nom}</strong>{acces?.user ? '.' : ' consulte ses notes, dépose ses requêtes et suive ses cours vidéo.'}
          </p>
          <input value={accesEmail} onChange={e => setAccesEmail(e.target.value)} disabled={!!acces?.user} type="email" className="input-field" placeholder="email de l'étudiant" />
          <button onClick={creerAcces} className="btn-primary w-full min-h-[46px]"><KeyRound size={16} /> {acces?.user ? 'Réinitialiser' : 'Créer l\'accès'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!identifiants} onClose={() => setIdentifiants(null)} title="Identifiants à transmettre" size="sm">
        <div className="space-y-3">
          <div className="card p-4 font-mono text-[14px] space-y-1">
            <p>{identifiants?.email}</p>
            <p className="text-[18px] font-bold">{identifiants?.tempPassword}</p>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(`${identifiants.email} / ${identifiants.tempPassword}`); toast.success('Copié'); }} className="btn-secondary w-full"><Copy size={16} /> Copier</button>
          <p className="text-[12px] text-slate-500">Ce mot de passe ne sera plus affiché. Demandez à l'étudiant de le changer dans « Réglages » dès sa première connexion.</p>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Supprimer l'étudiant"
        message={`Supprimer "${deleteDialog?.nom} ${deleteDialog?.prenom}" ? Cette action est irréversible.`}
      />
    </div>
  );
}
