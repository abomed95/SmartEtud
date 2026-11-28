import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Search, Pencil, Trash2, Key } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { userAPI, matiereAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

export default function Professeurs() {
  const [professeurs, setProfesseurs] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [editProf, setEditProf] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedMatieres, setSelectedMatieres] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regReset, handleSubmit: handleReset, reset: resetPwd } = useForm();

  const load = useCallback(async () => {
    try {
      const [profs, mats] = await Promise.all([
        userAPI.getAll({ role: 'PROFESSEUR' }),
        matiereAPI.getAll()
      ]);
      setProfesseurs(profs);
      setMatieres(mats);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditProf(null); setSelectedMatieres([]); reset(); setModalOpen(true); };
  const openEdit = (prof) => {
    setEditProf(prof);
    const mIds = prof.professeur?.matieres?.map(pm => pm.matiere.id) || [];
    setSelectedMatieres(mIds);
    reset({ nom: prof.nom, prenom: prof.prenom, telephone: prof.telephone, specialite: prof.professeur?.specialite });
    setModalOpen(true);
  };

  const toggleMatiere = (id) => {
    setSelectedMatieres(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = { ...data, role: 'PROFESSEUR', matiereIds: selectedMatieres };
      if (editProf) {
        await userAPI.update(editProf.id, payload);
        toast.success('Professeur modifié');
      } else {
        await userAPI.create(payload);
        toast.success('Professeur créé !');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const onResetPassword = async (data) => {
    try {
      await userAPI.resetPassword(resetModal.id, data);
      toast.success('Mot de passe réinitialisé');
      setResetModal(null);
      resetPwd();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    try {
      await userAPI.remove(deleteDialog.id);
      toast.success('Professeur supprimé');
      setDeleteDialog(null);
      load();
    } catch { toast.error('Erreur'); }
  };

  const filtered = professeurs.filter(p =>
    `${p.nom} ${p.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Professeurs</h1>
          <p className="text-slate-500 text-sm mt-1">{professeurs.length} professeur(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} />Ajouter un professeur</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title="Aucun professeur" description="Ajoutez votre premier professeur" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Ajouter</button>} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((prof, i) => (
            <motion.div key={prof.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold">
                  {prof.nom.charAt(0)}{prof.prenom?.charAt(0) || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{prof.nom} {prof.prenom}</p>
                  <p className="text-xs text-slate-400 truncate">{prof.email}</p>
                  {prof.professeur?.specialite && (
                    <p className="text-xs text-indigo-600 mt-0.5 truncate">{prof.professeur.specialite}</p>
                  )}
                </div>
                <span className={prof.actif ? 'badge-success' : 'badge-danger'}>{prof.actif ? 'Actif' : 'Inactif'}</span>
              </div>

              {prof.professeur?.matieres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {prof.professeur.matieres.slice(0, 3).map(pm => (
                    <span key={pm.matiere?.id} className="badge-info">{pm.matiere?.nom}</span>
                  ))}
                  {prof.professeur.matieres.length > 3 && (
                    <span className="badge-gray">+{prof.professeur.matieres.length - 3}</span>
                  )}
                </div>
              )}

              {prof.telephone && <p className="text-xs text-slate-400 mb-3">📞 {prof.telephone}</p>}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(prof)} className="flex-1 btn-secondary text-xs py-1.5"><Pencil size={13} />Modifier</button>
                <button onClick={() => { setResetModal(prof); resetPwd(); }} className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"><Key size={16} /></button>
                <button onClick={() => setDeleteDialog(prof)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProf ? 'Modifier professeur' : 'Ajouter un professeur'} size="md">
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
          {!editProf && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input {...register('email', { required: 'Requis' })} type="email" className="input-field" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input {...register('telephone')} className="input-field" placeholder="+253..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Spécialité</label>
              <input {...register('specialite')} className="input-field" placeholder="Développement Web..." />
            </div>
          </div>
          {!editProf && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
              <input {...register('password', { required: !editProf ? 'Requis' : false, minLength: { value: 8, message: 'Min 8' } })} type="password" className="input-field" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Matières enseignées</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg">
              {matieres.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMatiere(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedMatieres.includes(m.id) ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {m.nom}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : null}
              {saving ? 'Enregistrement...' : (editProf ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!resetModal} onClose={() => setResetModal(null)} title="Réinitialiser le mot de passe" size="sm">
        <form onSubmit={handleReset(onResetPassword)} className="space-y-4">
          <p className="text-sm text-slate-600">Nouveau mot de passe pour <strong>{resetModal?.nom}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe *</label>
            <input {...regReset('newPassword', { required: 'Requis', minLength: { value: 8, message: 'Min 8 caractères' } })} type="password" className="input-field" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setResetModal(null)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">Réinitialiser</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Supprimer le professeur" message={`Supprimer "${deleteDialog?.nom} ${deleteDialog?.prenom}" ?`} />
    </div>
  );
}
