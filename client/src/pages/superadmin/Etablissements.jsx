import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { etablissementAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

export default function Etablissements() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    try {
      const data = await etablissementAPI.getAll();
      setEtablissements(data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await etablissementAPI.create(data);
      toast.success('Établissement créé avec succès !');
      setModalOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.error || 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  const handleToggle = async (etab) => {
    try {
      const newStatut = etab.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
      await etablissementAPI.toggleStatut(etab.id, newStatut);
      toast.success(`Établissement ${newStatut === 'ACTIF' ? 'activé' : 'suspendu'}`);
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    try {
      await etablissementAPI.remove(deleteDialog.id);
      toast.success('Établissement supprimé');
      setDeleteDialog(null);
      load();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const filtered = etablissements.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Établissements</h1>
          <p className="text-slate-500 text-sm mt-1">{etablissements.length} établissement(s)</p>
        </div>
        <button onClick={() => { reset(); setModalOpen(true); }} className="btn-primary">
          <Plus size={18} /> Créer un établissement
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un établissement..."
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Building2} title="Aucun établissement" description="Créez votre premier établissement" action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} />Créer</button>} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((etab, i) => (
            <motion.div
              key={etab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{etab.nom}</h3>
                  <p className="text-xs text-slate-400 truncate">{etab.adresse || 'Adresse non renseignée'}</p>
                </div>
                <span className={etab.statut === 'ACTIF' ? 'badge-success' : 'badge-danger'}>
                  {etab.statut}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Étudiants', value: etab._count?.etudiants || 0 },
                  { label: 'Filières', value: etab._count?.filieres || 0 },
                  { label: 'Utilisateurs', value: etab._count?.users || 0 }
                ].map(item => (
                  <div key={item.label} className="text-center bg-slate-50 rounded-lg py-2">
                    <p className="text-lg font-bold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>

              {etab.telephone && (
                <p className="text-xs text-slate-400 mb-3">📞 {etab.telephone}</p>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggle(etab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors ${etab.statut === 'ACTIF' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                >
                  {etab.statut === 'ACTIF' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  {etab.statut === 'ACTIF' ? 'Suspendre' : 'Activer'}
                </button>
                <button
                  onClick={() => setDeleteDialog(etab)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvel établissement" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Informations de l'établissement</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input {...register('nom', { required: 'Nom requis' })} className="input-field" placeholder="Centre de formation..." />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input {...register('telephone')} className="input-field" placeholder="+253..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input {...register('email')} type="email" className="input-field" placeholder="contact@..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input {...register('adresse')} className="input-field" placeholder="Adresse complète" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Compte Directeur</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input {...register('dirNom', { required: 'Requis' })} className="input-field" placeholder="Nom du directeur" />
                {errors.dirNom && <p className="text-red-500 text-xs mt-1">{errors.dirNom.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <input {...register('dirPrenom')} className="input-field" placeholder="Prénom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input {...register('dirEmail', { required: 'Requis' })} type="email" className="input-field" placeholder="directeur@..." />
                {errors.dirEmail && <p className="text-red-500 text-xs mt-1">{errors.dirEmail.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input {...register('dirTelephone')} className="input-field" placeholder="+253..." />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
                <input {...register('dirPassword', { required: 'Requis', minLength: { value: 6, message: 'Min 6 caractères' } })} type="password" className="input-field" placeholder="••••••••" />
                {errors.dirPassword && <p className="text-red-500 text-xs mt-1">{errors.dirPassword.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : <Plus size={16} />}
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Supprimer l'établissement"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteDialog?.nom}" ? Toutes les données seront perdues.`}
      />
    </div>
  );
}
