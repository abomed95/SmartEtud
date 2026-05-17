import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Pencil, Trash2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { matiereAPI, filiereAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

export default function Matieres() {
  const [matieres, setMatieres] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFiliere, setFilterFiliere] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMat, setEditMat] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = useCallback(async () => {
    try {
      const [mats, fils] = await Promise.all([
        matiereAPI.getAll({ filiereId: filterFiliere || undefined }),
        filiereAPI.getAll()
      ]);
      setMatieres(mats);
      setFilieres(fils);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  }, [filterFiliere]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditMat(null); reset(); setModalOpen(true); };
  const openEdit = (mat) => {
    setEditMat(mat);
    reset({ nom: mat.nom, coefficient: mat.coefficient, heuresTotal: mat.heuresTotal, filiereId: mat.filiereId });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editMat) {
        await matiereAPI.update(editMat.id, data);
        toast.success('Matière modifiée');
      } else {
        await matiereAPI.create(data);
        toast.success('Matière créée !');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await matiereAPI.remove(deleteDialog.id);
      toast.success('Matière supprimée');
      setDeleteDialog(null);
      load();
    } catch { toast.error('Erreur'); }
  };

  const filtered = matieres.filter(m => m.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Matières</h1>
          <p className="text-slate-500 text-sm mt-1">{matieres.length} matière(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} />Ajouter une matière</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-9" />
        </div>
        <select value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)} className="input-field w-48">
          <option value="">Toutes les filières</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={BookOpen} title="Aucune matière" description="Ajoutez votre première matière" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Ajouter</button>} /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-header">Matière</th>
                <th className="table-header">Filière</th>
                <th className="table-header hidden sm:table-cell">Coefficient</th>
                <th className="table-header hidden md:table-cell">Heures</th>
                <th className="table-header hidden sm:table-cell">Professeur(s)</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mat, i) => (
                <motion.tr key={mat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen size={14} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-slate-900 text-sm">{mat.nom}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600 text-sm">{mat.filiere?.nom}</td>
                  <td className="table-cell hidden sm:table-cell">
                    <span className="font-semibold text-slate-900">{mat.coefficient}×</span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-slate-500">{mat.heuresTotal ? `${mat.heuresTotal}h` : '—'}</td>
                  <td className="table-cell hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {mat.professeurs?.slice(0, 2).map(pm => (
                        <span key={pm.professeur?.id} className="badge-gray">
                          {pm.professeur?.user?.nom}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(mat)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteDialog(mat)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMat ? 'Modifier matière' : 'Nouvelle matière'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
            <input {...register('nom', { required: 'Requis' })} className="input-field" placeholder="Ex: Développement Web" />
            {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filière *</label>
            <select {...register('filiereId', { required: 'Requis' })} className="input-field">
              <option value="">Sélectionner...</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            {errors.filiereId && <p className="text-red-500 text-xs mt-1">{errors.filiereId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coefficient</label>
              <input {...register('coefficient')} type="number" step="0.5" min="0.5" className="input-field" placeholder="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heures totales</label>
              <input {...register('heuresTotal')} type="number" className="input-field" placeholder="Ex: 60" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : null}
              {saving ? 'Enregistrement...' : (editMat ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Supprimer la matière" message={`Supprimer "${deleteDialog?.nom}" ? Les notes associées seront supprimées.`} />
    </div>
  );
}
