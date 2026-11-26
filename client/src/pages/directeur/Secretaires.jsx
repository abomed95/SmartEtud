import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserCircle, Search, Pencil, Trash2, Key, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { userAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

export default function Secretaires() {
  const [secretaires, setSecretaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [editSec, setEditSec] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regReset, handleSubmit: handleReset, reset: resetPwd } = useForm();

  const load = useCallback(async () => {
    try {
      const data = await userAPI.getAll({ role: 'SECRETAIRE' });
      setSecretaires(data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditSec(null); reset(); setModalOpen(true); };
  const openEdit = (sec) => {
    setEditSec(sec);
    reset({ nom: sec.nom, prenom: sec.prenom, telephone: sec.telephone });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editSec) {
        await userAPI.update(editSec.id, data);
        toast.success('Secrétaire modifiée');
      } else {
        await userAPI.create({ ...data, role: 'SECRETAIRE' });
        toast.success('Secrétaire créée !');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (sec) => {
    try {
      await userAPI.update(sec.id, { actif: !sec.actif });
      toast.success(sec.actif ? 'Compte désactivé' : 'Compte activé');
      load();
    } catch { toast.error('Erreur'); }
  };

  const onResetPassword = async (data) => {
    try {
      await userAPI.resetPassword(resetModal.id, data);
      toast.success('Mot de passe réinitialisé');
      setResetModal(null);
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    try {
      await userAPI.remove(deleteDialog.id);
      toast.success('Secrétaire supprimée');
      setDeleteDialog(null);
      load();
    } catch { toast.error('Erreur'); }
  };

  const filtered = secretaires.filter(s =>
    `${s.nom} ${s.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Secrétaires</h1>
          <p className="text-slate-500 text-sm mt-1">{secretaires.length} secrétaire(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} />Ajouter une secrétaire</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={UserCircle} title="Aucune secrétaire" description="Créez un compte secrétaire" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Créer</button>} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sec, i) => (
            <motion.div key={sec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 text-teal-700 font-bold">
                  {sec.nom?.charAt(0)}{sec.prenom?.charAt(0) || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{sec.nom} {sec.prenom}</p>
                  <p className="text-xs text-slate-400 truncate">{sec.email}</p>
                  {sec.telephone && <p className="text-xs text-slate-400">📞 {sec.telephone}</p>}
                </div>
                <span className={sec.actif ? 'badge-success' : 'badge-danger'}>{sec.actif ? 'Actif' : 'Inactif'}</span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-3 text-xs text-slate-500">
                <p className="font-medium text-slate-700 mb-1">Permissions :</p>
                <ul className="space-y-0.5">
                  <li>✅ Gestion des paiements</li>
                  <li>✅ Gestion de l'assiduité</li>
                  <li>✅ Consultation étudiants</li>
                  <li>❌ Notes & administration</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => handleToggle(sec)} className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${sec.actif ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  {sec.actif ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  {sec.actif ? 'Désactiver' : 'Activer'}
                </button>
                <button onClick={() => openEdit(sec)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                <button onClick={() => { setResetModal(sec); resetPwd(); }} className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"><Key size={16} /></button>
                <button onClick={() => setDeleteDialog(sec)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editSec ? 'Modifier secrétaire' : 'Nouvelle secrétaire'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input {...register('nom', { required: 'Requis' })} className="input-field" />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input {...register('prenom')} className="input-field" />
            </div>
          </div>
          {!editSec && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input {...register('email', { required: 'Requis' })} type="email" className="input-field" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
            <input {...register('telephone')} className="input-field" placeholder="+253..." />
          </div>
          {!editSec && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
              <input {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Min 8' } })} type="password" className="input-field" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : null}
              {saving ? 'Enregistrement...' : (editSec ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!resetModal} onClose={() => setResetModal(null)} title="Réinitialiser le mot de passe" size="sm">
        <form onSubmit={handleReset(onResetPassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe *</label>
            <input {...regReset('newPassword', { required: 'Requis', minLength: { value: 8, message: 'Min 8' } })} type="password" className="input-field" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setResetModal(null)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">Réinitialiser</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Supprimer la secrétaire" message={`Supprimer le compte de "${deleteDialog?.nom} ${deleteDialog?.prenom}" ?`} />
    </div>
  );
}
