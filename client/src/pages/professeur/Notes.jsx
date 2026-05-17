import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Save, Search } from 'lucide-react';
import { noteAPI, etudiantAPI, matiereAPI, filiereAPI } from '../../services/api';
import { Spinner } from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { getAppreciation } from '../../utils/helpers';

export default function Notes() {
  const [filieres, setFilieres] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [notes, setNotes] = useState({});
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [periode, setPeriode] = useState('Trimestre 1');
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([filiereAPI.getAll(), matiereAPI.getAll()]).then(([fils, mats]) => {
      setFilieres(fils);
      setMatieres(mats);
    });
  }, []);

  useEffect(() => {
    if (selectedFiliere) {
      const fil = filieres.find(f => f.id === selectedFiliere);
      setNiveaux(fil?.niveaux || []);
      setSelectedNiveau('');
    }
  }, [selectedFiliere, filieres]);

  const loadEtudiants = useCallback(async () => {
    if (!selectedFiliere) return;
    setLoading(true);
    try {
      const data = await etudiantAPI.getAll({
        filiereId: selectedFiliere,
        niveauId: selectedNiveau || undefined,
        statut: 'ACTIF'
      });
      setEtudiants(data);
      const notesInit = {};
      data.forEach(e => { notesInit[e.id] = ''; });
      setNotes(notesInit);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  }, [selectedFiliere, selectedNiveau]);

  useEffect(() => { loadEtudiants(); }, [loadEtudiants]);

  const handleSave = async () => {
    if (!selectedMatiere) return toast.error('Sélectionnez une matière');
    const notesList = Object.entries(notes)
      .filter(([_, v]) => v !== '' && !isNaN(parseFloat(v)))
      .map(([etudiantId, valeur]) => ({ etudiantId, valeur: parseFloat(valeur) }));

    if (notesList.length === 0) return toast.error('Aucune note à enregistrer');

    setSaving(true);
    try {
      await noteAPI.createBulk({
        notes: notesList,
        matiereId: selectedMatiere,
        niveauId: selectedNiveau || undefined,
        periode, annee
      });
      toast.success(`${notesList.length} note(s) enregistrée(s) !`);
      const notesInit = {};
      etudiants.forEach(e => { notesInit[e.id] = ''; });
      setNotes(notesInit);
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filteredMatieres = selectedFiliere
    ? matieres.filter(m => m.filiereId === selectedFiliere)
    : matieres;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Saisie des notes</h1>
        <p className="text-slate-500 text-sm mt-1">Enregistrer les résultats de vos étudiants</p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">Paramètres</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Filière *</label>
            <select value={selectedFiliere} onChange={e => setSelectedFiliere(e.target.value)} className="input-field text-sm">
              <option value="">Sélectionner...</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Niveau</label>
            <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)} className="input-field text-sm">
              <option value="">Tous les niveaux</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Matière *</label>
            <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)} className="input-field text-sm">
              <option value="">Sélectionner...</option>
              {filteredMatieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Période</label>
            <select value={periode} onChange={e => setPeriode(e.target.value)} className="input-field text-sm">
              {['Trimestre 1','Trimestre 2','Trimestre 3','Semestre 1','Semestre 2'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Année</label>
            <input value={annee} onChange={e => setAnnee(e.target.value)} className="input-field text-sm" placeholder="2024-2025" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : etudiants.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="Sélectionnez une filière" description="Choisissez une filière pour afficher les étudiants" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="section-title">{etudiants.length} étudiant(s)</h2>
              <p className="text-xs text-slate-400">Notes sur 20</p>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Spinner size={16} className="text-white" /> : <Save size={16} />}
              {saving ? 'Enregistrement...' : 'Enregistrer tout'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-header">Étudiant</th>
                  <th className="table-header hidden sm:table-cell">Matricule</th>
                  <th className="table-header w-36">Note /20</th>
                  <th className="table-header hidden md:table-cell">Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.map((etu, i) => {
                  const val = notes[etu.id];
                  const appreciation = val !== '' && !isNaN(parseFloat(val))
                    ? getAppreciation(parseFloat(val)) : null;
                  return (
                    <motion.tr key={etu.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${etu.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                            {etu.nom.charAt(0)}{etu.prenom.charAt(0)}
                          </div>
                          <span className="font-medium text-sm text-slate-900">{etu.nom} {etu.prenom}</span>
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell font-mono text-xs text-slate-400">{etu.matricule}</td>
                      <td className="table-cell">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          value={val}
                          onChange={e => setNotes(prev => ({ ...prev, [etu.id]: e.target.value }))}
                          placeholder="—"
                          className={`w-24 px-3 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                            val !== '' && !isNaN(parseFloat(val))
                              ? parseFloat(val) >= 10 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                              : 'border-slate-200'
                          }`}
                        />
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        {appreciation && (
                          <p className="text-xs text-slate-500 max-w-xs truncate">{appreciation.texte}</p>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
