import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Pencil, Trash2, Key } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { userAPI, etablissementAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  SUPER_ADMIN: 'badge-danger',
  DIRECTEUR: 'badge-info',
  PROFESSEUR: 'badge-warning',
  SECRETAIRE: 'badge-success'
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin', DIRECTEUR: 'Directeur', PROFESSEUR: 'Professeur', SECRETAIRE: 'Secrétaire'
};

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const { register: regReset, handleSubmit: handleReset, reset: resetPwd } = useForm();
  const watchRole = watch('role');

  const load = useCallback(async () => {
    try {
      const [usrs, etabs] = await Promise.all([
        userAPI.getAll({ role: filterRole || undefined }),
        etablissementAPI.getAll()
      ]);
      setUsers(usrs);
      setEtablissements(etabs);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  }, [filterRole]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await userAPI.create(data);
      toast.success('Utilisateur créé !');
      setModalOpen(false);
      reset();
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const onReset = async (data) => {
    try {
      await userAPI.resetPassword(resetModal.id, data);
      toast.success('Mot de passe réinitialisé');
      setResetModal(null);
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    try {
      await userAPI.remove(deleteDialog.id);
      toast.success('Utilisateur supprimé');
      setDeleteDialog(null);
      load();
    } catch { toast.error('Erreur'); }
  };

  const filtered = users.filter(u =>
    `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} utilisateur(s)</p>
        </div>
        <button onClick={() => { reset(); setModalOpen(true); }} className="btn-primary"><Plus size={18} />Créer un utilisateur</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-9" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field w-44">
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="Aucun utilisateur" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-header">Utilisateur</th>
                  <th className="table-header">Rôle</th>
                  <th className="table-header hidden md:table-cell">Établissement</th>
                  <th className="table-header hidden sm:table-cell">Statut</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                          {u.nom.charAt(0)}{u.prenom?.charAt(0) || ''}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{u.nom} {u.prenom}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell"><span className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</span></td>
                    <td className="table-cell hidden md:table-cell text-slate-500 text-sm">{u.etablissement?.nom || '—'}</td>
                    <td className="table-cell hidden sm:table-cell"><span className={u.actif ? 'badge-success' : 'badge-danger'}>{u.actif ? 'Actif' : 'Inactif'}</span></td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setResetModal(u); resetPwd(); }} className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"><Key size={15} /></button>
                        <button onClick={() => setDeleteDialog(u)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Créer un utilisateur" size="md">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input {...register('email', { required: 'Requis' })} type="email" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rôle *</label>
              <select {...register('role', { required: 'Requis' })} className="input-field">
                <option value="">Sélectionner...</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input {...register('telephone')} className="input-field" />
            </div>
          </div>
          {watchRole && watchRole !== 'SUPER_ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Établissement *</label>
              <select {...register('etablissementId', { required: 'Requis' })} className="input-field">
                <option value="">Sélectionner...</option>
                {etablissements.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
            <input {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Min 8' } })} type="password" className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : null}
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!resetModal} onClose={() => setResetModal(null)} title="Réinitialiser le mot de passe" size="sm">
        <form onSubmit={handleReset(onReset)} className="space-y-4">
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

      <ConfirmDialog isOpen={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Supprimer l'utilisateur" message={`Supprimer "${deleteDialog?.nom} ${deleteDialog?.prenom}" ?`} />
    </div>
  );
}
