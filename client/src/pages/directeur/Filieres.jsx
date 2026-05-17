import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, School, Pencil, Trash2, Search } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { filiereAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

export default function Filieres() {
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editFil, setEditFil] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: { nom: '', description: '', duree: '', niveaux: [{ nom: 'Niveau 1' }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'niveaux' });

  const load = useCallback(async () => {
    try {
      const data = await filiereAPI.getAll();
      setFilieres(data);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditFil(null);
    reset({ nom: '', description: '', duree: '', niveaux: [{ nom: 'Niveau 1' }, { nom: 'Niveau 2' }] });
    setModalOpen(true);
  };

  const openEdit = (fil) => {
    setEditFil(fil);
    reset({ nom: fil.nom, description: fil.description, duree: fil.duree });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editFil) {
        await filiereAPI.update(editFil.id, data);
        toast.success('Filière modifiée');
      } else {
        await filiereAPI.create(data);
        toast.success('Filière créée !');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await filiereAPI.remove(deleteDialog.id);
      toast.success('Filière supprimée');
      setDeleteDialog(null);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
  };

  const filtered = filieres.filter(f => f.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Filières</h1>
          <p className="text-slate-500 text-sm mt-1">{filieres.length} filière(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} />Nouvelle filière</button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={School} title="Aucune filière" description="Créez votre première filière" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Créer</button>} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((fil, i) => (
            <motion.div key={fil.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <School size={20} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{fil.nom}</h3>
                  {fil.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{fil.description}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Étudiants', value: fil._count?.etudiants || 0 },
                  { label: 'Matières', value: fil._count?.matieres || 0 },
                  { label: 'Durée', value: fil.duree ? `${fil.duree}m` : '—' }
                ].map(item => (
                  <div key={item.label} className="text-center bg-slate-50 rounded-lg py-2">
                    <p className="text-sm font-bold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>

              {fil.niveaux?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {fil.niveaux.map(n => <span key={n.id} className="badge-info">{n.nom}</span>)}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(fil)} className="flex-1 btn-secondary text-xs py-1.5"><Pencil size={13} />Modifier</button>
                <button onClick={() => setDeleteDialog(fil)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editFil ? 'Modifier la filière' : 'Nouvelle filière'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
            <input {...register('nom', { required: 'Requis' })} className="input-field" placeholder="Ex: Informatique & Réseaux" />
            {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea {...register('description')} className="input-field min-h-[80px] resize-none" placeholder="Description de la filière..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Durée (mois)</label>
            <input {...register('duree')} type="number" className="input-field" placeholder="Ex: 24" />
          </div>

          {!editFil && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Niveaux</label>
                <button type="button" onClick={() => append({ nom: `Niveau ${fields.length + 1}` })} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Ajouter niveau</button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input {...register(`niveaux.${index}.nom`, { required: true })} className="input-field flex-1" placeholder={`Niveau ${index + 1}`} />
                    {fields.length > 1 && <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">×</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : null}
              {saving ? 'Enregistrement...' : (editFil ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Supprimer la filière" message={`Supprimer "${deleteDialog?.nom}" ? Les matières associées seront aussi supprimées.`} />
    </div>
  );
}
