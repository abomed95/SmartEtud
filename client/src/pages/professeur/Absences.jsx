import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Save, AlertTriangle } from 'lucide-react';
import { absenceAPI, etudiantAPI, filiereAPI, matiereAPI } from '../../services/api';
import { Spinner } from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: 'PRESENCE', label: '✓ Présent', class: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'RETARD', label: '~ Retard', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'ABSENCE', label: '✗ Absent', class: 'bg-red-100 text-red-700 border-red-200' }
];

export default function ProfAbsences() {
  const [filieres, setFilieres] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [presences, setPresences] = useState({});
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
      const init = {};
      data.forEach(e => { init[e.id] = 'PRESENCE'; });
      setPresences(init);
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  }, [selectedFiliere, selectedNiveau]);

  useEffect(() => { loadEtudiants(); }, [loadEtudiants]);

  const handleSave = async () => {
    const absencesList = Object.entries(presences).map(([etudiantId, type]) => ({ etudiantId, type }));
    if (absencesList.length === 0) return toast.error('Aucun étudiant');

    setSaving(true);
    try {
      const result = await absenceAPI.createBulk({
        absences: absencesList,
        matiereId: selectedMatiere || undefined,
        niveauId: selectedNiveau || undefined,
        date
      });
      toast.success(`Assiduité enregistrée !`);
      if (result.alertes?.length > 0) {
        toast(`⚠️ ${result.alertes.length} étudiant(s) ont 3+ absences !`, { duration: 5000 });
      }
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const absCount = Object.values(presences).filter(v => v === 'ABSENCE').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Saisie des absences</h1>
        <p className="text-slate-500 text-sm mt-1">Marquer la présence pour votre cours</p>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">Paramètres du cours</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <option value="">Tous</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Matière</label>
            <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)} className="input-field text-sm">
              <option value="">Sélectionner...</option>
              {matieres.filter(m => !selectedFiliere || m.filiereId === selectedFiliere).map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field text-sm" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : etudiants.length === 0 ? (
        <div className="card"><EmptyState icon={Calendar} title="Sélectionnez une filière" description="Choisissez une filière pour afficher les étudiants" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="section-title">{etudiants.length} étudiant(s)</h2>
              {absCount > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle size={14} className="text-red-500" />
                  <p className="text-xs text-red-500 font-medium">{absCount} absent(s)</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { const init = {}; etudiants.forEach(e => { init[e.id] = 'PRESENCE'; }); setPresences(init); }}
                className="btn-secondary text-sm"
              >
                Tous présents
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Spinner size={16} className="text-white" /> : <Save size={16} />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {etudiants.map((etu, i) => (
              <motion.div
                key={etu.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  presences[etu.id] === 'ABSENCE' ? 'bg-red-50 border-red-200' :
                  presences[etu.id] === 'RETARD' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${etu.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                    {etu.nom.charAt(0)}{etu.prenom.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">{etu.nom} {etu.prenom}</p>
                    <p className="text-xs text-slate-400 font-mono">{etu.matricule}</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPresences(prev => ({ ...prev, [etu.id]: opt.value }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        presences[etu.id] === opt.value ? opt.class : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
