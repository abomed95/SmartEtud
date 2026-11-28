import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Search, FileDown, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { paiementAPI, etudiantAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const TYPE_PAI = ['ESPECES','VIREMENT','CHEQUE','MOBILE_MONEY'];
const STATUT_BADGE = { PAYE: 'badge-success', PARTIEL: 'badge-warning', IMPAYE: 'badge-danger' };

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPai, setEditPai] = useState(null);
  const [saving, setSaving] = useState(false);
  const [etudiants, setEtudiants] = useState([]);
  const [searchEtu, setSearchEtu] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const watchMontant = watch('montant');
  const watchMontantPaye = watch('montantPaye');

  const load = useCallback(async () => {
    try {
      const data = await paiementAPI.getAll({ search: search || undefined, statut: filterStatut || undefined });
      setPaiements(data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [search, filterStatut]);

  useEffect(() => { load(); }, [load]);

  const loadEtudiants = async (q) => {
    if (!q || q.length < 2) return;
    try {
      const data = await etudiantAPI.getAll({ search: q });
      setEtudiants(data);
    } catch {}
  };

  const openCreate = () => { setEditPai(null); reset({ annee: new Date().getFullYear().toString() }); setModalOpen(true); };
  const openEdit = (pai) => {
    setEditPai(pai);
    reset({ montantPaye: pai.montantPaye, typePaiement: pai.typePaiement, description: pai.description });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editPai) {
        await paiementAPI.update(editPai.id, data);
        toast.success('Paiement modifié');
      } else {
        await paiementAPI.create(data);
        toast.success('Paiement enregistré !');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const downloadRecu = async (id) => {
    try {
      const blob = await fetch(`/api/pdf/recu/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `recu-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Erreur PDF'); }
  };

  const totalRevenus = paiements.reduce((s, p) => s + p.montantPaye, 0);
  const totalImpayes = paiements.filter(p => p.statut !== 'PAYE').reduce((s, p) => s + (p.montant - p.montantPaye), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Paiements</h1>
          <p className="text-slate-500 text-sm mt-1">{paiements.length} paiement(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} />Nouveau paiement</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Total encaissé</p>
          <p className="text-2xl font-bold text-green-600">{totalRevenus.toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-400">FDJ</span></p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Total impayé</p>
          <p className="text-2xl font-bold text-red-600">{totalImpayes.toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-400">FDJ</span></p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par étudiant..." className="input-field pl-9" />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="input-field sm:w-44">
          <option value="">Tous les statuts</option>
          <option value="PAYE">Payé</option>
          <option value="PARTIEL">Partiel</option>
          <option value="IMPAYE">Impayé</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : paiements.length === 0 ? (
        <div className="card"><EmptyState icon={CreditCard} title="Aucun paiement" description="Enregistrez votre premier paiement" action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Nouveau</button>} /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-header">Étudiant</th>
                  <th className="table-header hidden md:table-cell">Référence</th>
                  <th className="table-header">Montant</th>
                  <th className="table-header hidden sm:table-cell">Période</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map((pai, i) => (
                  <motion.tr key={pai.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{pai.etudiant?.nom} {pai.etudiant?.prenom}</p>
                        <p className="text-xs text-slate-400">{pai.etudiant?.filiere?.nom}</p>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell font-mono text-xs text-slate-500">{pai.reference}</td>
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{pai.montantPaye.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FDJ</span></p>
                        {pai.montant !== pai.montantPaye && <p className="text-xs text-slate-400">/ {pai.montant.toLocaleString('fr-FR')}</p>}
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-slate-500 text-sm">{pai.mois} {pai.annee}</td>
                    <td className="table-cell"><span className={STATUT_BADGE[pai.statut] || 'badge-gray'}>{pai.statut}</span></td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(pai)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => downloadRecu(pai.id)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><FileDown size={15} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editPai ? 'Modifier paiement' : 'Nouveau paiement'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editPai && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Étudiant *</label>
                <div className="relative">
                  <input
                    onChange={e => { setSearchEtu(e.target.value); loadEtudiants(e.target.value); }}
                    value={searchEtu}
                    placeholder="Rechercher étudiant..."
                    className="input-field"
                  />
                  {etudiants.length > 0 && searchEtu && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                      {etudiants.map(e => (
                        <button
                          key={e.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                          onClick={() => {
                            document.querySelector('[name=etudiantId]')?.setAttribute('value', e.id);
                            setSearchEtu(`${e.nom} ${e.prenom} (${e.matricule})`);
                            setEtudiants([]);
                          }}
                        >
                          {e.nom} {e.prenom} — {e.matricule}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input {...register('etudiantId', { required: 'Requis' })} type="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant total *</label>
                  <input {...register('montant', { required: 'Requis', min: 1 })} type="number" className="input-field" placeholder="Ex: 25000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant payé</label>
                  <input {...register('montantPaye')} type="number" className="input-field" placeholder="Laisser vide si total" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mois</label>
                  <select {...register('mois')} className="input-field">
                    <option value="">Sélectionner...</option>
                    {MOIS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Année</label>
                  <input {...register('annee')} className="input-field" placeholder={new Date().getFullYear()} />
                </div>
              </div>
            </>
          )}

          {editPai && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant payé</label>
              <input {...register('montantPaye', { required: 'Requis' })} type="number" className="input-field" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de paiement</label>
            <select {...register('typePaiement')} className="input-field">
              <option value="">Sélectionner...</option>
              {TYPE_PAI.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input {...register('description')} className="input-field" placeholder="Frais de scolarité..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size={16} className="text-white" /> : <Plus size={16} />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
